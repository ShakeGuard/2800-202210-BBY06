import * as mdb from "mongodb";
import { MongoClient } from "mongodb";
import { log } from "./logging.mjs";
import { readFile } from "node:fs/promises";
import { secrets } from "./shakeguardSecrets.mjs";
import { argv } from "./arguments.mjs";

// Defaults for address and port:
export const dbURL = `mongodb://${argv.instanceAddress ?? 'localhost'}:${argv.instancePort ?? '27017'}`;
export const dbName = argv.dbName ?? "COMP2800";

/** Connection options for MongoDB, also used for the session store.
 *  @type {mdb.MongoClientOptions} */
export const mongoConnectionOptions = {
    auth: argv.auth ? {
        ...secrets['mongodb_auth.json']
    } : undefined,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
// Establishes connection and returns necessary objects to interact with database
// Caller is responsible for closing the connection
export const connectMongo = async (url, dbName, auth) => {
    let mongo, db;
    let dotAnim; // Interval handler for the "dots" animation.
    try {
        dotAnim = setInterval(() => process.stdout.write('…'), 1000);
        mongo = await Promise.race([
            MongoClient.connect(url, mongoConnectionOptions),
            new Promise((res, rej) => {
                setTimeout(() => rej("Timed out after 15 seconds."), 15000)
            })
        ]);
        db = mongo.db(dbName);
        initDatabase(db);
        log.info(`Connected to "${url}", using database "${dbName}"`);
    } catch (error) {
        log.info(); // Newline!
        log.error(`Tried connecting to ${url}, using database ${dbName}`);
        log.error("Ran into an error while connecting to MongoDB!");
        switch (error.message) {
            case "credentials must be an object with 'username' and 'password' properties":
                if (auth) {
                    log.error("Error: --auth option was set, but secrets module could "
                        + "not load username and password for MongoDB instance!");
                    log.error("Try redownloading .secrets or running without the --auth option.")
                }
                break;

            default:
                break;
        }

        log.error('Error object details:');
        log.info(JSON.stringify(error, null, 2));

        log.error('Exiting early due to errors!')
        // TODO: consider any cleanup code before exiting: any open file handles?
        process.exit();
    } finally {
        clearInterval(dotAnim);
    }
    return [mongo, db];
}
// If db does not contain collections we need, add them.
// Else do nothing
/**
 * Initializes the given [database]{@link Db} with values from JSON files in the `./data/` directory.
 * If the database already contains all needed collections, this function is a no-op.
 * @param  {mdb.Db} db - The database to initialize.
 */
async function initDatabase(db) {
    // Touch the sessions collection.
    const sessionsCollection = db.collection("BBY-6_sessions");
    const usersCollection = db.collection("BBY-6_users");
    // There are no collections in this database so we need to add ours.
    const users = await usersCollection.find({}).toArray();
    if (users.length === 0) {
        const usersJson = JSON.parse(await readFile('./data/users.json', 'utf-8'));
        usersJson.forEach(user => {
            user.kits.forEach(kit => {
                kit._id = new mdb.ObjectId();
                kit.kit.forEach(item => {
                    item._id = new mdb.ObjectId();
                })
            })
        })
        await db.collection("BBY-6_users").insertMany(usersJson);
        // Create a unique index on the emailAddress field in the users collection.
        await db.collection("BBY-6_users").createIndex({emailAddress: 1}, {unique: true});
    }

    const items = await db.collection("BBY-6_items").find({}).toArray();
    if (items.length === 0) {
        const itemsJson = JSON.parse(await readFile('./data/items.json', 'utf-8'))
        await db.collection("BBY-6_items").insertMany(itemsJson);
    }

    const categories = await db.collection("BBY-6_categories").find({}).toArray();
    if (categories.length === 0) {
        const categoriesJson = JSON.parse(await readFile('./data/categories.json', 'utf-8'))
        await db.collection("BBY-6_categories").insertMany(categoriesJson);
    }

    const articles = await db.collection("BBY-6_articles").find({}).toArray();
    if (articles.length === 0) {
        const articlesJson = JSON.parse(await readFile('./data/articles.json', 'utf-8'))
        await db.collection("BBY-6_articles").insertMany(articlesJson);
    }

    const kits = await db.collection("BBY-6_kit-templates").find({}).toArray();
    if (kits.length === 0) {
        const kitsJson = JSON.parse(await readFile('./data/kits.json', 'utf-8'))
        kitsJson.forEach(kit => {
            kit.kit.forEach(item => {
                item._id = new mdb.ObjectId();
            })
        });
        await db.collection("BBY-6_kit-templates").insertMany(kitsJson);
    }
}