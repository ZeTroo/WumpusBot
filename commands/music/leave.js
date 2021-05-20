

const utils = require('../../utils.js');

module.exports = {
	name: 'leave',
	aliases: ['disconnect', 'dc'],
	description: 'Retirez le robot du canal vocal.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_leave_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_leave_not_same_voice');
			return;
		}
		message.client.music[message.guild.id].connection.disconnect();
		utils.sendMessage(message.channel, object.dictionary, 'leave_success');
	}
};