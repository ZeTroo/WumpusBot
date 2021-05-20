

const utils = require('../../utils.js');
const YoutubeSearch = require('../../youtube-wrapper/index.js').Search;

const YoutubeVideoUrl = 'https://www.youtube.com/watch?v=';
const YoutubeChannelUrl = 'https://www.youtube.com/channel/';
const requests = {};
const getDictionary = (guild) => {
	const path = `guilds/${guild.id}.json`;
	const object = utils.readFile(path);
	if (!object.dictionary)
		object.dictionary = {};
	if (!object.dictionary.language)
		object.dictionary.language = guild.client._config.dictionary;
	const dictionary = JSON.parse(JSON.stringify(guild.client._dictionaries[object.dictionary.language]));
	if (object.dictionary.custom) {
		for (const key of Object.keys(object.dictionary.custom))
			dictionary[key] = object.dictionary.custom[key];
		object.dictionary.language += ' *(custom)*';
	}
	return dictionary;
};

module.exports = {
	name: 'search',
	aliases: ['s'],
	description: 'Recherche ta musique ',
	privateMessage: false,
	message: async (message, object) => {
		if (requests[message.author.id]) {
			utils.sendMessage(message.channel, object.dictionary, 'error_search_already');
			return;
		}
		if (!message.member.voice.channelID) {
			utils.sendMessage(message.channel, object.dictionary, 'error_search_no_voice');
			return;
		}
		if (message.guild.me.voice.channelID && message.member.voice.channelID != message.guild.me.voice.channelID) {
			utils.sendMessage(message.channel, object.dictionary, 'error_search_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}search <message...>`
			});
			return;
		}
		let request = '';
		for (const arg of object.args) {
			if (request.length)
				request += ' ';
			request += arg;
		}
		let search = message.client.search;
		if (!search) {
			search = new YoutubeSearch(message.client._config.youtube);
			message.client.search = search;
		}
		const result = await search.fetch(request, 20);
		if (result.error) {
			utils.sendMessage(message.channel, object.dictionary, 'error_search_api_error', {
				reason: result.error.errors[0].reason
			});
			return;
		}
		let count = 0;
		const lines = [];
		requests[message.author.id] = [];
		for (const item of result.items) {
			lines.push(utils.getMessage(object.dictionary, 'search_item', {
				index: ++count,
				title: item.snippet.title,
				url: `${YoutubeVideoUrl}${item.id.videoId}`,
				channel: item.snippet.channelTitle,
				channelUrl: `${YoutubeChannelUrl}${item.snippet.channelId}`
			}));
			requests[message.author.id].push(item.id.videoId);
		}
		const messages = utils.remakeList(lines);
		for (const item of messages)
			utils.sendEmbed(message.channel, object.dictionary, utils.getCustomEmbed(item));
	},
	message_offline: async message => {
		if (message.author.bot || !requests[message.author.id])
			return;
		const content = message.content.toLowerCase();
		const args = content.split(' ');
		if (content != 'cancel')
			for (const arg of args)
				if (isNaN(arg))
					return;
		const dictionary = getDictionary(message.guild);
		if (content == 'cancel') {
			delete requests[message.author.id];
			utils.sendMessage(message.channel, dictionary, 'search_cancel');
			return;
		}
		const musics = [];
		for (const arg of args) {
			const index = parseInt(arg);
			if (index <= 0 || index > requests[message.author.id].length) {
				utils.sendMessage(message.channel, dictionary, 'error_search_index_not_found', {
					index
				});
				return;
			}
			musics.push(requests[message.author.id][index - 1]);
		}
		delete requests[message.author.id];
		let play;
		if (message.client._commands.music)
			play = message.client._commands.music.find(item => item.play).play;
		if (!play) {
			utils.sendMessage(message.channel, dictionary, 'error_search_no_play');
			return;
		}
		for (const music of musics)
			await play(message.member, message.client, message.channel, message.guild, dictionary, `${YoutubeVideoUrl}${music}`);
	}
};