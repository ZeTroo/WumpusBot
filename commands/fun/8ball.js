
const utils = require('../../utils.js');

module.exports = {
	name: '8ball',
	aliases: ['answer', 'ball'],
	description: 'Répondre à une question.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}8ball <question...>`
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
		const list = ['yes', 'no', 'know','ferme','cp'];
		utils.sendMessage(message.channel, object.dictionary, list[score % list.length]);
		
	}
};