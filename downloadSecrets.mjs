// downloadSecrets.js – Downloads the `.secrets` directory via SFTP.
import SFTPClient from 'ssh2-sftp-client';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import path from 'node:path';
import { open, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const homeDirStr = (await import('os')).homedir();
const homeDir = path.parse(homeDirStr);

// TODO: maybe make this relative to the place that the script is saved, instead of relative to the working directory?
const destinationDir = process.cwd() + path.sep + '.secrets';

const argv = yargs(hideBin(process.argv))
	.option('user', {
		alias: 'u',
		description: 'The SSH user account to attempt to log in as. Defaults to \"shakeguard\"',
		type: 'string'
	})
	.option('hostname', {
		alias: 'a',
		description: 'The hostname of the server to attempt to download secrets from. Defaults to \"db.nokko.me\".',
		type: 'string'
	})
	.option('keyfile', {
		alias: 'k',
		description: 'The private key file to use when authenticating. Defaults to \"$HOME/id_rsa\".'
	})
	.help()
	.alias('help', 'h')
	.parse();

// Check if there's already a .secrets directory in the repo:
console.log("Checking if a .secrets directory already exists…")
try {
	await access(destinationDir, constants.F_OK);
	console.log("\`.secrets\` directory already exists, not downloading anything.");
	console.log("If you would like to fetch secrets again, please remove the existing "
			+   "\`.secrets\` directory and run this script again.");
	process.exit(0);
} catch (err) {
	console.log("\`.secrets\` directory does not exist, so starting download:")
}

// Locate the key file.
console.log(`Found home directory: "${path.format(homeDir)}".`);

let keyFilePath;
if (argv.keyfile) {
	console.log("keyfile:", argv.keyfile)
	keyFilePath = path.normalize(argv.keyfile).split(path.sep);
} else {
	keyFilePath = [path.format(homeDir), '.ssh', 'id_rsa'];
}

// TODO: test if --keyfile argument resolves properly on Windows, 
// do we need to use 'C:\' instead of '/' here depending on platform?
const potentialKeyFile = path.resolve('/', ...keyFilePath);
console.log(`Testing if "${potentialKeyFile}" exists…`);

try {
	await access(potentialKeyFile, constants.F_OK);
} catch (err) {
	process.exitCode = 1;
	throw new Error(`${potentialKeyFile} does not exist!\ 
\	\	\	\	\	Try supplying another keyfile with the --keyfile argument.`);

}

try {
	await access(potentialKeyFile, constants.R_OK);
} catch (err) {
	process.exitCode = 1;
	throw new Error(`${potentialKeyFile} could not be read! Try changing the file's\
\	\	\	\	\	permissions or supplying another keyfile with the --keyfile argument.`);

}

const keyFileHandle = await open(potentialKeyFile, 'r')

const keyFileContents = (await keyFileHandle.readFile()).toString();

console.log("Read keyfile successfully!");

const username = argv.username ?? 'shakeguard';
const hostname = argv.hostname ?? 'db.nokko.me';
console.log(`Connecting to SFTP server: trying to connect as ${username}@${hostname}…`);


const sftp = new SFTPClient('secrets-downloader');
await sftp.connect({
		host: hostname,
		username: username,
		privateKey: keyFileContents
	})
	.catch((reason) => {
		console.error(`Could not connect to SFTP server! Reason:`);
		console.dir(reason);
	})
	.then(async () => {
		console.log("Attempting to download .secrets directory…");
		// TODO: make sure the destination directory is the same directory that contains the package.json!
		// Users might accidentally download the secrets into the wrong place…
		await sftp.downloadDir('/home/shakeguard/.secrets', process.cwd() + path.sep + '.secrets');
		console.log('Downloaded successfully!');
	})
	.catch((reason) => {
		console.error(`Could not download .secrets directory! Reason:`);
		console.dir(reason);
	});

keyFileHandle.close();
await sftp.end();