

const utils = require('../../utils.js');

module.exports = {
	name: 'autoplay',
	aliases: ['ap'],
	description: 'Écouter de la musique automatiquement.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_autoplay_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_autoplay_not_same_voice');
			return;
		}
		const bool = !message.client.music[message.guild.id].autoplay;
		message.client.music[message.guild.id].autoplay = bool;
		if (bool)
			utils.sendMessage(message.channel, object.dictionary, 'autoplay_activate');
		else
			utils.sendMessage(message.channel, object.dictionary, 'autoplay_desactivate');
	}
};