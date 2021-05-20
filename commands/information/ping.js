
const utils = require('../../utils.js');

module.exports = {
	name: 'ping',
	aliases: [],
	description: 'Obtenez le ping moyen de tous les WebSocketShards.',
	privateMessage: true,
	message: (message, object) => {
		utils.sendMessage(message.channel, object.dictionary, 'ping_success', {
			ping: message.client.ws.ping
		});
	}
};