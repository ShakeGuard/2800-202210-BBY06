import bcrypt from "bcrypt";
import { log } from "./logging.mjs";
import { checkLoginError } from "./sessions.mjs"

export function patchProfile(db) {
    return async function (req, res) {
        // If the request is not coming from a logged in user, reject.
        if (checkLoginError(req, res)) {
            return;
        }

        // Get user from db
        const filterQuery = {emailAddress: req.session.email};
        const userResults = await db.collection('BBY-6_users').find(filterQuery).toArray();
        if (userResults.length === 0) {
            // Could not find user
            res.status(500).send("userNotFound");
            return;
        }

        // based on what is present in the update query,
        const updateQuery = {};
        if (req.body.email) {
            // email to be changed
            updateQuery['emailAddress'] = req.body.email;
        }
        if (req.body.name) {
            // name to be changed
            updateQuery['name'] = req.body.name;
        }
        if (req.body.pwd) {
            // password to be changed
            updateQuery['pwd'] = await bcrypt.hash(req.body.pwd, 10);
        }

        if (updateQuery === {}) {
            // invalid body, reject request
            res.status(400).send("missingBodyArgument(s)");
            return;
        }

        try {
            const results = await db.collection('BBY-6_users').updateOne(filterQuery, {$set: updateQuery});
            if (results.matchedCount === 0) {
                // Couldn't find the user
                res.status(404).send("userNotFound");
            } else {
                req.session.name = req.body.name ?? req.session.name;
                req.session.email = req.body.email ?? req.session.email;
                res.status(200).send("userUpdated");
            }
        } catch (e) {
            log.info(e);
            // Email addresses have a unique index so mongo will give error code 11000 if the email is already in use
            if (e.code === 11000) {
                res.status(403).send("emailInUse");
            } else {
                res.status(500).send("serverIssue");
            }
        }
    }
}