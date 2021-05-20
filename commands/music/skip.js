

const utils = require('../../utils.js');

module.exports = {
	name: 'skip',
	aliases: [],
	description: 'Passer la musique',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_skip_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_skip_not_same_voice');
			return;
		}
		const current = message.client.music[message.guild.id].current;
		if (!current) {
			utils.sendMessage(message.channel, object.dictionary, 'error_skip_no_music');
			return;
		}
		message.client.music[message.guild.id].connection.dispatcher.emit('finish');
		utils.sendMessage(message.channel, object.dictionary, 'skip_success', {
			title: current.title,
			url: current.url,
			channel: current.ownerChannelName,
			channelUrl: current.ownerProfileUrl
		});
	}
};