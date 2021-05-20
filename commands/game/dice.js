

const utils = require('../../utils.js');

module.exports = {
	name: 'dice',
	aliases: [],
	description: 'Lancez un dé.',
	privateMessage: true,
	message: (message, object) => {
		utils.sendMessage(message.channel, object.dictionary, 'dice_success', {
			number: Math.floor(Math.random() * 6) + 1
		});
	}
};