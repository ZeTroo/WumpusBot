
const utils = require('../../utils.js');

module.exports = {
	name: 'punishment',
	aliases: [],
	description: 'Voir toutes les punitions infligées à quelqu\'un.',
	privateMessage: false,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}punishment <userId>`
			});
			return;
		}
		const path = `members/${object.args[0]}.json`;
		const loadedMember = utils.readFile(path);
		if (!(loadedMember.punishments
			&& loadedMember.punishments[message.guild.id]
			&& loadedMember.punishments[message.guild.id].logs)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_punishment_no_data');
			return;
		}
		const lines = [];
		for (const log of Object.keys(loadedMember.punishments[message.guild.id].logs))
			lines.push(`**${new Date(parseInt(log))}**:\n\`${loadedMember.punishments[message.guild.id].logs[log]}\`\n`);
		const messages = utils.remakeList(lines, 2048 - object.dictionary.punishment_success.length);
		for (const logs of messages)
			utils.sendMessage(message.channel, object.dictionary, 'punishment_success', {
				logs
			});
	}
}