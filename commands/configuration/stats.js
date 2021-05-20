

const utils = require('../../utils.js');

module.exports = {
	name: 'stats',
	aliases: [],
	description: 'Faites des statistiques sur le serveur.',
	privateMessage: false,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'stats_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'stats_help', {
				prefix: object.prefix
			});
			return;
		} else if (!['set', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'set', 'reset']) {
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
		if (!message.guild.me.hasPermission('MANAGE_CHANNELS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
				permission: 'MANAGE_CHANNELS'
			});
			return;
		}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'set') {
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}stats set ${object.args.length == 2 ? object.args[1] : '<channelId>'} <name...>`
				});
				return;
			}
			const channel = message.guild.channels.cache.get(object.args[1]);
			if (!(channel && channel.permissionsFor(message.guild.me).has('VIEW_CHANNEL'))) {
				utils.sendMessage(message.channel, object.dictionary, 'error_stats_channel_not_found', {
					channel: object.args[1]
				})
				return;
			}
			let name = '';
			for (let index = 2; index < object.args.length; index++) {
				const word = object.args[index];
				if (name.length)
					name += ' ';
				name += word;
			}
			if (name.length > 100) {
				utils.sendMessage(message.channel, object.dictionary, 'error_stats_too_big');
				return;
			}
			let containe = false;
			for (const count of ['member', 'human', 'bot', 'online', 'online_human', 'online_bot', 'voice', 'voice_human', 'voice_bot'])
				if (name.includes(`<${count}>`)) {
					containe = true;
					break;
				}
			if (!containe) {
				let args = '';
				for (const count of ['member', 'human', 'bot', 'online', 'online_human', 'online_bot', 'voice', 'voice_human', 'voice_bot']) {
					if (args.length)
						args += ', ';
					args += `\`<${count}>\``;
				}
				utils.sendMessage(message.channel, object.dictionary, 'error_stats_no_count', {
					name,
					args
				});
				return;
			}
			channel.setName(name, 'Creation of statistics');
			if (!loadedObject.stats)
				loadedObject.stats = {};
			loadedObject.stats[channel.id] = name;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'stats_add', {
				channel,
				name
			});
		} else if (option == 'reset') {
			if (!loadedObject.stats) {
				utils.sendMessage(message.channel, object.dictionary, 'error_stats_not_define');
				return;
			}
			delete loadedObject.stats;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'stats_reset');
		}
	},
	timer: client => {
		for (const guild of client.guilds.cache.values()) {
			const path = `guilds/${guild.id}.json`;
			const loadedObject = utils.readFile(path);
			if (!loadedObject.stats)
				continue;
			const stats = {
				member: 0,
				human: 0,
				bot: 0,
				online: 0,
				online_human: 0,
				online_bot: 0,
				voice: 0,
				voice_human: 0,
				voice_bot: 0,
			};
			for (const member of guild.members.cache.values()) {
				if (member.deleted)
					continue;
				stats.member++;
				if (member.user.bot)
					stats.bot++;
				else
					stats.human++;
				if (member.presence.status != 'offline') {
					stats.online++;
					if (member.user.bot)
						stats.online_bot++;
					else
						stats.online_human++;
				}
				if (member.voice.channelID) {
					stats.voice++;
					if (member.user.bot)
						stats.voice_bot++;
					else
						stats.voice_human++;
				}
			}
			for (const id of Object.keys(loadedObject.stats)) {
				const channel = guild.channels.cache.get(id);
				if (!(channel && !channel.deleted)) {
					delete loadedObject.stats[id];
					utils.savFile(path, loadedObject);
					continue;
				}
				if (!channel.permissionsFor(guild.me).has('VIEW_CHANNEL'))
					continue;
				let newName = loadedObject.stats[id];
				for (const count of ['member', 'human', 'bot', 'online', 'online_human', 'online_bot', 'voice', 'voice_human', 'voice_bot'])
					if (newName.includes(`<${count}>`))
						newName = newName.replace(new RegExp(`<${count}>`, 'g'), stats[count]);
				if (channel.name != newName)
					channel.setName(newName, 'Updating statistics.');
			}
		}
	}
};