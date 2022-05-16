import morgan from 'morgan';
import fs from 'node:fs';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';

/** Developer-use log to standard out. */
export const stdoutLog = morgan('dev');

/** Error-only log, skips all responses that are successes or redirects. */
export const errorLog = morgan('dev', {skip: (req, res) => res.statusCode < 400});

// Before creating the filestream, quickly write a "Server Restarted!" message so it's easier to read.
const logFileName = path.join(process.cwd(), '/logs/access.log');
await appendFile(logFileName, `Server started at ${new Date().toLocaleString('en-CA', {timeZone: 'America/Vancouver'})}\n`);

/** Append-only filestream for logs. */
export const accessLogStream = fs.createWriteStream(logFileName, {flags: 'a'});

/** Access log, appends to a logfile. */
export const accessLog = morgan('combined', { stream: accessLogStream });