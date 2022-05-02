// Server-Side
// Requires
const express = require("express");
const session = require("express-session");
const app = express();
const fs = require("fs");
const { JSDOM } = require('jsdom');

// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/images", express.static("public/images"));
app.use("/html", express.static("public/html"));

// IMPORTANT! 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create new Session, Gives you the "Keycard" that you need to access/open site.
app.use(session({
    secret: "a secret",
    name: "ShakeGuardSessionID",
    resave: false,
    saveUninitialized: true
}))

// Retrieve URL at..
app.get("/", function (req, res) {

    // Check if logged in.
    if(req.session.loggedIn){
        // Logged in
        // Serve up this file
        res.redirect("/directory");

    } else {
        // Not logged in
        let doc = fs.readFileSync("./html/index.html", "utf-8");
        res.set("Server", "ShakeGuard Engine");
        res.set("X-Powered-By", "ShakeGuard");
        res.send(doc);
    }

    // // Serve up this file
    // doc = fs.readFileSync("./html/index.html", "utf-8");
    // res.send(doc);

});

app.get("/directory", function(req,res){
        // Check if session exists
        if(req.session.loggedIn){
            let directory = fs.readFileSync("html/directory.html", "utf-8");
            let directoryDOM = new JSDOM(directory);
    
            // Show User's firstName..
            console.log("Displaying Directory...");
    
            res.send(directoryDOM.serialize());
    
        } else {
            res.redirect("/");
        }
});

// Login Authenticate Function
function authenticate(email, pwd, callback) {

    const mysql = require("mysql2");
    // Connect to 'pokemart' Database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "pokemart"
    });
    connection.connect();
    connection.query(
      //'SELECT * FROM user',
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function(error, results, fields) {
          // results is an array of records, in JSON format
          // fields contains extra meta data about results
          console.log("Results from DB", results, "and the # of records returned", results.length);

          if (error) {
              console.log(error);
          }
          if(results.length > 0) {
              // Found Email and Password
              return callback(results[0]);
          } else {
              // No user found
              return callback(null);
          }

      }
    );

}

async function init(){

    // we'll go over promises in COMP 2537, for now know that it allows us
    // to execute some code in a synchronous manner
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      multipleStatements: true
    });

    // Step 1: Create Table of Users and query it
    const ShakeGuardUser = `CREATE DATABASE IF NOT EXISTS ShakeGuard;
    use ShakeGuard;
    CREATE TABLE IF NOT EXISTS user (
    ID int NOT NULL AUTO_INCREMENT,
    firstName varchar(30),
    lastName varchar(30),
    email varchar(40),
    password varchar(30),
    city varchar(50),
    PRIMARY KEY (ID));`;
    // Query SQL
    await connection.query(ShakeGuardUser);

    // Step 2: If Table.length = 0, add users.
    let [rows, fields] = await connection.query("SELECT * FROM user");
    // No records? Let's add a couple - for testing purposes
    if(rows.length == 0) {
        // No records, so let's add a couple
        let userRecords = "insert into user (firstName, lastName, email, password, city) values ?";
        let userrecordValues = [
          ["Jay", "Wang", "jaywang@bcit.ca", "123456", "Burnaby"]
        ];
        await connection.query(userRecords, [userrecordValues]);
    }

    // Console out to check for connection
    console.log("Listening on port " + port + "!");

}

// RUN SERVER
let port = 8000;
app.listen(port, init);