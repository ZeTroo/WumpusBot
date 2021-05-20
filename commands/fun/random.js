

const utils = require('../../utils.js');

module.exports = {
	name: 'random',
	aliases: [],
	description: 'Obtenez un nombre aléatoire entre zéro et un nombre.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}random <number>`
			});
			return;
		}
		if (isNaN(object.args[0])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				arg: object.args[0]
			});
			return;
		}
		const number = parseInt(object.args[0]);
		if (number <= 0) {
			utils.sendMessage(message.channel, object.dictionary, 'error_random_number_too_small');
			return;
		}
		utils.sendMessage(message.channel, object.dictionary, 'random_success', {
			number: Math.floor(Math.random() * (number + 1))
		});
	}
};