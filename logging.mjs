import morgan from 'morgan';
import winston, { loggers } from 'winston';
import fs from 'node:fs';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/** Developer-use log to standard out. */
export const stdoutLog = morgan('dev');

// Make sure the `logs/` directory exists before doing anything else!
try {
    await mkdir(path.join(process.cwd(), '/logs'));
} catch {
    // Error case doesn't matter!
    // 10/10 coding.
}

// Before creating the filestream, quickly write a "Server Restarted!" message to all the logs, so it's easier to read.

const logRootDirectory = 'logs';
/** @type {{[k: string]: string}} */
const logs = Object.fromEntries(['access', 'app', 'error']
                .map(name => [name, path.join(process.cwd(), logRootDirectory, name + '.log')])
            );
             

const restartLogActions = Object.values(logs).map(logFilename => {
    new Promise((resolve) => {
        const prettyTime = new Date().toLocaleString('en-CA', {timeZone: 'America/Vancouver'});
        resolve(appendFile(logFilename, `Server started at ${prettyTime}\n`));
    })
});
await Promise.allSettled(restartLogActions);

/** Append-only filestream for logs. */
export const accessLogStream = fs.createWriteStream(logs['access'], {flags: 'a'});

/** Morgan access log, appends to a logfile. */
export const accessLog = morgan('combined', { stream: accessLogStream });

/** Morgan error-only log, skips all responses that are successes or redirects. */
export const errorLog = morgan('dev', { skip: (req, res) => res.statusCode < 400 });

/** Main log object, used more or less like `console.whatever()`.
 * @type {winston.Logger}
*/
export const log = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: path.join(process.cwd(), '/logs/error.log'), level: 'error'}),
        new winston.transports.File({ filename: path.join(process.cwd(), '/logs/app.log')})
    ]
});
/**
 * Adds log output to standard out, as well as the default file transports.
 * @param {winston.Logger} log - logger to add the devLog stuff to
 */
export function addDevLog(log) {
    log.add(
        new winston.transports.Console({
            format: winston.format.cli({ message: true })
        })
    );
}