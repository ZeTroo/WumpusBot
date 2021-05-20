
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
	name: 'ban',
	aliases: [],
	description: 'Interdire quelqu\'un d\'un serveur.',
	privateMessage: false,
	message: async (message, object) => {
		if (!message.member.hasPermission('BAN_MEMBERS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'BAN_MEMBERS'
			});
			return;
		}
		if (!message.guild.me.hasPermission('BAN_MEMBERS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
				permission: 'BAN_MEMBERS'
			});
			return;
		}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}ban <userId>`
			});
			return;
		}
		const user = await message.client.users.fetch(object.args[0], false).catch(() => { });
		if (!user) {
			utils.sendMessage(message.channel, object.dictionary, 'error_ban_user_not_found', {
				user: object.args[0]
			});
			return;
		}
		const path = `members/${user.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.punishments)
			loadedMember.punishments = {};
		if (!loadedMember.punishments[message.guild.id])
			loadedMember.punishments[message.guild.id] = {};
		const bans = await message.guild.fetchBans();
		if (bans.get(user.id)) {
			message.guild.members.unban(user, 'Ban command executed.');
			delete loadedMember.punishments[message.guild.id].ban;
			utils.savFile(path, loadedMember);
			utils.sendMessage(message.channel, object.dictionary, 'ban_remove', {
				tag: user.tag
			});
			const dm = await user.createDM();
			utils.sendMessage(dm, object.dictionary, 'ban_remove_dm', {
				guild: message.guild.name
			}).then(async () => {
				for (const channel of message.guild.channels.cache.values())
					if (channel.type == 'text'
						&& channel.permissionsFor(message.guild.me).has('CREATE_INSTANT_INVITE')) {
						const invite = await channel.createInvite({
							temporary: false,
							maxAge: 24 * 60 * 60,
							maxUses: 1,
							unique: true,
							reason: 'Unban'
						});
						dm.send(invite.url);
						break;
					}
			}).catch(() => { });
			return;
		}
		if (object.args.length < 4) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}ban <userId> <number> <unit> <reason...>`
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
			utils.sendMessage(message.channel, object.dictionary, 'error_ban_number_too_small');
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
		await utils.sendMessage(await user.createDM(), object.dictionary, 'ban_private', {
			number,
			unit,
			reason,
			guild: message.guild.name
		}).catch(() => { });
		if (!(await message.guild.members.ban(user, {
			days: 1,
			reason
		}).catch(() => { }))) {
			utils.sendMessage(message.channel, object.dictionary, 'error_ban_api', {
				tag: user.tag
			});
			return;
		}
		let timestamp = new Date().getTime();
		if (!loadedMember.punishments[message.guild.id].logs)
			loadedMember.punishments[message.guild.id].logs = {};
		loadedMember.punishments[message.guild.id].logs[timestamp] = reason;
		loadedMember.punishments[message.guild.id].ban = timestamp + addition;
		utils.savFile(path, loadedMember);
		utils.sendMessage(message.channel, object.dictionary, 'ban_success', {
			tag: user.tag,
			number,
			unit,
			reason
		});
	},
	timer: async client => {
		const timestamp = new Date().getTime();
		for (const guild of client.guilds.cache.values())
			if (guild.me.hasPermission('BAN_MEMBERS')) {
				let dictionary;
				for (const ban of (await guild.fetchBans()).values()) {
					const path = `members/${ban.user.id}.json`;
					const loadedMember = utils.readFile(path);
					if (!loadedMember.punishments)
						loadedMember.punishments = {};
					if (!loadedMember.punishments[guild.id])
						loadedMember.punishments[guild.id] = {};
					if (loadedMember.punishments[guild.id].ban <= timestamp) {
						guild.members.unban(ban.user, 'End of ban.');
						delete loadedMember.punishments[guild.id].ban;
						utils.savFile(path, loadedMember);
						if (!dictionary)
							dictionary = getDictionary(guild);
						const dm = await ban.user.createDM();
						utils.sendMessage(dm, dictionary, 'ban_remove_dm', {
							guild: guild.name
						}).then(async () => {
							for (const channel of guild.channels.cache.values())
								if (channel.type == 'text'
									&& channel.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE')) {
									const invite = await channel.createInvite({
										temporary: false,
										maxAge: 24 * 60 * 60,
										maxUses: 1,
										unique: true,
										reason: 'Unban'
									});
									dm.send(invite.url);
									break;
								}
						}).catch(() => { });
					}
				}
			}
	}
};