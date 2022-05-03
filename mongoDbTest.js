import { MongoClient } from 'mongodb';
import express from 'express';
import fs from 'fs';

const app = express();
const url = "mongodb://localhost:27017";
const dbName = "test";

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
	// Establish connection
	const [mongo, db] = await connectMongo();
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

	// Close Connection
	await mongo.close();
})

// Read example
// This example just gets all the documents in a collection
// use .fineOne() instead to get just one document
app.get('/people', async function (req, res) {
	// Establish connection
	const [mongo, db] = await connectMongo();

	// Get every document in 'testCollection' collection
	// send names to client
  	const results = await db.collection('testCollection').find({}).toArray();
  	const names = results.map(element => {
		return element.name;
	})

	// Send query result
	res.send(names);

	// Close Connection
	await mongo.close();
})

// Update example
app.post('/change-name', async (req, res) => {
	// Establish connection
	const [mongo, db] = await connectMongo();
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

	// Close Connection
	await mongo.close();
})

// Delete example
app.post('/delete-person', async (req, res) => {
	// Establish connection
	const [mongo, db] = await connectMongo();
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

	// Close Connection
	await mongo.close();
})

// RUN SERVER
let port = 8000;
app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
})

// Establishes connection and returns necessary objects to interact with database
// Caller is resonsible for closing the connection
const connectMongo = async() => {
	const mongo = await MongoClient.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	const db = mongo.db(dbName);
	return [mongo, db];
}