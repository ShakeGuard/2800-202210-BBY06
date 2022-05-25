#!/usr/bin/node
"use strict";

import * as mdb from 'mongodb';
import {MongoClient} from 'mongodb';
import express from 'express';
import {WebSocketServer} from 'ws';
import {createServer} from 'http';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {readdir, readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import multer from 'multer';
import path from 'node:path'
// Use `yargs` to parse command-line arguments.
import {accessLog, addDevLog, errorLog, log, stdoutLog} from './logging.mjs';
import {getProfile, patchProfile} from "./profile.mjs";
import {connectMongo, dbName, dbURL} from "./db.mjs";
import {checkLoginError, sessionParser} from "./sessions.mjs";
import {argv} from "./arguments.mjs";
import {getLogin, makePostLoginRoute, postLogout} from "./login.mjs";
import {changeLoginButton, loadHeaderFooter, loadHTMLComponent} from "./domUtils.js";
import {getResource, getResourcePage} from "./resources.mjs";

const app = express();
const upload = multer();

// Log in 'dev' format to stdout, if devLog option is set.
// If devLog is not set, log errors only to stdout.
if (argv.devLog) {
	app.use(stdoutLog);
	addDevLog(log);
} else {
	app.use(errorLog)
}
app.use(accessLog);


// The MongoDB Connection object.
/** @type {?MongoClient} */
let mongo = null;
/** The MongoDB Database object.
  * Populated by the `{@link connectMongo()} function.
  * @type {?mdb.Db} */
let db = null;


log.info("Connecting to MongoDB instance…");

try {
	[mongo, db] = await connectMongo(dbURL, dbName);
} catch (err) {
	log.error(`Could not connect to MongoDB instance at ${dbURL}/${dbName}!`);
	log.error(JSON.stringify(err, null, 2));
}

app.use(express.json({limit: '50mb'}));
app.use(sessionParser);




// Static path mappings: Everything in `/public` is accessible to the public, beware!
const staticRouteNames = await readdir(process.cwd() + path.sep + 'public');
for (const staticRoute of staticRouteNames) {
	log.debug(`registering static route for "public/${staticRoute}" -> "GET /${staticRoute}"`)
	app.use(`/${staticRoute}`, express.static(`public/${staticRoute}`))
}

app.get('/', async function (req, res) {
	if (req.session.loggedIn) {
		if (req.session.isAdmin) {
			res.redirect('/dashboard');
		} else {
			res.redirect('/profile');
		}
		log.info("User logged in!");
		return;
	}

	const doc = await readFile("./html/index.html", "utf8");
	const baseDOM = new JSDOM(doc);
	let index = await loadHeaderFooter(baseDOM);
	index = changeLoginButton(index, req);
	res.send(index.serialize());
});

app.get('/profile-details', async(req, res) => {
	// Check that the user is logged in.

	const filterQuery = {emailAddress: req.session.email};

	const userResults = await db.collection('BBY-6_users').find(filterQuery).toArray();
	if(userResults.length === 0) {
		// Could not find user
		res.status(500).send("userNotFound");
		return;
	} else {
		// res.setHeader("Content-Type", "application/json");
		res.status(200).send({
			name: req.session.name,
			email: req.session.email
		})
	}

})

/**
 * Redirects non-logged-in users to the `'/login'` route.
 * @param {Response} res - Response object, may get redirected
 * @returns `true` if the user was redirected, `false` otherwise.
 */
function redirectToLogin(req, res) {
	if (!req.session || !req.session.loggedIn) {
		res.redirect("/login");
		return true;
	}
	return false;
}

app.get('/profile', getProfile(db));
app.patch('/profile', patchProfile(db))

app.get('/avatar', async(req, res) => {
	//if the request is not coming from a logged in user, reject.
	if (checkLoginError(req, res)) {
		return;
	}

	const results = await db.collection('BBY-6_users').findOne({emailAddress:req.session.email});
	let data, mimeType;
	if (results?.avatar === null) {
		// TODO: factor this out into a separate function/global constant/something.
		data = await readFile("./public/images/Default-Profile-Picture.txt", "utf-8");
		mimeType = 'image/jpeg';
	}
	res.status(200).send({
		mimeType: results.avatar?.contentType ?? mimeType,
		data: results.avatar?.data?.$binary?.base64 ?? data
	})
})

app.post('/avatar', upload.single("avatar"), async(req, res) => {
	//if the request is not coming from a logged in user, reject.
	if (checkLoginError(req, res)) {
		return;
	}

	const results = await db.collection('BBY-6_users').updateOne({emailAddress:req.session.email}, {
		$set: {
			avatar: {
				data: {
					$binary: {
						base64: req.file.buffer
					}
				},
				contentType: req.file.mimetype
			}
		}
	})
	res.status(200).send("avatarUploaded");
})

app.get('/dashboard', async function (req, res) {
	if (req.session.isAdmin) {

		let dashboardDoc = fs.readFileSync("./html/dashboard.html", "utf-8");
		const baseDOM = new JSDOM(dashboardDoc);
		let dashboard = await loadHeaderFooter(baseDOM);
		dashboard = changeLoginButton(dashboard, req);
		let profileDetails = await loadHTMLComponent(dashboard, "#Base-Container", "div", "./templates/profile.html");
		profileDetails = await loadHTMLComponent(dashboard, "#kit-templates", "div", "./templates/kit.html");
	    profileDetails.window.document.getElementById("FullName").defaultValue = req.session.name;
		profileDetails.window.document.getElementById("Email").defaultValue = req.session.email;
		res.send(dashboard.serialize());
	} else {
		// Unauthorized! TODO: test
		res.redirect('/profile');
	}
});

// This gets the admin profiles
// May change endpoint name to be more descriptive, or not
app.get('/profiles', async function (req, res) {
	if (!req.session.isAdmin) {
		res.status(401).send('notAnAdmin');
		// TODO: log unauthorized access?
		return;
	}

	// TODO: error handling
	// TODO: really, we should do pagination for this kind of request.
	const usersCursor = db.collection('BBY-6_users').find({'admin': true})
	// Omit password hashes!
	// There is probably a better way of doing this; any suggestions?
	.map(user => {
		delete user.pwd;
		return user;
	});

	res.json(
		{
			page: 0,
			pageSize: null,
			result: await usersCursor.toArray()
		}
	);
})

/**
 * @typedef { {
 *      _id: ?mdb.ObjectId,
 *      name: string,
 *      emailAddress: string,
 *      pwd: string,
 *      admin: boolean,
 *      avatar: ?object,
 *      dateJoined: ?Date,
 * 	    achievements: ?string[],
 * 		kits: ?object[]
 * } } UserDoc
 * */
app.post('/create-user', upload.single('avatar'), async function (req, res) {
	// req.file is the value of 'avatar' specified in the formData

	if (!req.session.isAdmin) {
		res.status(401).send('notAnAdmin');
		return;
	}

	try {
		// Default values
		const uploadedAvatar = req.file ? {
			data: {
				$binary: {
					base64: req.file.buffer
				}
			},
			contentType: req.file.mimetype
		} : undefined;
		const defaultProfilePicture = await readFile("./public/images/Default-Profile-Picture.txt", "utf-8");
		const defaultAvatar = {
			data: {
				$binary: {
					base64: defaultProfilePicture
				}
			},
			contentType: 'image/jpeg'
		}
		const defaultAchievements = ["gettingStarted", "planKit", "finishKit"];
		const defaultKits = [];
		/** @type {UserDoc} */
		const newUserDoc = {
			_id: req.body?._id ?? undefined,
			name: req.body?.name ?? undefined,
			emailAddress: req.body?.emailAddress ?? undefined,
			pwd: req.body?.pwd ?? undefined,
			admin: (req.body?.admin == 'true') ? true : false, // Doing this because formdata can't send booleans
			avatar: uploadedAvatar ?? defaultAvatar,
			dateJoined: req.body?.dateJoined ?? undefined,
			achievements: req.body?.achievements ?? defaultAchievements,
			kits: req.body?.kits ?? defaultKits
		};

		const requiredFields = ["name", "emailAddress", "pwd"];
		const acceptable = requiredFields.reduce(
			(validSoFar, current) => validSoFar && (newUserDoc[current] !== undefined), true
		);

		if (!acceptable) {
			const missingFields = requiredFields.filter(field => newUserDoc[field] === undefined);
			throw new Error(`"Create user" request missing required fields: ${missingFields.join(', ')}`);
		}

		// All required fields present, time to convert the data into a good format.
		const hashPassword = bcrypt.hash(newUserDoc.pwd, 10);
		let convertedDate = new Date(newUserDoc.dateJoined);
		if (isNaN(convertedDate.valueOf())) {
			convertedDate = new Date();
		}
		try {
			await db.collection('BBY-6_users').insertOne({
				name: newUserDoc.name,
				emailAddress: newUserDoc.emailAddress,
				pwd: await hashPassword,
				avatar: newUserDoc.avatar,
				dateJoined: convertedDate,
				achievements: newUserDoc.achievements,
				admin: newUserDoc.admin,
				kits: newUserDoc.kits
			});
			res.status(200).send("createdUserSuccess");
		} catch(err) {
			// Error inserting into database!
			// Later on, log. For now, just rethrow.
			throw (err);
		}
	} catch(err) {
		if (err.code === 11000) {
			res.status(500).send("duplicateKey");
			return;
		}
		res.status(500).send("serverIssue");
	}
});

// Update the admin's name
// TODO: fix response text 
app.post('/edit-admin', async function (req, res) {
	if (!req.session.isAdmin) {
		res.status(401).send('notAnAdmin');
		// TODO: log unauthorized access?
		return;
	}

	// The next few chunks of code was copied/adapted from jay/alex's work on the profile page
	// Get user from db
	const filterQuery = {'_id': new mdb.ObjectId(req.body._id)};
	const userResults = await db.collection('BBY-6_users').find(filterQuery).toArray();
	if(userResults.length === 0) {
		// Could not find user
		res.status(500).send("userNotFound");
		return;
	}

	// based on what is present in the update query,
	const updateQuery = {};
	if (req.body.name) {
		// name to be changed
		updateQuery['name'] = req.body.name;
	}

	if(updateQuery === {}){
		// invalid body, reject request
		res.status(400).send("missingBodyArgument(s)");
		return;
	}

	try {
		const results = await db.collection('BBY-6_users').updateOne(filterQuery, { $set: updateQuery});
		if(results.matchedCount === 0) {
			// Couldn't find the user
			res.status(404).send("userNotFound");
		} else {
			// Edit session name if the req is the same person
			if (req.session._id === req.body._id) {
				req.session.name = req.body.name;
			}
			res.status(200).send("userUpdated");
		}
	} catch(e) {
		res.status(500).send("serverIssue");
	}

});

// Delete admin users
// TODO: fix response text, review and test this.......
app.post('/delete-admin', async function(req, res) {
	if (!req.session.isAdmin) {
		res.status(401).send('notAnAdmin');
		// TODO: log unauthorized access?
		return;
	}

	// Get user from db
	const filterQuery = {'_id': new mdb.ObjectId(req.body._id)};
	const userResults = await db.collection('BBY-6_users').find(filterQuery).toArray();
	if(userResults.length === 0) {
		// Could not find user
		res.status(500).send("userNotFound");
		return;
	}

	try {
		if (req.session._id === req.body._id) {
			// TODO: review/revise the response text
			res.status(405).send("deleteAdminFailed");
		} else {
			db.collection('BBY-6_users').deleteOne(filterQuery);
			res.status(200).send("deleteAdminSuccessful");
		}
	} catch (e) {
		res.status(500).send("serverIssue");
	}
});

app.get('/kits', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	const filterQuery = {'_id': new mdb.ObjectId(req.session._id)};
	const user = await db.collection('BBY-6_users').findOne(filterQuery);
	if(!user) {
		// Could not find user
		res.status(500).send("userNotFound");
		return;
	}
	res.status(200).send(user.kits);
})

