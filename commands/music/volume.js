
const utils = require('../../utils.js');

module.exports = {
	name: 'volume',
	aliases: ['vl'],
	description: 'Gérez le volume. ',
	privateMessage: false,
	message: async (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_volume_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_volume_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}volume <number>`
			});
			return;
		}
		if (isNaN(object.args[0])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				arg: object.args[0]
			});
			return;
		}
		const number = parseFloat(object.args[0]);
		if (number < 0 || number > 10) {
			utils.sendMessage(message.channel, object.dictionary, 'error_volume_not_right_interval', {
				min: 0,
				max: 10
			});
			return;
		}
		let start;
		if (message.client._commands.music)
			start = message.client._commands.music.find(item => item.start).start;
		if (!start) {
			utils.sendMessage(message.channel, dictionary, 'error_volume_no_start');
			return;
		}
		message.client.music[message.guild.id].volume = number;
		const current = message.client.music[message.guild.id].current;
		current.time = (current.time ? current.time : 0) + message.client.music[message.guild.id].connection.dispatcher.streamTime;
		await start(message.client, message.guild.id, current);
		utils.sendMessage(message.channel, object.dictionary, 'volume_success', {
			number
		});
	}
};