
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'say',
	aliases: [],
	description: 'Envoyez un message avec le bot.',
	privateMessage: false,
	message: (message, object) => {
		if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
				permission: 'MANAGE_MESSAGES'
			});
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}message <message...>`
			});
			return;
		}
		message.delete({
			reason: 'Message command executed.'
		});
		let input = '';
		for (const word of object.args) {
			if (input.length)
				input += ' ';
			input += word;
		}
		const embed = new MessageEmbed();
		embed.setDescription(input);
		utils.sendEmbed(message.channel, object.dictionary, embed);
	}
};