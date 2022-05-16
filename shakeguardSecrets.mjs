"use strict";

import path from 'node:path';
import { access, opendir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { log } from './logging.mjs';

// .secrets path – this is assuming that the script is launched from the base of the npm package/git repo
const secretsPath = process.cwd() + path.sep + '.secrets';

async function readSecrets() {
    // The `secrets` object, we'll be appending secrets to this.
    const secrets = {};
    // Check that the .secrets directory exists and is available for reading/listing…
    try {
        await access(secretsPath, constants.F_OK | constants.R_OK | constants.X_OK);
    } catch (error) {
        log.error("Could not access \`.secrets\` directory, check that it exists and that the permissions are set correctly!", );
		log.dir(JSON.stringify(error, null, 2));
        return secrets;
    }
    // Check that each file in the .secrets directory is readable – warn on any inaccessible files.
    const files = await opendir(secretsPath);
    for await (const f of files) {
        let fPath;
        try {
            fPath = secretsPath + path.sep + f.name;
            await access(fPath, constants.R_OK);
            const contents = await(readFile(fPath));

            // Parse the JSON contents and add to the secrets object
            secrets[f.name] = JSON.parse(contents);
        } catch (err) {
            log.warn(`[SECRETS] Could not read file \`${fPath}\`! Skipping…`);
        }
    }
    log.info(`[SECRETS] Parsed ${Object.keys(secrets).length} secret files:`)
    log.info(`[SECRETS] ${JSON.stringify(Object.keys(secrets))}`);
    return secrets;
};

export { readSecrets };