app.post('/kits', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	try {
		const filterQuery = {'name': req.body.name};
		const kitTemplate = await db.collection('BBY-6_kit-templates').findOne(filterQuery);
		if(!kitTemplate) {
			res.status(500).send("kitTemplateNotFound");
			return;
		}
		try {
			const userFilterQuery = {'_id': new mdb.ObjectId(req.session._id)};
			kitTemplate.kit = kitTemplate.kit.map(element => {
				element.required = true;
				element.completed = false;
				return element;
			})
			const user = await db.collection('BBY-6_users').updateOne(userFilterQuery, {$push: {kits: kitTemplate}});
			if(!user) {
				// Could not find user
				res.status(500).send("userNotFound");
				return;
			}
			res.status(200).send(kitTemplate);
		} catch(e) {
			res.status(500).send("serverIssue");
		}
	} catch(e) {
		res.status(500).send("serverIssue");
	}
})

app.patch('/kits', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	if(!req.body || !req.body._id || !req.body.itemId || req.body.completed === undefined) {
		res.status(400).send("missingBodyArguments");
		return;
	}
	const filterQuery = {
		'_id': new mdb.ObjectId(req.session._id),
		'kits._id': new mdb.ObjectId(req.body._id),
	}
	try {
		const result = await db.collection('BBY-6_users').updateOne(filterQuery, {$set: {"kits.$[i].kit.$[j].completed": req.body.completed}},
			{
				arrayFilters: [
					{"i._id": new mdb.ObjectId(req.body._id)},
					{"j._id": new mdb.ObjectId(req.body.itemId)}
				]
			}
		);
		if(!result) {
			// Could not find user
			res.status(500).send("couldNotFindUser");
			return;
		} else if (result.matchedCount === 0) {
			// Could not find kit
			res.status(404).send("couldNotFindKit");
			return;
		}
		res.status(200).send("kitUpdatedSuccessfully");
	} catch(e) {
		res.status(500).send("serverIssue");
	}
})

