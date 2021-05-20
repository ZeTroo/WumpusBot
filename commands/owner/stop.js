

const utils = require('../../utils.js');
const config = require('../../config.json');

module.exports = {
	name: 'stop',
	aliases: ['exit', 'end'],
	description: 'Arrêtez le bot.',
	privateMessage: true,
	message: async (message, object) => {
		if (!config.owners.includes(message.author.id)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_not_owner');
			return;
		}
		await utils.sendMessage(message.channel, object.dictionary, 'stop_success');
		message.client.emit('exit');
	}
};