import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';

/** Developer-use log to standard out. */
export const stdoutLog = morgan('dev');

/** Error-only log, skips all responses that are successes or redirects. */
export const errorLog = morgan('dev', {skip: (req, res) => res.statusCode < 400});

/** Append-only filestream for logs. */
export const accessLogStream = fs.createWriteStream(path.join(process.cwd(), '/logs/access.log'));

/** Access log, appends to a logfile. */
export const accessLog = morgan('combined', { stream: accessLogStream });