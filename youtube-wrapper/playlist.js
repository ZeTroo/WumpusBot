
const url = require('url');
const stream = require('../stream.js');

const YoutubePlaylistUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
let YoutubeUrls;
const cache = {};

class YoutubePlaylist {
	constructor(token) {
		this.token = token;
		if (!YoutubeUrls)
			YoutubeUrls = require('./index.js').Urls;
	}
	async fetch(link, limit = 50) {
		const parsedUrl = url.parse(link, true);
		if (!YoutubeUrls.includes(parsedUrl.hostname)) {
			this.status = 'ERROR';
			this.reason = 'Invalid URL.'
			return this;
		}
		const id = parsedUrl.query.list;
		if (!id) {
			this.status = 'ERROR';
			this.reason = 'Unable to find the identifier.'
			return this;
		}
		this.id = id;
		let result = cache[id];
		if (!result) {
			let parsed = url.parse(YoutubePlaylistUrl);
			parsed.query = {
				part: 'snippet',
				maxResults: '50',
				playlistId: id,
				key: this.token
			};
			const body = await stream.promise(url.format(parsed));
			result = JSON.parse(body);
			if (result.error)
				return result;
			cache[id] = result;
		}
		result = JSON.parse(JSON.stringify(result));
		if (limit > result.pageInfo.resultsPerPage)
			return result;
		result.items = result.items.slice(0, limit);
		return result;
	}
}

module.exports = YoutubePlaylist;