app.delete('/kits', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	if(!req.body || !req.body._id) {
		res.status(400).send("missingBodyArguments");
		return;
	}
	const filterQuery = {
		'_id': new mdb.ObjectId(req.session._id),
		'kits._id': new mdb.ObjectId(req.body._id)
	}
	try {
		req.body._id = new mdb.ObjectId(req.body._id);
		const result = await db.collection('BBY-6_users').updateOne(filterQuery, {$pull: {"kits": {"_id": new mdb.ObjectId(req.body._id)}}});
		if(!result) {
			// Could not find user
			res.status(500).send("couldNotFindUser");
			return;
		} else if (result.matchedCount === 0) {
			// Could not find kit
			res.status(404).send("couldNotFindKit");
			return;
		}
		res.status(200).send("kitDeletedSuccessfully");
	} catch(e) {
		log.error(e)
		res.status(500).send("serverIssue");
	}
})

app.post('/add-item', upload.single('image'), async(req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	if(!req.body || !req.body._id || !req.body.itemProps || !req.file) {
		res.status(400).send("missingBodyArguments");
		return;
	}
	const filterQuery = {
		'_id': new mdb.ObjectId(req.session._id),
		'kits._id': new mdb.ObjectId(req.body._id)
	}
	const itemProps = JSON.parse(req.body.itemProps);
	const newItem = {
		name: itemProps.name,
		quantity: itemProps.quantity,
		description: itemProps.description,
		image: {
			data: {
				$binary: {
					base64: req.file.buffer
				}
			},
			contentType: req.file.mimetype
		},
		completed: itemProps.completed,
		required: itemProps.required,
		_id: new mdb.ObjectId()
	}
	try {
		const result = await db.collection('BBY-6_users').updateOne(filterQuery, {$push: {"kits.$.kit": newItem}});
		if(!result) {
			// Could not find user
			res.status(500).send("couldNotFindUser");
			return;
		} else if (result.matchedCount === 0) {
			// Could not find kit
			res.status(404).send("couldNotFindKit");
			return;
		}
		res.status(200).send("itemAddedSuccessfully");
	} catch(e) {
		res.status(500).send("serverIssue");
	}
})

