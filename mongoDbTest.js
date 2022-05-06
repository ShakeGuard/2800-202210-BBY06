import { MongoClient } from 'mongodb';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import fs from 'fs';

// Use `yargs` to parse command-line arguments.
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Grab secrets file
import { readSecrets } from './shakeguardSecrets.mjs'

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
	  description: "The name of the database to use in the MongoDB instance. Defaults to `test`.",
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

// Defaults for address and port:
const url = `mongodb://${argv.instanceAddress ?? 'localhost'}:${argv.instancePort ?? '27017'}`;

const dbName = argv.dbName ?? "test";

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
		console.log(`Connected to "${url}", using database "${argv.dbName}"`);
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

app.get('/', function (req, res) {
	let doc = fs.readFileSync("./html/index.html", "utf8");
	res.send(doc);
});

app.post("/login", async (req, res) => {
	const email = req.body.email;
	const pwd = req.body.password;
	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");
	try {
		const results = await db.collection('users').find({emailAddress: email}).toArray();
		if(results.length === 0) {
			// Could not find user
			res.status(401).send("userNotFound");
		} else {
			// found user. validate password
			bcrypt.compare(pwd, results[0].pwd, function(err, result) {
				if(result) {
					// Password matches, create session
					req.session.loggedIn = true;
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
				// TODO: Should this be a 400 or 500?
				res.status(422).send("logoutFailed");
			} else {
				res.redirect(200, "/");
			}
		})
	} 
})

app.post("/signup", async (req, res) => {
	// TODO: Should probably sanitize some of these before sticking them in the database
	const name = req.body.name;
	const emailAddress = req.body.email;
	const pwd = req.body.password;
	const avatarURL = req.body.avatarURL;
	const date = new Date().toISOString();
	const achievements = req.body.achievements;
	const admin = false;
	const kit = {
		description: "",
		order: [],
		items: []
	};

	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");

	try {
		await db.collection('users')
			.insertOne({name, emailAddress, pwd, avatarURL, date, achievements, admin, kit});
	
		res.redirect(200, "/");
	} catch(e) {
		console.log(e);
		if(e.message.includes("email dup key")) {
			res.status(403).send("emailInUse");
		} else {			
			res.status(500).send("serverIssue");
		}
	}
})

// RUN SERVER
let port = 8000;
app.listen(port, function () {
  console.log(`Server listening on http://localhost:${port}`);
})
