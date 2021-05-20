
const { MessageEmbed, GuildAuditLogs } = require('discord.js');
const utils = require('../../utils.js');

const events = {
	guildmemberadd: ['displayName', 'tag', 'member', 'inviter', 'uses', 'member_count'],
	guildmemberremove: ['displayName', 'tag', 'member', 'member_count'],
	messageupdate: ['displayName', 'tag', 'member', 'channel', 'oldcontent', 'newcontent', 'link'],
	messagedelete: ['displayName', 'tag', 'member', 'channel', 'content', 'deleter'],
	voiceadd: ['displayName', 'tag', 'member', 'channel'],
	voiceremove: ['displayName', 'tag', 'member', 'channel'],
	voiceupdate: ['displayName', 'tag', 'member', 'oldchannel', 'newchannel']
};

const codes = {};
let logDeletedCount = {};

const getObject = (guild) => {
	const object = utils.readFile(`guilds/${guild.id}.json`);
	if (!object.dictionary)
		object.dictionary = {};
	if (!object.dictionary.language)
		object.dictionary.language = guild.client._config.dictionary;
	if (!object.prefix)
		object.prefix = guild.client._config.prefix;
	const dictionary = JSON.parse(JSON.stringify(guild.client._dictionaries[object.dictionary.language]));
	if (object.dictionary.custom) {
		for (const key of Object.keys(object.dictionary.custom))
			dictionary[key] = object.dictionary.custom[key];
		object.dictionary.language += ' *(custom)*';
	}
	Object.assign(object, {
		language: object.dictionary.language,
		dictionary
	});
	return object;
};

