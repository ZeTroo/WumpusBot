

const url = require('url');
const querystring = require('querystring');
const stream = require('../stream.js');
const sig = require('./sig.js');

const YoutubeVideoUrl = 'https://www.youtube.com/watch?v=';
const YoutubeEmbedUrl = 'https://www.youtube.com/embed/';
let YoutubeUrls;

class YoutubeVideo {
	constructor(url) {
		this.url = url;
		if (!YoutubeUrls)
			YoutubeUrls = require('./index.js').Urls;
	}
	async fetch() {
		let parsedUrl = url.parse(this.url, true);
		if (!YoutubeUrls.includes(parsedUrl.hostname)) {
			this.status = 'ERROR';
			this.reason = 'Invalid URL.'
			return this;
		}
		let id = parsedUrl.query.v;
		if (!id && parsedUrl.pathname.length)
			id = parsedUrl.pathname.slice(1);
		if (!id) {
			this.status = 'ERROR';
			this.reason = 'Unable to find the identifier.'
			return this;
		}
		this.id = id;
		this.url = `${YoutubeVideoUrl}${id}`;
		parsedUrl = url.parse(`${YoutubeVideoUrl}${id}&pbj=1&hl=en`, true);
		parsedUrl.headers = {
			'x-youtube-client-name': '1',
			'x-youtube-client-version': '2.20200609.04.01',
		};
		const body = await stream.promise(parsedUrl);
		const parsedBody = JSON.parse(body).reduce((accumulator, currentValue) => Object.assign(currentValue, accumulator));
		if (!['OK'].includes(parsedBody.playerResponse.playabilityStatus.status)) {
			Object.assign(this, parsedBody.playerResponse.playabilityStatus);
			return this;
		}
		/*if (parsedBody.playerResponse.playabilityStatus.status == 'LOGIN_REQUIRED') {
			parsedUrl = url.parse(`${YoutubeEmbedUrl}${id}&pbj=1&hl=en`, true);
			parsedUrl.headers = {
				'x-youtube-client-name': '1',
				'x-youtube-client-version': '2.20200609.04.01',
			};
			const body = await stream.promise(parsedUrl);
			console.log(body);
			return;
		}*/
		if (parsedBody.response.contents.twoColumnWatchNextResults.autoplay)
			this.next = `${YoutubeVideoUrl}${parsedBody.response.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0].autoplayVideo.watchEndpoint.videoId}`;
		delete parsedBody.playerResponse.microformat.playerMicroformatRenderer.embed;
		delete parsedBody.playerResponse.microformat.playerMicroformatRenderer.hasYpcMetadata;
		parsedBody.playerResponse.microformat.playerMicroformatRenderer.title = parsedBody.playerResponse.microformat.playerMicroformatRenderer.title.simpleText;
		Object.assign(this, parsedBody.playerResponse.microformat.playerMicroformatRenderer);
		const parsedResponse = JSON.parse(parsedBody.player.args.player_response);
		this.expires = Date.now() + parseInt(parsedResponse.streamingData.expiresInSeconds * 1000);
		const playerTokens = await sig.tokens(`https://${YoutubeUrls[0]}${parsedBody.player.assets.js}`);
		this.formats = [];
		let formats = parsedResponse.streamingData.formats;
		if (!formats)
			formats = [];
		formats = formats.concat(parsedResponse.streamingData.adaptiveFormats);
		for (const format of formats) {
			if (!format.url) {
				const cipher = querystring.parse(format.signatureCipher);
				delete format.signatureCipher;
				const formatToken = playerTokens && cipher.s ? sig.decipher(playerTokens, cipher.s) : null;
				const parsedUrl = url.parse(decodeURIComponent(cipher.url), true);
				delete parsedUrl.search;
				parsedUrl.query.ratebypass = 'yes';
				if (formatToken)
					if (cipher.sp)
						parsedUrl.query[cipher.sp] = formatToken;
					else
						parsedUrl.query.signature = formatToken;
				format.url = url.format(parsedUrl)
			}
			this.formats.push(format);
		}
		return this;
	}
}

module.exports = YoutubeVideo;