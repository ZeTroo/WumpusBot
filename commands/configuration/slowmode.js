
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

const cooldown = {};
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
	name: 'slowmode',
	aliases: [],
	description: 'Définissez le mode lent avec un message personnalisé.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'slowmode_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'slowmode_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'list') {
			if (!object.slowmode) {
				utils.sendMessage(message.channel, object.dictionary, 'error_slowmode_no_settings');
				return;
			}
			const embed = new MessageEmbed();
			embed.setTitle('SlowMode List');
			for (const id of Object.keys(object.slowmode)) {
				const channel = message.guild.channels.cache.get(id);
				if (channel)
					embed.addField(channel.name, `**Cooldown (milliseconds)**: ${object.slowmode[id].cooldown}\n**Message**: ${object.slowmode[id].message}`);
			}
			utils.sendEmbed(message.channel, object.dictionary, embed);
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
		if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
				permission: 'MANAGE_MESSAGES'
			});
			return;
		}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'add') {
			if (object.args.length < 5) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}slowmode set <channelId> <number> <unit> <message...>`
				});
				return;
			}
			const channel = message.guild.channels.cache.get(object.args[1]);
			if (!channel) {
				utils.sendMessage(message.channel, object.dictionary, 'error_slowmode_channel_not_found', {
					channelId: object.args[1]
				});
				return;
			}
			if (isNaN(object.args[2])) {
				utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
					arg: object.args[2]
				});
			}
			const number = parseInt(object.args[2]);
			if (number <= 0) {
				utils.sendMessage(message.channel, object.dictionary, 'error_slowmode_number_too_small');
				return;
			}
			const unit = object.args[3].toLowerCase();
			if (!['second', 'minute', 'hour', 'day'].includes(unit)) {
				let options = '';
				for (const option of ['second', 'minute', 'hour', 'day']) {
					if (options.length)
						options += ', ';
					options += `\`${option}\``;
				}
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_option', {
					option: object.args[3],
					options
				});
				return;
			}
			let message1 = '';
			for (let index = 4; index < object.args.length; index++) {
				if (message1.length)
					message1 += ' ';
				message1 += object.args[index];
			}
			let cooldown = number;
			switch (unit) {
				case 'day':
					cooldown *= 24;
				case 'hour':
					cooldown *= 60;
				case 'minute':
					cooldown *= 60;
				case 'second':
					cooldown *= 1000;
			}
			if (!loadedObject.slowmode)
				loadedObject.slowmode = {};
			loadedObject.slowmode[channel.id] = {
				cooldown,
				message: message1
			};
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'slowmode_set', {
				channel,
				number,
				unit,
				message: message1
			});
		} else if (option == 'remove') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}slowmode remove <channelId>`
				});
				return;
			}
			if (!loadedObject.slowmode[object.args[1]]) {
				utils.sendMessage(message.channel, object.dictionary, 'error_slowmode_channel_not_found', {
					channelId: object.args[1]
				});
				return;
			}
			delete loadedObject.slowmode[object.args[1]];
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'slowmode_remove', {
				channel: message.guild.channels.cache.get(object.args[1])
			});
		} else if (option == 'reset') {
			if (!loadedObject.slowmode) {
				utils.sendMessage(message.channel, object.dictionary, 'error_slowmode_no_settings');
				return;
			}
			delete loadedObject.slowmode;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'slowmode_reset');
		}
	},
	message_offline: message => {
		if (message.author.bot
			|| message.channel.type == 'dm'
			|| !message.guild.me.hasPermission('MANAGE_MESSAGES'))
			return;
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (!(loadedObject.slowmode && loadedObject.slowmode[message.channel.id]))
			return;
		if (!cooldown[message.channel.id])
			cooldown[message.channel.id] = {};
		const cooldownTimestamp = cooldown[message.channel.id][message.author.id];
		const currentTimestamp = new Date().getTime();
		if (cooldownTimestamp && cooldownTimestamp > currentTimestamp) {
			const embed = new MessageEmbed();
			embed.setDescription(loadedObject.slowmode[message.channel.id].message);
			utils.sendEmbed(message.channel, getDictionary(message.guild), embed);
			message.delete({ reason: 'SlowMode' });
			return;
		}
		cooldown[message.channel.id][message.author.id] = currentTimestamp + loadedObject.slowmode[message.channel.id].cooldown;
	}
};