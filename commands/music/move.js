

const utils = require('../../utils.js');

module.exports = {
	name: 'move',
	aliases: ['mv'],
	description: 'Déplacer la musique de la liste de lecture.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_move_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_move_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}remove <number>`
			});
			return;
		}
		for (let index = 0; index < 2; index++)
			if (isNaN(object.args[index])) {
				utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
					arg: object.args[index]
				});
				return;
			}
		const from = parseInt(object.args[0]) - 1;
		if (from < 0 || from >= message.client.music[message.guild.id].playlist.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_move_no_music_found');
			return;
		}
		const to = parseInt(object.args[1]) - 1;
		if (to < 0 || to >= message.client.music[message.guild.id].playlist.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_move_not_in_playlist', {
				index: to + 1
			});
			return;
		}
		const music = message.client.music[message.guild.id].playlist.splice(from, 1)[0];
		message.client.music[message.guild.id].playlist.splice(to, 0, music);
		utils.sendMessage(message.channel, object.dictionary, 'move_success', {
			index: to + 1,
			title: music.title,
			url: music.url,
			channel: music.ownerChannelName,
			channelUrl: music.ownerProfileUrl
		});
	}
};