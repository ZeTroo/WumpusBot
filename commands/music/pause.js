

const utils = require('../../utils.js');

module.exports = {
	name: 'pause',
	aliases: [],
	description: 'Mettre la musique en pause.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_pause_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_pause_not_same_voice');
			return;
		}
		const dispatcher = message.guild.me.voice.connection.dispatcher;
		if (dispatcher.paused) {
			utils.sendMessage(message.channel, object.dictionary, 'error_pause_already');
			return;
		}
		dispatcher.pause();
		utils.sendMessage(message.channel, object.dictionary, 'pause_success');
	}
};