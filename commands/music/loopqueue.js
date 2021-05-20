
const utils = require('../../utils.js');

module.exports = {
	name: 'loopqueue',
	aliases: ['lq'],
	description: 'Boucle la playlist actuelle.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_loopqueue_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_loopqueue_not_same_voice');
			return;
		}
		const bool = !message.client.music[message.guild.id].loopqueue;
		message.client.music[message.guild.id].loopqueue = bool;
		if (bool)
			message.client.music[message.guild.id].loop = false;
		if (bool)
			utils.sendMessage(message.channel, object.dictionary, 'loopqueue_activate');
		else
			utils.sendMessage(message.channel, object.dictionary, 'loopqueue_desactivate');
	}
};