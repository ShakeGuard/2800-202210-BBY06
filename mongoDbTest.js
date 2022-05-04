import { MongoClient } from 'mongodb';
import express from 'express';
import fs from 'fs';

// Use `yargs` to parse command-line arguments.
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
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
	let dotAnim; // Interval handler for the "dots" animation.
	try {
		dotAnim = setInterval(() => process.stdout.write('…'), 1000);
		const mongo = await Promise.race([
			MongoClient.connect(url, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			}),
			new Promise((res,rej) => {
				setTimeout(() => rej("Timed out after 15 seconds."), 15000)
			})
		]);
		const db = mongo.db(dbName);
		console.error(`Connected to "${url}", using database "${argv.dbName}"`);
	} catch (error) {
		console.log(); // Newline!
		console.error(`Tried connecting to ${url}, using database ${dbName}`);
		console.error("Ran into an error while connecting to MongoDB!");
		console.error('Error object:');
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
// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/images", express.static("public/images"));
app.use("/html", express.static("public/html"));

app.get('/', function (req, res) {
	let doc = fs.readFileSync("./html/mongo.html", "utf8");
	res.send(doc);
});

// Create example 
app.post('/create-person', async (req, res) => {
	console.log(req.body);
	const name = req.body.name;
	const email = req.body.email;

	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");
	try {
		const insertResult = await db.collection('testCollection').insertOne({name, email});
		console.log(insertResult);

		// Send success response
		res.send({ status: "success", msg: "successfully added person." });
	} catch(e) {
		console.log(e);
		//send fail response
		res.send({ status: "fail", msg: "could not add person." });
	} 
})

// Read example
// This example just gets all the documents in a collection
// use .fineOne() instead to get just one document
app.get('/people', async function (req, res) {
	// Get every document in 'testCollection' collection
	// send names to client
  	const results = await db.collection('testCollection').find({}).toArray();
  	const names = results.map(element => {
		return element.name;
	})

	// Send query result
	res.send(names);
})

// Update example
app.post('/change-name', async (req, res) => {
	const givenEmail = req.body.email;
	const newName = req.body.name;

	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");
	try {
		const results = await db.collection('testCollection').updateOne({email: givenEmail}, {$set: {name: newName}})
		console.log(results);

		// Send success response
		res.send({ status: "success", msg: "successfully changed name." });
	} catch(e) {
		console.log(e);
		//send fail response
		res.send({ status: "fail", msg: "could not change name." });
	}
})

// Delete example
app.post('/delete-person', async (req, res) => {
	const email = req.body.email;
	const name = req.body.name;
	let errMsg = null;
	// Set response header regardless of success/failure
	res.setHeader("Content-Type", "application/json");
	try {
		const results = await db.collection('testCollection').deleteOne({email: email, name: name});
		console.log(results);
		if(results.deletedCount === 0) {
			errMsg = "Could not find person to delete."
			throw new Error();
		}
		// Send success response
		res.send({ status: "success", msg: "successfully deleted person." });
	} catch(e) {
		console.log(e);
		//send fail response
		res.send({ status: "fail", msg: errMsg ? errMsg : "could not delete person." });
	}
})





// RUN SERVER
let port = 8000;
app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
})