app.patch('/edit-item', async (req,res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	if(!req.body || !req.body._id || !req.body.itemProps) {
		res.status(400).send("missingBodyArguments");
		return;
	}
	const filterQuery = {
		'_id': new mdb.ObjectId(req.session._id),
		'kits._id': new mdb.ObjectId(req.body._id),
	}
	try {
		req.body.itemProps._id = new mdb.ObjectId(req.body.itemProps._id);
		const result = await db.collection('BBY-6_users').updateOne(filterQuery, {$set: {"kits.$[i].kit.$[j]": req.body.itemProps}},
			{
				arrayFilters: [
					{"i._id": new mdb.ObjectId(req.body._id)},
					{"j._id": new mdb.ObjectId(req.body.itemProps._id)}
				]
			}
		);
		if(!result) {
			// Could not find user
			res.status(500).send("couldNotFindUser");
			return;
		} else if (result.matchedCount === 0) {
			// Could not find kit
			res.status(404).send("couldNotFindKit");
			return;
		}
		res.status(200).send("kitUpdatedSuccessfully");
	} catch(e) {
		log.info(e)
		res.status(500).send("serverIssue");
	}
})

app.delete('/delete-item', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	if(!req.body || !req.body._id || !req.body.itemId) {
		res.status(400).send("missingBodyArguments");
		return;
	}
	const filterQuery = {
		'_id': new mdb.ObjectId(req.session._id),
		'kits._id': new mdb.ObjectId(req.body._id)
	}
	try {
		req.body._id = new mdb.ObjectId(req.body._id);
		const result = await db.collection('BBY-6_users').updateOne(filterQuery,
			{
				$pull: {
						"kits.$[i].kit": {
							"_id": new mdb.ObjectId(req.body.itemId),
							"required": false
						}
				}
			},
			{
				arrayFilters: [
					{"i._id": new mdb.ObjectId(req.body._id)}
				]
			}
		);
		if(!result) {
			// Could not find user
			res.status(500).send("couldNotFindUser");
			return;
		} else if (result.matchedCount === 0) {
			// Could not find kit
			res.status(404).send("couldNotFindKit");
			return;
		} else if (result.modifiedCount === 0) {
			res.status(401).send("cannotDeleteRequiredItem");
			return;
		}
		res.status(200).send("itemDeletedSuccessfully");
	} catch(e) {
		res.status(500).send("serverIssue");
	}
})

app.get('/kit-templates', async (req, res) => {
	const results = await db.collection('BBY-6_kit-templates').find({}).toArray();
	res.status(200).send(results);
})

app.get('/login', getLogin);

app.post("/login", makePostLoginRoute(db))

app.post("/logout", postLogout)

app.get('/resource', getResource);
app.get("/resource_page:pageNum", getResourcePage);

// RUN SERVER
const port = argv.port ?? 8000;
const server = createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', function connection(ws, request, client) {

});

server.on('upgrade', function upgrade(request, socket, head) {
	// Parse session and check if the user requesting the upgrade has an active admin session
	sessionParser(request, {}, () => {
		// Only respond to upgrades at the `/changes` URI
		if (new URL(request.url, `http://${request.headers.host}`).pathname === '/changes') {
			if (!request.session.isAdmin) {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				socket.destroy();
			}
		} else {
			socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
			socket.destroy();
		}
	})
});
server.listen(port, function () {
    log.info(`Server listening on http://localhost:${port}`);
})
