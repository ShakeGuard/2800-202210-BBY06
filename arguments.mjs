import yargs from "yargs";

/**
 * arguments.mjs – module where the yargs argument parsing stuff lives.
 */
export const argv = yargs(process.argv)
    .option('port', {
        alias: 'P',
        description: "The port that the app should listen on.",
        type: 'number'
    })
    .option('instanceAddress', {
        alias: 'i',
        description: "The IP address or hostname of the MongoDB instance to connect the app to. Defaults to `localhost`.",
        type: 'string'
    })
    .option('instancePort', {
        alias: 'p',
        description: "The port number that the MongoDB instance listens on. Defaults to `27017`.",
        type: 'number'
    })
    .option('dbName', {
        alias: 'db',
        description: "The name of the database to use in the MongoDB instance. Defaults to `COMP2800`.",
        type: 'string'
    })
    .option('auth', {
        description: "If `--auth true`, the app will attempt to log into the MongoDB instance with"
            + "the username and password specified in the file `.secrets/mongodb_auth.json`.",
        type: 'boolean'
    }).option('devLog', {
        description: "If set, app will log lots of data to stdout. If not, only errors will be logged.",
        type: 'boolean'
    })
    .help()
    .alias('help', 'h').parse();