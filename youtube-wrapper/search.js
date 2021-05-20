
const url = require('url');
const stream = require('../stream.js');

const YoutubeSearchUrl = 'https://www.googleapis.com/youtube/v3/search';
const cache = {};

class YoutubeSearch {
	constructor(token) {
		this.token = token;
		if (!YoutubeSearchUrl)
			YoutubeSearchUrl = require('./index.js').Api;
	}
	async fetch(request, limit = 50, type = 'video') {
		type = type.toLowerCase();
		if (!cache[type])
			cache[type] = {};
		request = request.toLowerCase();
		let result = cache[type][request];
		if (!result) {
			let parsed = url.parse(YoutubeSearchUrl);
			parsed.query = {
				part: 'snippet',
				maxResults: '50',
				q: request,
				type: type,
				key: this.token
			};
			const body = await stream.promise(url.format(parsed));
			result = JSON.parse(body);
			if (result.error)
				return result;
			cache[type][request] = result;
		}
		result = JSON.parse(JSON.stringify(result));
		if (limit > result.pageInfo.resultsPerPage)
			return result;
		result.items = result.items.slice(0, limit);
		return result;
	}
}

module.exports = YoutubeSearch;