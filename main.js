"use strict";

import { MongoClient } from 'mongodb';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'JSDOM';
import multer from 'multer';

// Use `yargs` to parse command-line arguments.
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Grab secrets file
import { readSecrets } from './shakeguardSecrets.mjs'

console.log = () => {};
console.dir = () => {};
console.error = () => {};

const secrets = await readSecrets();

const argv = yargs(hideBin(process.argv))
  .option('instanceAddress', {
    alias: 'i',
    description: "The IP address or hostname of the MongoDB instance to connect the app to. Defaults to `localhost`.",
    type: 'string'
  })
  .option('instancePort', {
    alias: 'p',
    description: "The port number that the MongoDB instance listens on. Defaults to `27017`.",
    type: 'number'
  })
  .option('dbName', {
	  alias: 'db',
	  description: "The name of the database to use in the MongoDB instance. Defaults to `COMP2800`.",
	  type: 'string'
  })
  .option('auth', {
		description: "If `--auth true`, the app will attempt to log into the MongoDB instance with"
				+  "the username and password specified in the file `.secrets/mongodb_auth.json`.",
		type: 'boolean'	
  })
  .help()
  .alias('help', 'h').parse();

const app = express();
const upload = multer();
// Defaults for address and port:
const url = `mongodb://${argv.instanceAddress ?? 'localhost'}:${argv.instancePort ?? '27017'}`;

const dbName = argv.dbName ?? "COMP2800";

// The MongoDB connection and Database objects.
// Populated by the connectMongo(…) function.
let mongo, db;

// Establishes connection and returns necessary objects to interact with database
// Caller is resonsible for closing the connection
// TODO:
// * Do this exactly once when the app starts up, save the connection.
const connectMongo = async (url, dbName) => {

	let mongo, db;

	let dotAnim; // Interval handler for the "dots" animation.
	try {
		dotAnim = setInterval(() => process.stdout.write('…'), 1000);
		mongo = await Promise.race([
			MongoClient.connect(url, {
				auth: argv.auth ? {
					...secrets['mongodb_auth.json']
				} : undefined,
				useNewUrlParser: true,
				useUnifiedTopology: true,
			}),
			new Promise((res,rej) => {
				setTimeout(() => rej("Timed out after 15 seconds."), 15000)
			})
		]);
		db = mongo.db(dbName);
		initDatabase(db);
		console.log(`Connected to "${url}", using database "${dbName}"`);
	} catch (error) {
		console.log(); // Newline!
		console.error(`Tried connecting to ${url}, using database ${dbName}`);
		console.error("Ran into an error while connecting to MongoDB!");
		switch (error.message) {
			case "credentials must be an object with 'username' and 'password' properties":
				if (argv.auth) {
					console.error("Error: --auth option was set, but secrets module could "
								+ "not load username and password for MongoDB instance!");
					console.error("Try redownloading .secrets or running without the --auth option.")
				}
				break;
		
			default:
				break;
		}

		console.error('Error object details:');
		console.dir(error);

		console.error('Exiting early due to errors!')
		// TODO: consider any cleanup code before exiting: any open file handles?
		process.exit();
	} finally {
		clearInterval(dotAnim);
	}
	return [mongo, db];
}

// If db does not contain collections we need, add them.
// Else do nothing
const initDatabase = async(db) => {
	// There are no collections in this database so we need to add ours.
	const users = await db.collection("BBY-6_users").find({}).toArray();
	if(users.length === 0 ) {
		const usersJson = JSON.parse(await readFile('./data/users.json', 'utf-8'));
		await db.collection("BBY-6_users").insertMany(usersJson);
		// Create a unique index on the emailAddress field in the users collection.
		await db.collection("BBY-6_users").createIndex({ emailAddress: 1 }, { unique: true });
	}
	
	const items = await db.collection("BBY-6_items").find({}).toArray();
	if(items.length === 0 ){
		const itemsJson = JSON.parse(await readFile('./data/items.json', 'utf-8'))
		await db.collection("BBY-6_items").insertMany(itemsJson);
	}

	const categories = await db.collection("BBY-6_categories").find({}).toArray();
	if(categories.length === 0 ){
		const categoriesJson = JSON.parse(await readFile('./data/categories.json', 'utf-8'))
		await db.collection("BBY-6_categories").insertMany(categoriesJson);
	}

	const articles = await db.collection("BBY-6_articles").find({}).toArray();
	if(articles.length === 0 ){
		const articlesJson = JSON.parse(await readFile('./data/articles.json', 'utf-8'))
		await db.collection("BBY-6_articles").insertMany(articlesJson);
	}
}

/** 
 * Uses {@link loadHTMLComponent} to load header and footer into their respective tags given a JSDOM object.
 * @param {jsdom.JSDOM} baseDOM - the DOM object to template onto.
 * @returns {jsdom.JSDOM} The original DOM object, with header and footer attached.
 */
const loadHeaderFooter = async (baseDOM) => {
	
	// Add the header 
	baseDOM = await loadHTMLComponent(baseDOM, "header", "header", "./templates/header.html");

	// Add the footer
	baseDOM = await loadHTMLComponent(baseDOM, "footer", "footer", "./templates/footer.html");

	return baseDOM;
}

// Load a HTML component 
// baseDOM is the return value of `new JSDOM(htmlFile)` 
// Selectors should be formatted as they would with `querySelector()`
// componentLocation example: ./html/header.html
const loadHTMLComponent = async (baseDOM, placeholderSelector, componentSelector, componentLocation) => {
	const document = baseDOM.window.document;
	const placeholder = document.querySelector(placeholderSelector);
	const html = await readFile(componentLocation, "utf8");
	const componentDOM = new JSDOM(html);
	placeholder.innerHTML = componentDOM.window.document.querySelector(componentSelector).innerHTML;
	return baseDOM;
}

