import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";

/**
 * Login-related routes.
 */
/**
 * GET – Login. Serve the login page to a client.
 * @param { Request } req
 * @param { Response } res
 * @returns { Promise<void> }
 */

export async function getLogin(req, res) {
    let doc = await readFile("./html/login.html", "utf-8");
    res.send(doc);
}

/**
 * Note: Russian doll thing with the function to capture the `db` variable.
 * @param { mdb.Db } db
 * @returns { function(Request, Response): Promise<void> }
 */
export function makePostLogin(db) {
    if (db === undefined) {
        throw new Error("Provide a MongoDB object to the POST route!");
    }

    return async function postLogin(req, res) {
        const email = req.body.email;
        const pwd = req.body.password;
        // Set response header regardless of success/failure
        res.setHeader("Content-Type", "application/json");
        try {
            const results = await db.collection('BBY-6_users').find({emailAddress: email}).toArray();
            if (results.length === 0) {
                // Could not find user
                res.status(401).send("userNotFound");
                return;
            }
            // found user. validate password
            const user = results[0];
            const passwordMatches = await bcrypt.compare(pwd, user.pwd);
            if (passwordMatches) {
                // Password matches, create session
                req.session.name = user.name;
                req.session.email = email;
                req.session.loggedIn = true;
                req.session.isAdmin = user.admin;
                req.session._id = user._id;

                // HACK: Fragile, careful.
                req.session.easterEgg = user.name === "Tai Lopez";

                if (user.admin) {
                    res.send("loginSuccessfulAdmin")
                } else {
                    res.send("loginSuccessful");
                }
            } else {
                // Password does not match
                res.status(401).send("passwordMismatch");
            }
        } catch (e) {
            res.status(500).send("serverIssue");
        }
    };
}