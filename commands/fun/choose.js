

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'choose',
	aliases: [],
	description: 'Choisissez entre quelques arguments.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}chose <question...>`
			});
			return;
		}
		const args = object.args.join(' ').split(',').map(item => item.trim());
		if (args.length < 2) {
			utils.sendMessage(message.channel, object.dictionary, 'error_chose_less');
			return;
		}
		utils.sendEmbed(message.channel, object.dictionary, new MessageEmbed().setDescription(args[Math.floor(Math.random() * args.length)]));
	}
};