

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'authorize',
	aliases: ['permit', 'allow', 'rule'],
	description: 'Activez ou désactivez une ou plusieurs commandes dans un canal spécifique.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'authorize_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'authorize_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'list') {
			if (!object.authorize) {
				utils.sendMessage(message.channel, object.dictionary, 'error_authorize_not_defined');
				return;
			}
			const lines = [];
			for (const command of Object.keys(object.authorize)) {
				lines.push(`\n**${command}**:`);
				for (const channelId of Object.keys(object.authorize[command]))
					if (channelId != 'disable') {
						const channel = message.guild.channels.cache.get(channelId);
						if (channel)
							lines.push(`${channel}: \`${object.authorize[command][channelId]}\``);
					}
			}
			const messages = utils.remakeList(lines);
			for (const description of messages) {
				const embed = new MessageEmbed();
				embed.setDescription(description);
				utils.sendEmbed(message.channel, object.dictionary, embed);
			}
			return;
		} else if (!['add', 'remove', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'add', 'remove', 'list', 'reset']) {
				if (options.length)
					options += ', ';
				options += `\`${option}\``;
			}
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_option', {
				option: object.args[0],
				options
			});
			return;
		}
		if (!message.member.hasPermission('ADMINISTRATOR')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'ADMINISTRATOR'
			});
			return;
		}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'add') {
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}authorize add ${option} ${object.args.length == 1 ? '<command/categorie/all>' : object.args[1]} <enable/disable> [channelId]`
				});
				return;
			}
			let rules = {
				all: 'all'
			};
			for (const category of Object.keys(message.client._commands)) {
				rules[category] = category;
				for (const command of message.client._commands[category]) {
					rules[command.name] = command.name;
					for (const aliase of command.aliases)
						rules[aliase] = command.name;
				}
			}
			const rule = rules[object.args[1].toLowerCase()];
			if (!rule) {
				utils.sendMessage(message.channel, object.dictionary, 'error_authorize_command_cannot_set', {
					command: object.args[1]
				});
				return;
			}
			const setting = object.args[2].toLowerCase();
			if (!['enable', 'disable'].includes(setting)) {
				let options = '';
				for (const option of ['enable', 'disable']) {
					if (options.length)
						options += ', ';
					options += `\`${option}\``;
				}
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_option', {
					option: object.args[2],
					options
				});
				return;
			}
			let channel;
			if (object.args.length < 4)
				channel = message.channel;
			else {
				channel = message.guild.channels.cache.get(object.args[3]);
				if (!channel) {
					utils.sendMessage(message.channel, object.dictionary, 'error_authorize_channel_not_found', {
						id: object.args[3]
					});
					return;
				}
			}
			if (!loadedObject.authorize)
				loadedObject.authorize = {};
			if (!loadedObject.authorize[rule])
				loadedObject.authorize[rule] = {};
			for (const channelId of Object.keys(loadedObject.authorize[rule]))
				if (!message.guild.channels.cache.get(channelId))
					delete loadedObject.authorize[rule][channelId];
			loadedObject.authorize[rule][channel.id] = setting == 'enable' ? true : false;
			if (loadedObject.authorize[rule][channel.id])
				loadedObject.authorize[rule].disable = true;
			else {
				delete loadedObject.authorize[rule].disable;
				for (const channelId of Object.keys(loadedObject.authorize[rule]))
					if (loadedObject.authorize[rule][channelId]) {
						loadedObject.authorize[rule].disable = true;
						break;
					}
			}
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'authorize_add', {
				setting,
				command: rule,
				channel
			});
		} else if (option == 'remove') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}authorize remove <command/categorie/all>`
				});
				return;
			}
			const rule = object.args[1].toLowerCase();
			if (!(loadedObject.authorize && loadedObject.authorize[rule])) {
				utils.sendMessage(message.channel, object.dictionary, 'error_authorize_rule_not_found', {
					rule: object.args[1]
				});
				return;
			}
			delete loadedObject.authorize[rule];
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'authorize_remove', {
				rule
			});
		} else if (option == 'reset') {
			if (!loadedObject.authorize) {
				utils.sendMessage(message.channel, object.dictionary, 'error_authorize_not_defined');
				return;
			}
			delete loadedObject.authorize;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'authorize_reset');
		}
	}
};