import session from "express-session";
import { secrets } from "./shakeguardSecrets.mjs";
import {dbName, dbURL, mongoConnectionOptions} from "./db.mjs";
import {log} from "./logging.mjs";
import ConnectMongoDBSession from "connect-mongodb-session";

export let sessionStore = null;
export const sessionParser = session({
    secret: secrets['session.json'].sessionSecret,
    name: "ShakeGuardSessionID",
    store: sessionStore ?? undefined,
    resave: false,
    // create a unique identifier for that client
    saveUninitialized: true
});

const MongoDBStore = ConnectMongoDBSession(session);
try {
    sessionStore = new MongoDBStore({
        uri: dbURL,
        databaseName: dbName,
        collection: "BBY-6_sessions",
        connectionOptions: mongoConnectionOptions
    });
} catch (err) {
    log.error(`Could not connect to MongoDB instance at ${dbURL}/${dbName}!`);
    log.error(JSON.stringify(err, null, 2));
}

/**
 * Checks if the user is logged in, if they aren't, sends a 401 error.
 * @param {Response} res - Response object to send errors to; may get sent.
 * @returns `true` if the user was sent an error, `false` otherwise.
 */
export function checkLoginError(req, res) {
    if (!req.session || !req.session.loggedIn) {
        res.status(401).send("invalidSession");
        return true;
    }
    return false;
}