
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require(`../../utils.js`);

module.exports = {
	name: 'help',
	aliases: ['h'],
	description: 'Obtenez une liste de commandes ou d\'informations sur une commande particulière.',
	privateMessage: true,
	message: (message, object) => {
		let embed;
		if (object.args.length) {
			let command = object.args[0].toLowerCase();
			for (const category of Object.keys(message.client._commands)) {
				for (const commandFile of message.client._commands[category])
					if (commandFile.name == command
						|| commandFile.aliases.includes(command)) {
						command = commandFile;
						break;
					}
				if (typeof command == 'object')
					break;
			}
			if (typeof command == 'string') {
				utils.sendMessage(message.channel, object.dictionary, 'error_command_not_found', {
					command,
					prefix: object.prefix
				});
				return;
			}
			embed = new MessageEmbed();
			for (const key of Object.keys(command)) {
				const name = key.charAt(0).toUpperCase() + key.slice(1);
				let message = '';
				if (typeof command[key] == 'string'
					|| typeof command[key] == 'boolean')
					message = `${command[key]}`;
				else if (typeof command[key] == 'object')
					for (const value of Object.values(command[key])) {
						if (message.length)
							message += ', ';
						message += `\`${value}\``;
					}
				else
					continue;
				if (message != '')
					embed.addField(name, message);
			}
		} else {
			embed = utils.getEmbed(object.dictionary, 'help_desciption', {
				prefix: object.prefix
			});
			const dm = message.channel.type == 'dm';
			for (const category of Object.keys(message.client._commands)) {
				let commands = '';
				for (const command of message.client._commands[category]) {
					if (dm && !command.privateMessage)
						continue;
					if (commands.length)
						commands += '\n';
					commands += `\`${command.name}\` - ${command.description}`;
				}
				if (commands.length)
					embed.addField(category.charAt(0).toUpperCase() + category.slice(1), commands);
			}
		}
		embed.setTitle('Help');
		utils.sendEmbed(message.channel, object.dictionary, embed);
	}
};