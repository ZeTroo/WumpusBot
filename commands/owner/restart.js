
const utils = require('../../utils.js');
const config = require('../../config.json');

module.exports = {
	name: 'restart',
	aliases: ['reboot', 'rb', 'reload', 'rl'],
	description: 'Redémarrez le bot.',
	privateMessage: true,
	message: async (message, object) => {
		if (!config.owners.includes(message.author.id)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_not_owner');
			return;
		}
		await utils.sendMessage(message.channel, object.dictionary, 'restart_success');
		message.client.emit('exit', 2);
	}
};