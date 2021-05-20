

const url = require('url');
const http = require('http');
const https = require('https');

const httpLibs = {
	'http:': http,
	'https:': https
}
const redirectCode = [302, 303, 307];

const stream = (options, callback) => {
	if (typeof options == 'string')
		options = url.parse(options);
	if (!options.headers)
		options.headers = {};
	if (!options.headers['User-Agent'])
		options.headers['User-Agent'] = 'Mozilla/5.0';
	if (!options.protocol)
		options.protocol = Object.keys(httpLibs)[0];
	return new Promise(resolve => {
		const doDownload = () => {
			const httpLib = httpLibs[options.protocol];
			if (!httpLib)
				throw 'Invalid URL';
			httpLib.get(options, res => {
				if (redirectCode.includes(res.statusCode)) {
					Object.assign(options, url.parse(res.headers.location));
					process.nextTick(doDownload);
					return;
				}
				if (callback) {
					let body = '';
					res.on('error', callback);
					res.on('data', chunk => body += chunk);
					res.on('end', () => callback(undefined, body));
				}
				resolve(res);
			});
		}
		process.nextTick(doDownload);
	});
};

stream.promise = (options) => {
	return new Promise((resolve, reject) => {
		stream(options, (err, body) => {
			if (err)
				reject(err);
			resolve(body);
		});
	});
};

module.exports = stream;