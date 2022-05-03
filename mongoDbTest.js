import { MongoClient } from 'mongodb';
import express from 'express';
import fs from 'fs';

const app = express();
const url = "mongodb://localhost:27017";
const dbName = "test";

// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/images", express.static("public/images"));
app.use("/html", express.static("public/html"));

app.get('/', function (req, res) {
	let doc = fs.readFileSync("./html/mongo.html", "utf8");
	res.send(doc);
});

app.get('/people', async function (req, res) {
	// Establish connection
	const mongo = await MongoClient.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	const db = mongo.db(dbName);

	// Get every document in 'testCollection' collection
	// send names to client
  	const results = await db.collection('testCollection').find({}).toArray();
  	const names = results.map(element => {
		return element.name;
	})

	res.send(names);
})

// RUN SERVER
let port = 8000;
app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
})
