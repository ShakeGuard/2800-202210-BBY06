import {readFile} from "node:fs/promises";
import bcrypt from "bcrypt";
import {JSDOM} from "jsdom";
import {loadHeaderFooter, changeLoginButton} from "./domUtils.js";

/**
 * `login.mjs` – Containts login/logout-related routes.
 */


/**
 * GET route for /login endpoint.
 * Serves the login page to a client.
 * @param { Request } req
 * @param { Response } res
 * @returns { Promise<void> }
 */
export async function getLogin(req, res) {
    // Redirect to profile page if logged in
    if (req.session.loggedIn) {
        res.redirect("/profile");
        return;
    }
    let doc = await readFile("./html/login.html", "utf8");
    const baseDOM = new JSDOM(doc);
    let login = await loadHeaderFooter(baseDOM);
    login = changeLoginButton(login, req);
    res.send(login.serialize());
}

/**
 * POST route for the /login endpoint.
 * Authenticates a user using the database.
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

/**
 * POST route for the /logout endpoint.
 * @param { Request } req
 * @param { Response } res
 */
export function postLogout(req, res) {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.status(422).send("logoutFailed");
            } else {
                res.status(200).send("logoutSuccessful");
            }
        })
    }
}
