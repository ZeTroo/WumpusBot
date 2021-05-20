

const utils = require('../../utils.js');

module.exports = {
	name: 'clearqueue',
	aliases: ['cq'],
	description: 'Effacez la file d\'attente musicale actuelle.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_clearqueue_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_clearqueue_not_same_voice');
			return;
		}
		message.client.music[message.guild.id].playlist = [];
		utils.sendMessage(message.channel, object.dictionary, 'clearqueue_success');
	}
};