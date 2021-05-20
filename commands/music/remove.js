

const utils = require('../../utils.js');

module.exports = {
	name: 'remove',
	aliases: ['rm'],
	description: 'Remove music from the playlist.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_remove_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_remove_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}remove <number>`
			});
			return;
		}
		if (isNaN(object.args[0])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				arg: object.args[0]
			});
			return;
		}
		const number = parseInt(object.args[0]) - 1;
		if (number < 0 || number >= message.client.music[message.guild.id].playlist.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_remove_no_music_found');
			return;
		}
		const music = message.client.music[message.guild.id].playlist.splice(number, 1)[0];
		utils.sendMessage(message.channel, object.dictionary, 'remove_success', {
			title: music.title,
			url: music.url,
			channel: music.ownerChannelName,
			channelUrl: music.ownerProfileUrl
		});
	}
};