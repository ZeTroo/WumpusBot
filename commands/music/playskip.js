

const utils = require('../../utils.js');

module.exports = {
	name: 'playskip',
	aliases: ['ps'],
	description: 'Changez la musique actuelle en une autre.',
	privateMessage: false,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}playskip <url>`
			});
			return;
		}
		let play;
		if (message.client._commands.music)
			play = message.client._commands.music.find(item => item.play).play;
		if (!play) {
			utils.sendMessage(message.channel, object.dictionary, 'error_playskip_no_play');
			return;
		}
		const skip = message.client.music && message.client.music[message.guild.id];
		await play(message.member, message.client, message.channel, message.guild, object.dictionary, object.args[0], 0);
		if (skip)
			message.client.music[message.guild.id].connection.dispatcher.emit('finish');
	}
};