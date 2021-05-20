

const utils = require('../../utils.js');
const channels = [];

module.exports = {
	name: 'temporary',
	aliases: [],
	description: 'Choisissez le canal vocal qui peut créer un canal temporaire.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'temporary_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'temporary_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'list') {
			if (!object.temporary) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_less');
				return;
			}
			let list = '';
			for (const id of object.temporary) {
				const channel = message.guild.channels.cache.get(id);
				if (channel) {
					if (list.length)
						list += ', ';
					list += `${channel}`;
				}
			}
			if (!list.length) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_less');
				return;
			}
			utils.sendMessage(message.channel, object.dictionary, 'temporary_list', {
				list
			});
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
		if (!message.member.hasPermission('MANAGE_CHANNELS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'MANAGE_CHANNELS'
			});
			return;
		}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'add') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}temporary add <channelId>`
				});
				return;
			}
			for (const permission of ['CONNECT', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MUTE_MEMBERS', 'MOVE_MEMBERS'])
				if (!message.guild.me.hasPermission(permission)) {
					utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
						permission
					});
					return;
				}
			const channel = message.guild.channels.cache.get(object.args[1]);
			if (!channel) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_channel_not_found', {
					id: object.args[1]
				});
				return;
			}
			if (!loadedObject.temporary)
				loadedObject.temporary = [];
			if (loadedObject.temporary.includes(channel.id)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_include', {
					channel
				});
				return;
			}
			loadedObject.temporary.push(channel.id);
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'temporary_add', {
				channel
			});
		} else if (option == 'remove') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}temporary remove <channelId>`
				});
				return;
			}
			const channel = message.guild.channels.cache.get(object.args[1]);
			if (!channel) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_channel_not_found', {
					id: object.args[1]
				});
				return;
			}
			if (!loadedObject.temporary)
				loadedObject.temporary = [];
			if (!loadedObject.temporary.includes(channel.id)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_channel_not_listed', {
					channel
				});
				return;
			}
			loadedObject.temporary.splice(loadedObject.temporary.indexOf(5), 1);
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'temporary_remove', {
				channel
			});
		} else if (option == 'reset') {
			if (!loadedObject.temporary) {
				utils.sendMessage(message.channel, object.dictionary, 'error_temporary_undefined');
				return;
			}
			delete loadedObject.temporary;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'temporary_reset');
		}
	},
	voiceStateUpdate: async (oldState, newState) => {
		if (oldState.channelID) {
			const channel = oldState.guild.channels.cache.get(oldState.channelID);
			if (channel && channels.includes(channel.id)
				&& !Array.from(channel.members.keys()).length
				&& newState.guild.me.permissionsIn(channel).has('CONNECT'))
				channel.delete('Nobody on the temporary channel');
		}
		const path = `guilds/${newState.guild.id}.json`;
		const object = utils.readFile(path);
		if (!(object.temporary && object.temporary.includes(newState.channelID)))
			return;
		const channel = newState.guild.channels.cache.get(newState.channelID);
		const options = Object.assign({}, channel);
		options.parent = options.parentID;
		options.reason = 'Creating temporary channel';
		const member = newState.guild.members.cache.get(newState.id);
		for (const permission of ['CONNECT', 'MANAGE_CHANNELS', 'MUTE_MEMBERS', 'MOVE_MEMBERS'])
			if (!newState.guild.me.hasPermission(permission))
				return;
		const createdChannel = await newState.guild.channels.create(member.displayName, options);
		channels.push(createdChannel.id);
		await newState.setChannel(createdChannel, options.reason).catch(() => {
			createdChannel.delete('Nobody on the temporary channel');
			channels.splice(channels.indexOf(createdChannel.id), 1);
		});
		const permissions = {};
		for (const permission of ['MANAGE_CHANNELS', 'MUTE_MEMBERS', 'MOVE_MEMBERS'])
			permissions[permission] = true;
		createdChannel.updateOverwrite(member, permissions, options.reason);
		createdChannel.updateOverwrite(newState.guild.me, { CONNECT: true }, options.reason);
	},
	channelDelete: channel => {
		if (channel.type == 'voice'
			&& channels.includes(channel.id))
			channels.splice(channels.indexOf(channel.id), 1);
	},
	restart: async client => {
		for (const guild of client.guilds.cache.values())
			for (const channelId of channels) {
				const channel = guild.channels.cache.get(channelId);
				if (channel)
					await channel.delete('Restart');
			}
	}
};