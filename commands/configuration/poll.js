

const utils = require('../../utils.js');

module.exports = {
	name: 'poll',
	aliases: [],
	description: 'Faites des réactions automatiques dans un canal.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'poll_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'poll_help', {
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
		if (!message.guild.me.hasPermission('ADD_REACTIONS')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
				permission: 'ADD_REACTIONS'
			});
			return;
		}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'set') {
			const channel = object.args.length < 2 ? message.channel : message.guild.channels.cache.get(object.args[1]);
			if (!channel) {
				utils.sendMessage(message.channel, object.dictionary, 'error_poll_channel_not_found', {
					'channelId': message.args[1]
				});
				return;
			}
			loadedObject.poll = channel.id;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'poll_set', {
				channel
			});
		} else if (option == 'reset') {
			if (!loadedObject.poll) {
				utils.sendMessage(message.channel, object.dictionary, 'error_poll_no_settings');
				return;
			}
			delete loadedObject.poll;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'poll_reset');
		}
	},
	message_offline: async message => {
		if (message.channel.type == 'dm'
			|| !message.guild.me.hasPermission('ADD_REACTIONS'))
			return;
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (!(message.channel.id == loadedObject.poll))
			return;
		for (let emoji of message.content.split(' ').filter(item => item.length)) {
			if (emoji.includes(':') && emoji.includes('>'))
				emoji = emoji.slice(emoji.lastIndexOf(':') + 1, emoji.lastIndexOf('>'));
			await message.react(emoji).catch(() => { });
		}
		if (Array.from(message.reactions.cache.keys()).length)
			return;
		if (message.guild.me.hasPermission('USE_EXTERNAL_EMOJIS')) {
			message.react(message.client.emojis.cache.get('776115959101390868')).catch(() => { });
			message.react(message.client.emojis.cache.get('776116035353837578')).catch(() => { });
			return;
		}
		message.react(':tesla_yes:').catch(() => { });
		message.react(':tesla_no2:').catch(() => { });
	}
};