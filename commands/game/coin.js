
const utils = require('../../utils.js');

module.exports = {
	name: 'coin',
	aliases: [],
	description: 'Pile ou face.',
	privateMessage: true,
	message: (message, object) => {
		if (Math.floor(Math.random() * 2))
			utils.sendMessage(message.channel, object.dictionary, 'coin_head');
		else
			utils.sendMessage(message.channel, object.dictionary, 'coin_tail');
	}
};