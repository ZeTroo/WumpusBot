

const utils = require('../../utils.js');
const YoutubePlaylist = require('../../youtube-wrapper/index.js').Playlist;

const YoutubeVideoUrl = 'https://www.youtube.com/watch?v=';
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
	name: 'playlist',
	aliases: [],
	description: 'Faites jouer une liste de lecture.',
	privateMessage: false,
	message: async (message, object) => {
		if (!message.member.voice.channelID) {
			utils.sendMessage(message.channel, object.dictionary, 'error_playlist_no_voice');
			return;
		}
		if (message.guild.me.voice.channelID && message.member.voice.channelID != message.guild.me.voice.channelID) {
			utils.sendMessage(message.channel, object.dictionary, 'error_playlist_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}playlist <url>`
			});
			return;
		}
		let playlist = message.client.playlist;
		if (!playlist) {
			playlist = new YoutubePlaylist(message.client._config.youtube);
			message.client.playlist = playlist;
		}
		const result = await playlist.fetch(object.args[0]);
		if (result.error) {
			utils.sendMessage(message.channel, object.dictionary, 'error_playlist_api_error', {
				reason: result.error.errors[0].reason
			});
			return;
		}
		let play;
		if (message.client._commands.music)
			play = message.client._commands.music.find(item => item.play).play;
		if (!play) {
			utils.sendMessage(message.channel, dictionary, 'error_playlist_no_play');
			return;
		}
		for (const item of result.items)
			await play(message.member, message.client, message.channel, message.guild, getDictionary(message.guild), `${YoutubeVideoUrl}${item.snippet.resourceId.videoId}`);
	}
};