module.exports = {
	name: 'event',
	aliases: [],
	description: 'Gérez les événements sur le serveur.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'event_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'event_help', {
				prefix: object.prefix
			});
			return;
		} else if (!['add', 'remove', 'list', 'reset'].includes(option)) {
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
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}event add <event> [channelId] [message...]`
				});
				return;
			}
			const event = object.args[1].toLowerCase();
			if (!Object.keys(events).includes(event)) {
				let options = '';
				for (const option of Object.keys(events)) {
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
			let channel;
			if (object.args.length == 2)
				channel = message.channel;
			else {
				channel = message.guild.channels.cache.get(object.args[2]);
				if (!channel) {
					utils.sendMessage(message.channel, object.dictionary, 'error_event_channel_not_found', {
						id: object.args[2]
					});
					return;
				}
			}
			let eventMessage;
			if (object.args.length < 4)
				eventMessage = utils.getMessage(object.dictionary, `event_message_${event}`);
			else {
				eventMessage = '';
				for (let index = 3; index < object.args.length; index++) {
					if (eventMessage.length)
						eventMessage += ' ';
					eventMessage += object.args[index];
				}
				let check = false;
				for (const arg of events[event])
					if (eventMessage.includes(`<${arg}>`)) {
						check = true;
						break;
					}
				if (!check) {
					let args = '';
					for (const arg of events[event]) {
						if (args.length)
							args += ', ';
						args += `\`<${arg}>\``;
					}
					utils.sendMessage(message.channel, object.dictionary, 'error_event_no_args', {
						message: eventMessage,
						args
					});
					return;
				}
			}
			if (!loadedObject.events)
				loadedObject.events = {};
			loadedObject.events[event] = {
				channel: channel.id,
				message: eventMessage
			};
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'event_add', {
				event,
				channel
			});
		} else if (option == 'remove') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}event remove <event>`
				});
				return;
			}
			const event = object.args[1].toLowerCase();
			if (!Object.keys(events).includes(event)) {
				let options = '';
				for (const option of Object.keys(events)) {
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
			if (!loadedObject.events[event]) {
				utils.sendMessage(message.channel, object.dictionary, 'error_event_event_not_found', {
					event
				});
				return;
			}
			delete loadedObject.events[event];
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'event_remove', {
				event
			});
		} else if (option == 'list') {
			if (!(object.events && Object.keys(object.events).length)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_event_no_data');
				return;
			}
			const embed = new MessageEmbed();
			embed.setTitle('Event list');
			const eventObject = {};
			for (const event of Object.keys(object.events)) {
				if (!eventObject[object.events[event].channel])
					eventObject[object.events[event].channel] = {};
				eventObject[object.events[event].channel][event] = object.events[event].message;
			}
			for (const id of Object.keys(eventObject)) {
				const channel = message.guild.channels.cache.get(id);
				if (!channel)
					continue;
				let events = '';
				for (const event of Object.keys(eventObject[id])) {
					if (events.length)
						events += '\n';
					events += `**${event}**: \`${eventObject[id][event]}\``;
				}
				embed.addField(channel.name, events);
			}
			utils.sendEmbed(message.channel, object.dictionary, embed);
		} else if (option == 'reset') {
			if (!loadedObject.events) {
				utils.sendMessage(message.channel, object.dictionary, 'error_event_no_data');
				return;
			}
			delete loadedObject.events;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'event_reset');
		}
	},
	ready: async client => {
		for (const guild of client.guilds.cache.values()) {
			if (guild.me.permissions.has('MANAGE_GUILD')) {
				codes[guild.id] = {};
				for (const invite of (await guild.fetchInvites()).values())
					try {
						codes[invite.guild.id][invite.code] = {
							inviter: invite.inviter.id,
							uses: invite.uses
						};
					} catch { }
			}
			if (!guild.me.permissions.has('VIEW_AUDIT_LOG'))
				continue;
			const timestamp = new Date().getTime() - 20 * 60 * 1000;
			for (const entrie of (await guild.fetchAuditLogs({
				limit: 5,
				type: GuildAuditLogs.Actions.MESSAGE_DELETE
			})).entries.values())
				if (entrie.createdTimestamp > timestamp)
					logDeletedCount[entrie.executor.id] = entrie.extra.count;
		}
	},
	inviteCreate: invite => {
		if (!codes[invite.guild.id])
			codes[invite.guild.id] = {};
		try {
			codes[invite.guild.id][invite.code] = {
				inviter: invite.inviter.id,
				uses: invite.uses
			};
		} catch { }
	},
	inviteDelete: invite => {
		if (!codes[invite.guild.id])
			codes[invite.guild.id] = {};
		delete codes[invite.guild.id][invite.code];
	},
	guildMemberAdd: async member => {
		object = getObject(member.guild);
		if (!(object.events && object.events.guildmemberadd))
			return;
		let invite = {};
		if (codes[member.guild.id] && member.guild.me.permissions.has('MANAGE_GUILD')) {
			const invites = await member.guild.fetchInvites();
			for (const value of invites.values())
				if (codes[value.guild.id][value.code].uses < value.uses) {
					codes[value.guild.id][value.code].uses = value.uses;
					invite = codes[value.guild.id][value.code];
					break;
				}
		}
		const inviter = invite.inviter ? member.guild.members.cache.get(invite.inviter) : invite.inviter;
		const channel = member.guild.channels.cache.get(object.events.guildmemberadd.channel);
		if (!channel)
			return;
		const embed = new MessageEmbed();
		embed.setColor('0F9D58');
		let description = object.events.guildmemberadd.message;
		const settings = {
			displayName: member.displayName,
			tag: member.user.tag,
			member,
			inviter: inviter ? inviter : utils.getMessage(object.dictionary, 'event_message_unknown'),
			uses: invite.uses ? invite.uses : utils.getMessage(object.dictionary, 'event_message_unknown'),
			member_count: member.guild.memberCount
		};
		for (const key of Object.keys(settings))
			description = `${description}`.replace(new RegExp(`<${key}>`, 'g'), settings[key]);
		embed.setDescription(description);
		embed.setTimestamp();
		utils.sendEmbed(channel, object.dictionary, embed);
	},
	guildMemberRemove: member => {
		object = getObject(member.guild);
		if (!(object.events && object.events.guildmemberremove))
			return;
		const channel = member.guild.channels.cache.get(object.events.guildmemberremove.channel);
		if (!channel)
			return;
		const embed = new MessageEmbed();
		embed.setColor('DB4437');
		let description = object.events.guildmemberremove.message;
		const settings = {
			displayName: member.displayName,
			tag: member.user.tag,
			member,
			member_count: member.guild.memberCount
		};
		for (const key of Object.keys(settings))
			description = `${description}`.replace(new RegExp(`<${key}>`, 'g'), settings[key]);
		embed.setDescription(description);
		embed.setTimestamp();
		utils.sendEmbed(channel, object.dictionary, embed);
	},
	messageUpdate: (oldMessage, newMessage) => {
		if (newMessage.author.bot
			|| oldMessage.content == newMessage.content
			|| newMessage.channel.type == 'dm')
			return;
		object = getObject(newMessage.guild);
		if (!(object.events && object.events.messageupdate))
			return;
		const channel = newMessage.guild.channels.cache.get(object.events.messageupdate.channel);
		if (!channel)
			return;
		const embed = new MessageEmbed();
		embed.setColor('F4B400');
		let description = object.events.messageupdate.message;
		const settings = {
			displayName: newMessage.member.displayName,
			tag: newMessage.author.tag,
			member: newMessage.member,
			channel: newMessage.channel,
			oldcontent: oldMessage.content,
			newcontent: newMessage.content,
			link: newMessage.url
		};
		for (const key of Object.keys(settings))
			description = `${description}`.replace(new RegExp(`<${key}>`, 'g'), settings[key]);
		embed.setDescription(description);
		embed.setTimestamp();
		utils.sendEmbed(channel, object.dictionary, embed);
	},
	messageDelete: async message => {
		if (!(message.channel.type != 'dm' && message.member))
			return;
		let deleter;
		const timestamp = new Date().getTime() - 1000;
		if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
			const entries = (await message.guild.fetchAuditLogs({
				limit: 5,
				type: GuildAuditLogs.Actions.MESSAGE_DELETE
			})).entries;
			let entrie = entries.first();
			if (entrie.target.id == message.author.id
				&& entrie.createdTimestamp > timestamp)
				deleter = entrie.executor.id;
			else
				for (entrie of entries.values())
					if (entrie.target.id == message.author.id
						&& logDeletedCount[entrie.executor.id] < entrie.extra.count) {
						deleter = entrie.executor.id;
						break;
					}
			if (deleter)
				logDeletedCount[entrie.executor.id] = entrie.extra.count;
			else
				deleter = message.author.id;
			deleter = message.guild.members.cache.get(deleter);
		}
		object = getObject(message.guild);
		if (!(object.events && object.events.messagedelete))
			return;
		const channel = message.guild.channels.cache.get(object.events.messagedelete.channel);
		if (!channel)
			return;
		const embed = new MessageEmbed();
		embed.setColor('DB4437');
		let description = object.events.messagedelete.message;
		const settings = {
			displayName: message.member.displayName,
			tag: message.author.tag,
			member: message.member,
			channel: message.channel,
			content: message.content.length ? message.content : (message.embeds.length ? message.embeds[0].description : utils.getMessage(object.dictionary, 'event_message_unknown')),
			deleter: deleter ? deleter : utils.getMessage(object.dictionary, 'event_message_unknown')
		};
		for (const key of Object.keys(settings))
			description = `${description}`.replace(new RegExp(`<${key}>`, 'g'), settings[key]);
		embed.setDescription(description);
		embed.setTimestamp();
		utils.sendEmbed(channel, object.dictionary, embed);
	},
	voiceStateUpdate: (oldState, newState) => {
		if (oldState.channelID == newState.channelID)
			return;
		object = getObject(newState.guild);
		if (!object.events)
			return;
		let channel;
		let description;
		const settings = {
			displayName: newState.member.displayName,
			tag: newState.member.user.tag,
			member: newState.member
		};
		const embed = new MessageEmbed();
		if (!newState.channelID) {
			if (!object.events.voiceremove)
				return;
			channel = newState.guild.channels.cache.get(object.events.voiceremove.channel);
			description = object.events.voiceremove.message;
			Object.assign(settings, {
				channel: oldState.channel
			});
			embed.setColor('DB4437');
		} else if (!oldState.channelID) {
			if (!object.events.voiceadd)
				return;
			channel = newState.guild.channels.cache.get(object.events.voiceadd.channel);
			description = object.events.voiceadd.message;
			Object.assign(settings, {
				channel: newState.channel
			});
			embed.setColor('0F9D58');
		} else {
			if (!object.events.voiceupdate)
				return;
			channel = newState.guild.channels.cache.get(object.events.voiceupdate.channel);
			description = object.events.voiceupdate.message;
			Object.assign(settings, {
				oldchannel: oldState.channel,
				newchannel: newState.channel
			});
			embed.setColor('F4B400');
		}
		if (!channel)
			return;
		for (const key of Object.keys(settings))
			description = `${description}`.replace(new RegExp(`<${key}>`, 'g'), settings[key]);
		embed.setDescription(description);
		embed.setTimestamp();
		utils.sendEmbed(channel, object.dictionary, embed);
	}
};