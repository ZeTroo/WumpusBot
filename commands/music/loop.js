

const utils = require('../../utils.js');

module.exports = {
	name: 'loop',
	aliases: [],
	description: 'Bouclez la musique actuelle.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_loop_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_loop_not_same_voice');
			return;
		}
		const bool = !message.client.music[message.guild.id].loop;
		message.client.music[message.guild.id].loop = bool;
		if (bool)
			message.client.music[message.guild.id].loopqueue = false;
		if (bool)
			utils.sendMessage(message.channel, object.dictionary, 'loop_activate');
		else
			utils.sendMessage(message.channel, object.dictionary, 'loop_desactivate');
	}
};