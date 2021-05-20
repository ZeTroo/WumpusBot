

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'rate',
	aliases: [],
	description: 'Évaluez une question.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}rate <question...>`
			});
			return;
		}
		let question = '';
		for (const word of object.args) {
			if (question.length)
				question += ' ';
			question += word;
		}
		const score = utils.getUserScore(message.author) % 100 + utils.getStringScore(question);
		utils.sendEmbed(message.channel, object.dictionary, new MessageEmbed().setDescription(`${score % 10}/10`));
	}
};