

const utils = require('../../utils.js');

module.exports = {
	name: 'seek',
	aliases: [],
	description: 'Cherchez la musique.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_seek_no_data');
			return;
		}
		if (!(message.guild.me.voice.channelID
			&& message.member.voice.channelID == message.guild.me.voice.channelID)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_seek_not_same_voice');
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}seek <seconds>`
			});
			return;
		}
		if (isNaN(object.args[0])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				'arg': object.args[0]
			});
			return;
		}
		const number = parseInt(object.args[0])
		if (number < 0) {
			utils.sendMessage(message.channel, object.dictionary, 'error_seek_number_too_small');
			return;
		}
		let time = number * 1000;
		const current = message.client.music[message.guild.id].current;
		const max = parseInt(current.formats[0].approxDurationMs);
		if (time > max)
			time = max;
		current.time = time;
		let start;
		if (message.client._commands.music)
			start = message.client._commands.music.find(item => item.start).start;
		if (!start) {
			utils.sendMessage(message.channel, dictionary, 'error_seek_no_start');
			return;
		}
		start(message.client, message.guild.id, current);
		time -= time % 1000;
		time /= 1000;
		let seconde = time % 60;
		const minute = (time - seconde) / 60;
		if (seconde < 10)
			seconde = `0${seconde}`;
		utils.sendMessage(message.channel, object.dictionary, 'seek_success', {
			time: `${minute}:${seconde}`
		});
	}
};