console.log("Connecting to MongoDB instance…");
try {
	[mongo, db] = await connectMongo(url, dbName);
} catch (err) {
	console.error(`Could not connect to MongoDB instance at ${url}!`);
}

app.use(express.json());
app.use(session(
	{
	  secret: "shhhh...secret",
	  name: "ShakeGuardSessionID",
	  resave: false,
	  // create a unique identifier for that client
	  saveUninitialized: true
	})
  );
// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/images", express.static("public/images"));
app.use("/html", express.static("public/html"));

app.get('/', async function (req, res) {
	
	let doc = await readFile("./html/index.html", "utf8");
	let index = new JSDOM(doc);

	// Add the footer
	index = await loadHTMLComponent(index, "footer", "footer", "./templates/footer.html");

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
		res.setHeader("Content-Type", "application/json");
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
	}
}

/**
 * Checks if the user is logged in, if they aren't, sends a 401 error.
 * @param {Response} res - Response object to send errors to; may get sent.
 * @returns `true` if the user was sent an error, `false` otherwise.
 */
function checkLoginError(req, res) {
	if (!req.session || !req.session.loggedIn) {
		res.status(401).send("invalidSession");
	} 
}

app.get('/profile', async (req, res) => {
	if (redirectToLogin(req, res)) {
		return;
	}
	let doc = await readFile("./html/user-profile.html", "utf8");
	const baseDOM = new JSDOM(doc);
	let profile = await loadHeaderFooter(baseDOM);

	profile = await loadHTMLComponent(profile, "#Base-Container", "div", "./templates/profile.html");
    profile.window.document.getElementById("FullName").defaultValue = req.session.name;
	profile.window.document.getElementById("Email").defaultValue = req.session.email;
	res.send(profile.serialize());
});

app.patch('/profile', async(req, res) => {
	// if the request is not coming from a logged in user, reject.
	if (checkLoginError(req, res)) {
		return;
	}
	
	// get user from db
	const filterQuery = {emailAddress: req.session.email};
	const userResults = await db.collection('BBY-6_users').find(filterQuery).toArray();
	if(userResults.length === 0) {
		// Could not find user
		res.status(500).send("userNotFound");
		return;
	} 
	
	// based on what is present in the update query, 
	const updateQuery = {};
	if (req.body.email) {
		// email to be changed
		updateQuery['emailAddress'] = req.body.email;
	} 
	if (req.body.name) {
		// name to be changed
		updateQuery['name'] = req.body.name;
	} 
	if (req.body.pwd) {
		// password to be changed
		const pwd = await bcrypt.hash(req.body.pwd, 10);	
		updateQuery['pwd'] = pwd;				
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
			req.session.name = req.body.name ?? req.session.name;
			req.session.email = req.body.email ?? req.session.email;
			res.status(200).send("userUpdated");
		}
	} catch(e) {
		console.log(e);
		// Email addresses have a unique index so mongo will give error code 11000 if the email is already in use
		if(e.code === 11000) {
			res.status(403).send("emailInUse");
		} else {
			res.status(500).send("serverIssue");
		}
	}

})

app.get('/avatar', async(req, res) => {
	//if the request is not coming from a logged in user, reject.
	if (checkLoginError(req, res)) {
		return;
	}

	const results = await db.collection('BBY-6_users').findOne({emailAddress:req.session.email});
	res.status(200).send({
		mimeType: results.avatarURL.contentType,
		data: results.avatarURL.data
	})
})

app.post('/avatar', upload.single("avatar"), async(req, res) => {
	//if the request is not coming from a logged in user, reject.
	if (checkLoginError(req, res)) {
		return;
	}

	const results = await db.collection('BBY-6_users').updateOne({emailAddress:req.session.email}, {
		$set: {
			avatarURL: {
				data: req.file.buffer,
				contentType: req.file.mimetype
			}
		}
	})
	res.status(200).send("avatarUploaded");
})

app.get('/login', async function (req, res) {
	// Redirect to profile page if logged in
	if (req.session.loggedIn) {
		res.redirect("/profile");
		return;
	} 
	let doc = await readFile("./html/login.html", "utf8");
	const baseDOM = new JSDOM(doc);
	let login = await loadHeaderFooter(baseDOM);
	res.send(login.serialize());
});

app.post("/login", async (req, res) => {
	const email = req.body.email;
	const pwd = req.body.password;
	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");
	try {
		const results = await db.collection('BBY-6_users').find({emailAddress: email}).toArray();
		if(results.length === 0) {
			// Could not find user
			res.status(401).send("userNotFound");
		} else {
			// found user. validate password
			bcrypt.compare(pwd, results[0].pwd, function(err, result) {
				if(result) {
					// Password matches, create session
					req.session.loggedIn = true;
					req.session.name = results[0].name;
					req.session.email = req.body.email;
					req.session.save(err => {
						if(err) {
							console.log(err);
							res.status(500).send("couldNotSaveSession");
						} else {
							res.send("loginSuccessful");
						}
					})
				} else {
					// Password does not match
					res.status(401).send("passwordMismatch");
				}
			});
		}
	} catch(e) {
		console.log(e);
		res.status(500).send("serverIssue");
	}
})

app.post("/logout", (req, res) => {
	// TODO: Not sure how to do the error handling here
	if(req.session) {
		req.session.destroy(err => {
			if(err) {
				res.status(422).send("logoutFailed");
			} else {
				res.status(200).send('logoutSuccessful');
			}
		})
	} 
})

// RUN SERVER
let port = 8000;
app.listen(port, function () {
  console.log(`Server listening on http://localhost:${port}`);
})
