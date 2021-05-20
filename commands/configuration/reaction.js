
const utils = require('../../utils.js');
const MessageEmbed = require('discord.js').MessageEmbed;

module.exports = {
	name: 'reaction',
	aliases: ['react'],
	description: 'Faire réagir permettant d\'avoir un rôle.',
	privateMessage: false,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'reaction_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'reaction_help', {
				prefix: object.prefix
			});
			return;
		} else if (!['add', 'force', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'add', 'force', 'reset']) {
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
		if (!message.member.hasPermission('MANAGE_ROLES')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'MANAGE_ROLES'
			});
			return;
		}
		for (const permission of ['MANAGE_ROLES', 'ADD_REACTIONS'])
			if (!message.guild.me.hasPermission(permission)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
					permission
				});
				return;
			}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'add') {
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}reaction add <role> <emoji> [...] [messageId]`
				});
				return;
			}
			const reactions = {};
			let roles = '';
			let index;
			for (index = 1; index < object.args.length - 1; index += 2) {
				const role = message.guild.roles.cache.find(role => object.args[index].includes(role.id));
				if (!role) {
					utils.sendMessage(message.channel, object.dictionary, 'error_reaction_role_not_found', {
						role: object.args[index]
					});
					return;
				}
				if (roles.length)
					roles += '\n';
				roles += `${object.args[index + 1]} - ${role}`;
				reactions[object.args[index + 1]] = role.id;
			}
			let roleMessage;
			if (index < object.args.length) {
				roleMessage = message.channel.messages.cache.get(object.args[index]);
				if (!roleMessage) {
					utils.sendMessage(message.channel, object.dictionary, 'error_reaction_message_not_found', {
						message: object.args[index]
					});
					return;
				}
			} else
				roleMessage = await utils.sendMessage(message.channel, object.dictionary, 'reaction_message', {
					roles
				});
			for (const key of Object.keys(reactions)) {
				let emoji = key;
				if (emoji.includes(':') && emoji.includes('>'))
					emoji = emoji.slice(emoji.lastIndexOf(':') + 1, emoji.lastIndexOf('>'));
				try {
					emoji = (await roleMessage.react(emoji)).emoji;
				} catch {
					utils.replaceMessage(roleMessage, object.dictionary, 'error_reaction_emoji_not_found', {
						emoji: key
					});
					return;
				}
				const roleId = reactions[key];
				delete reactions[key];
				reactions[emoji.id ? emoji.id : emoji.name] = roleId;
			}
			if (!loadedObject.reactions)
				loadedObject.reactions = {};
			if (!loadedObject.reactions.messages)
				loadedObject.reactions.messages = {};
			loadedObject.reactions.messages[roleMessage.id] = reactions;
			utils.savFile(path, loadedObject);
		} else if (option == 'force') {
			const roles = Array.from(message.mentions.roles.values());
			if (roles.length != 1) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}reaction force <role>`
				});
				return;
			}
			const role = roles[0];
			if (!loadedObject.reactions)
				loadedObject.reactions = {};
			if (!loadedObject.reactions.channels)
				loadedObject.reactions.channels = {};
			loadedObject.reactions.channels[message.channel.id] = role.id;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'reaction_force', {
				role,
				channel: message.channel
			});
		} else if (option == 'reset') {
			if (!loadedObject.reactions) {
				utils.sendMessage(message.channel, object.dictionary, 'error_reaction_already_reset');
				return;
			}
			delete loadedObject.reactions;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'reaction_reset');
		}
	},
	messageReactionAdd: (messageReaction, user) => {
		if (messageReaction.message.channel.type == 'dm'
			|| user.bot
			|| !messageReaction.message.channel.permissionsFor(messageReaction.message.guild.me).has('MANAGE_ROLES'))
			return;
		const path = `guilds/${messageReaction.message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (!loadedObject.reactions)
			return
		const member = messageReaction.message.guild.members.cache.get(user.id);
		if (loadedObject.reactions.channels
			&& loadedObject.reactions.channels[messageReaction.message.channel.id]) {
			const force = messageReaction.message.guild.roles.cache.get(loadedObject.reactions.channels[messageReaction.message.channel.id]);
			if (force && force.editable) {
				let checked = true;
				for (const message of messageReaction.message.channel.messages.cache.values()) {
					const reactions = Array.from(message.reactions.cache.values());
					if (reactions.length)
						for (const reaction of reactions)
							if (reaction.users.cache.get(user.id)) {
								checked = true;
								break;
							} else
								checked = false;
					if (!checked)
						break;
				}
				if (checked)
					member.roles.add(force);
			}
		}
		if (!(loadedObject.reactions.messages
			&& loadedObject.reactions.messages[messageReaction.message.id]
			&& loadedObject.reactions.messages[messageReaction.message.id][messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name]))
			return;
		const role = messageReaction.message.guild.roles.cache.get(loadedObject.reactions.messages[messageReaction.message.id][messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name]);
		if (!(role && role.editable)) {
			messageReaction.users.remove(user);
			return;
		}
		member.roles.add(role);
		for (const emoji of messageReaction.message.reactions.cache.keys())
			if (emoji != (messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name))
				messageReaction.message.reactions.cache.get(emoji).users.remove(user);
	},
	messageReactionRemove: (messageReaction, user) => {
		if (messageReaction.message.channel.type == 'dm'
			|| user.bot
			|| !messageReaction.message.channel.permissionsFor(messageReaction.message.guild.me).has('MANAGE_ROLES'))
			return;
		const path = `guilds/${messageReaction.message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (!loadedObject.reactions)
			return
		const member = messageReaction.message.guild.members.cache.get(user.id);
		if (loadedObject.reactions.channels
			&& loadedObject.reactions.channels[messageReaction.message.channel.id]) {
			const force = messageReaction.message.guild.roles.cache.get(loadedObject.reactions.channels[messageReaction.message.channel.id]);
			if (force && force.editable) {
				let checked = true;
				for (const message of messageReaction.message.channel.messages.cache.values()) {
					const reactions = Array.from(message.reactions.cache.values());
					if (reactions.length)
						for (const reaction of reactions)
							if (reaction.users.cache.get(user.id)) {
								checked = true;
								break;
							} else
								checked = false;
					if (!checked)
						break;
				}
				if (!checked) {
					member.roles.remove(force);
					for (const memberRole of member.roles.cache.values())
						if (memberRole.editable
							&& memberRole.rawPosition > force.rawPosition)
							member.roles.remove(memberRole);
				}
			}
		}
		if (!(loadedObject.reactions.messages
			&& loadedObject.reactions.messages[messageReaction.message.id]
			&& loadedObject.reactions.messages[messageReaction.message.id][messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name]))
			return;
		const role = messageReaction.message.guild.roles.cache.get(loadedObject.reactions.messages[messageReaction.message.id][messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name]);
		if (!(role && role.editable))
			return;
		member.roles.remove(role);
		for (const emoji of messageReaction.message.reactions.cache.keys())
			if (emoji != (messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name))
				messageReaction.message.reactions.cache.get(emoji).users.remove(user);
	}
};