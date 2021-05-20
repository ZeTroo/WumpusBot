
const Permissions = require('discord.js').Permissions;
const utils = require('../../utils.js');

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
	name: 'mute',
	aliases: [],
	description: 'Interdisez les messages et les discours de quelqu\'un.',
	privateMessage: false,
	message: async (message, object) => {
		if (!message.member.hasPermission('MUTE_MEMBERS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'MUTE_MEMBERS'
			});
			return;
		}
		for (const permission of ['MANAGE_ROLES', 'MANAGE_CHANNELS', 'SEND_MESSAGES', 'SEND_MESSAGES', 'SPEAK', 'ADD_REACTIONS', 'MANAGE_MESSAGES', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS'])
			if (!message.guild.me.hasPermission(permission)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
					permission: permission
				});
				return;
			}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}mute <userId>`
			});
			return;
		}
		const member = message.guild.members.cache.get(object.args[0]);
		if (!member) {
			utils.sendMessage(message.channel, object.dictionary, 'error_mute_member_not_found', {
				member: object.args[0]
			});
			return;
		}
		if (!member.manageable) {
			utils.sendMessage(message.channel, object.dictionary, 'error_mute_not_manageable', {
				member
			});
			return;
		}
		if (member.roles.highest.position >= message.member.roles.highest.position) {
			utils.sendMessage(message.channel, object.dictionary, 'error_mute_highest', {
				member
			});
			return;
		}
		let path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		let role;
		if (loadedObject.mute)
			role = message.guild.roles.cache.get(loadedObject.mute);
		if (!role) {
			role = await message.guild.roles.create({
				data: {
					name: 'Muted',
					color: 'RANDOM',
					hoist: true,
					permissions: new Permissions()
				},
				reason: 'Initialization of the mute command'
			});
			for (const channel of message.guild.channels.cache.values())
				if (['text', 'voice'].includes(channel.type) && channel.manageable)
					channel.updateOverwrite(role, {
						SEND_MESSAGES: false,
						SPEAK: false,
						ADD_REACTIONS: false,
						MANAGE_MESSAGES: false,
						MUTE_MEMBERS: false,
						DEAFEN_MEMBERS: false,
						MOVE_MEMBERS: false
					}, 'Initialization of the mute command');
			loadedObject.mute = role.id;
			utils.savFile(path, loadedObject);
		}
		path = `members/${member.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.punishments)
			loadedMember.punishments = {};
		if (!loadedMember.punishments[message.guild.id])
			loadedMember.punishments[message.guild.id] = {};
		if (loadedMember.punishments[message.guild.id].mute) {
			member.roles.remove(role, 'Mute command executed.');
			delete loadedMember.punishments[message.guild.id].mute;
			utils.savFile(path, loadedMember);
			utils.sendMessage(message.channel, object.dictionary, 'mute_remove', {
				member
			});
			utils.sendMessage(await member.createDM(), object.dictionary, 'mute_remove_dm', {
				guild: member.guild.name
			}).catch(() => { });
			return;
		}
		if (object.args.length < 4) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}mute <userId> <number> <unit> <reason...>`
			});
			return;
		}
		if (isNaN(object.args[1])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				arg: object.args[1]
			});
			return;
		}
		const number = parseInt(object.args[1]);
		if (number <= 0) {
			utils.sendMessage(message.channel, object.dictionary, 'error_mute_number_too_small');
			return;
		}
		const unit = object.args[2].toLowerCase();
		if (!['hour', 'day', 'month', 'year'].includes(unit)) {
			let options = '';
			for (const option of ['hour', 'day', 'month', 'year']) {
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
		let addition = number;
		switch (unit) {
			case 'year':
				addition *= 12;
			case 'month':
				addition *= 30;
			case 'day':
				addition *= 24;
			case 'hour':
				addition *= 60 * 60 * 1000;
		}
		let reason = '';
		for (let index = 3; index < object.args.length; index++) {
			if (reason.length)
				reason += ' ';
			reason += object.args[index];
		}
		member.roles.add(role, reason);
		let timestamp = new Date().getTime();
		if (!loadedMember.punishments[message.guild.id].logs)
			loadedMember.punishments[message.guild.id].logs = {};
		loadedMember.punishments[message.guild.id].logs[timestamp] = reason;
		loadedMember.punishments[message.guild.id].mute = timestamp + addition;
		utils.savFile(path, loadedMember);
		utils.sendMessage(message.channel, object.dictionary, 'mute_success', {
			member,
			number,
			unit,
			reason
		});
		utils.sendMessage(await member.createDM(), object.dictionary, 'mute_private', {
			number,
			unit,
			reason,
			guild: member.guild.name
		}).catch(() => { });
	},
	channelCreate: channel => {
		if (!['text', 'voice'].includes(channel.type))
			return;
		for (const permission of ['MANAGE_ROLES', 'MANAGE_CHANNELS', 'SEND_MESSAGES', 'SPEAK', 'ADD_REACTIONS', 'MANAGE_MESSAGES', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS'])
			if (!channel.guild.me.hasPermission(permission))
				return;
		const path = `guilds/${channel.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		const role = channel.guild.roles.cache.get(loadedObject.mute);
		if (role)
			channel.updateOverwrite(role, {
				SEND_MESSAGES: false,
				SPEAK: false,
				ADD_REACTIONS: false,
				MANAGE_MESSAGES: false,
				MUTE_MEMBERS: false,
				DEAFEN_MEMBERS: false,
				MOVE_MEMBERS: false
			}, 'Mute Role');
	},
	timer: async client => {
		const timestamp = new Date().getTime();
		for (const guild of client.guilds.cache.values()) {
			let role;
			let dictionary;
			for (const member of guild.members.cache.values()) {
				const path = `members/${member.id}.json`;
				const loadedMember = utils.readFile(path);
				if (!loadedMember.punishments)
					loadedMember.punishments = {};
				if (!loadedMember.punishments[guild.id])
					loadedMember.punishments[guild.id] = {};
				if (loadedMember.punishments[guild.id].mute <= timestamp) {
					if (!role) {
						const path = `guilds/${guild.id}.json`;
						const loadedObject = utils.readFile(path);
						if (loadedObject.mute)
							role = guild.roles.cache.get(loadedObject.mute);
						if (!role) {
							role = await guild.roles.create({
								data: {
									name: 'Muted',
									color: 'RANDOM',
									hoist: true,
									permissions: new Permissions()
								},
								reason: 'Initialization of the mute command'
							});
							for (const channel of guild.channels.cache.values())
								if (['text', 'voice'].includes(channel.type) && channel.manageable)
									channel.updateOverwrite(role, {
										SEND_MESSAGES: false,
										SPEAK: false
									}, 'Initialization of the mute command');
							loadedObject.mute = role.id;
							utils.savFile(path, loadedObject);
						}
					}
					member.roles.remove(role, 'End of mute.');
					delete loadedMember.punishments[guild.id].mute;
					utils.savFile(path, loadedMember);
					if (!dictionary)
						dictionary = getDictionary(guild);
					utils.sendMessage(await member.createDM(), dictionary, 'mute_remove_dm', {
						guild: guild.name
					}).catch(() => { });
				}
			}
		}
	}
};