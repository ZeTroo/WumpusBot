
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

const cache = [];
const getDictionary = (guild) => {
	const path = `guilds/${guild.id}.json`;
	const object = utils.readFile(path);
	if (!object.dictionary)
		object.dictionary = {};
	if (!object.dictionary.language)
		object.dictionary.language = guild.client._config.dictionary;
	const dictionary = JSON.parse(JSON.stringify(guild.client._dictionaries[object.dictionary.language]));
	if (object.dictionary.custom) {
		for (const key of Object.keys(object.dictionary.custom))
			dictionary[key] = object.dictionary.custom[key];
		object.dictionary.language += ' *(custom)*';
	}
	return dictionary;
};

module.exports = {
	name: 'level',
	aliases: ['rank'],
	description: 'Obtenez des informations ou gérez les niveaux.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'level_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'level_help', {
				prefix: object.prefix
			});
			return;
		}
		if (!['get', 'top', 'clear', 'activate', 'set', 'calc', 'leader', 'add', 'remove', 'settings', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'get', 'top', 'clear', 'activate', 'set', 'calc', 'leader', 'add', 'remove', 'settings', 'reset']) {
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
		let path = `levels/${message.guild.id}.json`;
		const level = utils.readFile(path);
		if (option == 'get') {
			const users = Array.from(message.mentions.users.values());
			if (!users.length)
				users.push(message.author);
			for (const user of users) {
				if (!level[user.id]) {
					utils.sendMessage(message.channel, object.dictionary, 'error_level_user_not_found', {
						user
					});
					return;
				}
				const levelConfig = JSON.parse(JSON.stringify(message.client._config.level));
				const maxExperience = level[user.id].level * levelConfig.multiply + levelConfig.minimum;
				let maxBar = 30;
				let rate = maxBar * level[user.id].experience / maxExperience;
				let bar = '';
				while (maxBar--)
					if (rate-- > 0)
						bar += '▣';
					else
						bar += '▢';
				utils.sendMessage(message.channel, object.dictionary, 'level_me', {
					user,
					level: level[user.id].level,
					experience: level[user.id].experience,
					maxExperience,
					bar
				});
			}
			return;
		} else if (option == 'top') {
			const orderLevel = {};
			let current;
			let length = 20;
			while (length--) {
				for (const id of Object.keys(level)) {
					const member = message.guild.members.cache.get(id);
					if (member
						&& !orderLevel[id]
						&& (!current
							|| level[id].level > level[current].level
							|| (level[id].level == level[current].level
								&& level[id].experience > level[current].experience)))
						current = id;
				}
				if (!current)
					continue;
				orderLevel[current] = level[current];
				current = null;
			}
			const messages = [utils.getMessage(object.dictionary, 'level_top')];
			let position = 1;
			for (const id of Object.keys(orderLevel)) {
				const member = message.guild.members.cache.get(id);
				if (member)
					messages.push(utils.getMessage(object.dictionary, 'level_top_user', {
						position: position++,
						user: member.user,
						level: orderLevel[id].level
					}));
			}
			if (messages.length == 1) {
				utils.sendMessage(message.channel, object.dictionary, 'error_level_no_data');
				return;
			}
			for (const ouputMessage of utils.remakeList(messages))
				utils.sendEmbed(message.channel, object.dictionary, new MessageEmbed().setDescription(ouputMessage));
			return;
		}
		if (!message.member.hasPermission('ADMINISTRATOR')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'ADMINISTRATOR'
			});
			return;
		}
		path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'clear') {
			if (loadedObject.level)
				for (let id of Object.keys(level)) {
					const member = message.guild.members.cache.get(id);
					if (!member)
						continue;
					if (loadedObject.level.leader) {
						const leader = message.guild.roles.cache.get(loadedObject.level.leader);
						if (!(leader && leader.editable)
							|| !member.roles.cache.get(leader.id))
							continue;
						member.roles.remove(leader);
					}
					if (loadedObject.level.roles)
						for (id of Object.keys(loadedObject.level.roles)) {
							const role = message.guild.roles.cache.get(id);
							if (!(role && role.editable)
								|| !member.roles.cache.get(role.id))
								continue;
							member.roles.remove(role);
						}
				}
			utils.savFile(`levels/${message.guild.id}.json`, {});
			utils.sendMessage(message.channel, object.dictionary, 'level_clear');
		} else if (option == 'activate') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level set <true/false>`
				});
				return;
			}
			if (!['true', 'false'].includes(object.args[1].toLowerCase())) {
				let options = '';
				for (const option of ['true', 'false']) {
					if (options.length)
						options += ', ';
					options += `\`${option}\``;
				}
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_option', {
					option: object.args[1],
					options
				});
				return;
			}
			const bool = object.args[1].toLowerCase() == 'true';
			if (!loadedObject.level)
				loadedObject.level = {};
			loadedObject.level.activate = bool;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_activate', {
				bool
			});
		} else if (option == 'set') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level set <channelId/every>`
				});
				return;
			}
			let channel;
			if (object.args[1].toLowerCase() != 'every') {
				channel = message.guild.channels.cache.get(object.args[1]);
				if (!channel) {
					utils.sendMessage(message.channel, object.dictionary, 'error_level_channel_not_found', {
						channel: object.args[1]
					});
					return;
				}
			}
			if (!loadedObject.level)
				loadedObject.level = {};
			if (channel)
				loadedObject.level.channel = channel.id;
			else
				delete loadedObject.level.channel;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_set', {
				channel: channel ? channel : '**every**'
			});
		} else if (option == 'calc') {
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level calc ${object.args.length == 2 ? object.args[1] : '<type>'} <number>`
				});
				return;
			}
			const type = object.args[1];
			if (!['minimum', 'multiply'].includes(type)) {
				let options = '';
				for (const option of ['minimum', 'multiply']) {
					if (options.length)
						options += ', ';
					options += `\`${option}\``;
				}
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_option', {
					option: object.args[1],
					options
				});
				return;
			}
			if (isNaN(object.args[2])) {
				utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
					arg: object.args[2]
				});
				return;
			}
			const number = parseInt(object.args[2]);
			if (number <= 0) {
				utils.sendMessage(message.channel, object.dictionary, 'error_level_number_less');
				return;
			}
			if (!loadedObject.level)
				loadedObject.level = {};
			loadedObject.level[type] = number;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_calc', {
				type,
				number
			});
		} else if (option == 'leader') {
			const roles = Array.from(message.mentions.roles.values());
			if (roles.length != 1) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level leader <role>`
				});
				return;
			}
			const role = roles[0];
			if (!loadedObject.level)
				loadedObject.level = {};
			loadedObject.level.leader = role.id;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_leader', {
				role
			});
		} else if (option == 'add') {
			const roles = Array.from(message.mentions.roles.values());
			if (roles.length != 1) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level add <role> <level>`
				});
				return;
			}
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level add ${object.args.length == 2 ? object.args[1] : '<role>'} <level>`
				});
				return;
			}
			const role = roles[0];
			const number = parseInt(object.args[2]);
			if (number <= 0) {
				utils.sendMessage(message.channel, object.dictionary, 'error_level_number_less');
				return;
			}
			if (!loadedObject.level)
				loadedObject.level = {};
			if (!loadedObject.level.roles)
				loadedObject.level.roles = {};
			loadedObject.level.roles[role.id] = number;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_add', {
				role,
				level: number
			});
		} else if (option == 'remove') {
			const roles = Array.from(message.mentions.roles.values());
			if (roles.length != 1) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}level remove <role>`
				});
				return;
			}
			const role = roles[0];
			if (!loadedObject.level)
				loadedObject.level = {};
			if (!loadedObject.level.roles)
				loadedObject.level.roles = {};
			if (!loadedObject.level.roles[role.id]) {
				utils.sendMessage(message.channel, object.dictionary, 'error_level_role_not_found', {
					role
				});
				return;
			}
			delete loadedObject.level.roles[role.id];
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_remove', {
				role
			});
		} else if (option == 'settings') {
			const settings = JSON.parse(JSON.stringify(message.client._config.level));
			if (loadedObject.level)
				Object.assign(settings, loadedObject.level);
			const embed = new MessageEmbed();
			embed.setTitle('Level settings');
			embed.addField('Activation', typeof settings.activate == 'boolean' ? settings.activate : true);
			embed.addField('Calculation', `minimum: **${settings.minimum}**, multiply: **${settings.multiply}**`);
			if (settings.channel) {
				const channel = message.guild.channels.cache.get(settings.channel);
				if (channel)
					embed.addField('Channel', channel);
			}
			if (settings.leader) {
				const role = message.guild.roles.cache.get(settings.leader);
				if (role)
					embed.addField('Leader', role);
			}
			if (settings.roles) {
				let roles = '';
				for (const id of Object.keys(settings.roles)) {
					const role = message.guild.roles.cache.get(id);
					if (!role)
						continue;
					if (roles.length)
						roles += '\n';
					roles += `${role} - **${settings.roles[id]}**`;
				}
				if (roles.length)
					embed.addField('Roles', roles);
			}
			utils.sendEmbed(message.channel, object.dictionary, embed);
		} else if (option == 'reset') {
			if (!loadedObject.level) {
				utils.sendMessage(message.channel, object.dictionary, 'error_level_no_settings');
				return;
			}
			delete loadedObject.level;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'level_reset');
		}
	},
	message_offline: message => {
		if (message.author.bot
			|| message.channel.type == 'dm'
			|| cache[message.author.id]
			&& (message.content.includes(cache[message.author.id])
				|| cache[message.author.id].includes(message.content)))
			return;
		const settings = JSON.parse(JSON.stringify(message.client._config.level));
		let path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (loadedObject.level)
			Object.assign(settings, loadedObject.level);
		if (typeof settings.activate == 'boolean' && !settings.activate)
			return;
		path = `levels/${message.guild.id}.json`;
		const level = utils.readFile(path);
		let channel = message.guild.channels.cache.get(settings.channel);
		if (!channel)
			channel = message.channel;
		if (!level[message.author.id])
			level[message.author.id] = {
				level: 0,
				experience: 0
			};
		cache[message.author.id] = message.content;
		level[message.author.id].experience += message.content.length;
		let maxExperience;
		let up = 0;
		while (level[message.author.id].experience >= (maxExperience = level[message.author.id].level * settings.multiply + settings.minimum)) {
			level[message.author.id].experience -= maxExperience;
			level[message.author.id].level++;
			up++;
		}
		utils.savFile(path, level);
		if (!up)
			return;
		const dictionary = getDictionary(message.guild);
		utils.sendEmbed(channel, dictionary, utils.getEmbed(dictionary, 'level_up', {
			name: message.member.displayName,
			up,
			level: level[message.author.id].level
		}).setTimestamp());
		if (!message.guild.me.hasPermission('MANAGE_ROLES'))
			return;
		if (settings.roles)
			for (const id of Object.keys(settings.roles))
				if (settings.roles[id] <= level[message.author.id].level) {
					const role = message.guild.roles.cache.get(id);
					if (!(role && role.editable)
						|| message.member.roles.cache.get(role.id))
						continue;
					message.member.roles.add(role);
				}
		const leader = message.guild.roles.cache.get(settings.leader);
		if (!(leader && leader.editable)
			|| message.member.roles.cache.get(leader.id))
			return;
		for (const id of Object.keys(level).filter(id => id != message.author.id))
			if (level[message.author.id].level <= level[id].level
				&& message.guild.members.cache.get(id))
				return;
		for (const id of Object.keys(level)) {
			if (id == message.author.id)
				continue;
			const member = message.guild.members.cache.get(id);
			if (!member || !member.roles.cache.get(leader.id))
				continue;
			member.roles.remove(leader);
		}
		message.member.roles.add(leader);
	}
};