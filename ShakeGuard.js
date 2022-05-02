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

// Server Detects ajaxPOST request, then handles it
app.post("/login", function(req, res) {
    res.setHeader("Content-Type", "application/json");


    console.log("What was sent", req.body.email, req.body.password);


    let results = authenticate(req.body.email, req.body.password,
        function(userRecord) {
            //console.log(rows);
            if(userRecord == null) {
                // server couldn't find that, so use AJAX response and inform
                // the user. when we get success, we will do a complete page
                // change. Ask why we would do this in lecture/lab :)
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.firstName = userRecord.firstName;
                req.session.lastName = userRecord.lastName;
                req.session.email = userRecord.email;
                req.session.password = userRecord.password;
                req.session.city = userRecord.city;

                // all we are doing as a server is telling the client that they
                // are logged in, it is up to them to switch to the profile page
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});

// Login Authenticate Function
function authenticate(email, pwd, callback) {

    const mysql = require("mysql2");
    // Connect to 'ShakeGuard' Database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "ShakeGuard"
    });
    connection.connect();
    connection.query(
      //'SELECT * FROM user',
      "SELECT * FROM ShakeGuard WHERE email = ? AND password = ?", [email, pwd],
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
    CREATE TABLE IF NOT EXISTS ShakeGuard (
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
    let [rows, fields] = await connection.query("SELECT * FROM ShakeGuard");
    // No records? Let's add a couple - for testing purposes
    if(rows.length == 0) {
        // No records, so let's add a couple
        let userRecords = "insert into ShakeGuard (firstName, lastName, email, password, city) values ?";
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