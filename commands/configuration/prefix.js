

const utils = require('../../utils.js');

module.exports = {
	name: 'prefix',
	aliases: [],
	description: 'Obtenez le préfixe ou modifiez-le.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'prefix_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'prefix_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'get') {
			utils.sendMessage(message.channel, object.dictionary, 'prefix_display', {
				prefix: object.prefix
			});
			return;
		} else if (!['set', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'set', 'get', 'reset']) {
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
		let path;
		if (message.channel.type == 'dm')
			path = `members/${message.author.id}.json`;
		else {
			if (!message.member.hasPermission('ADMINISTRATOR')) {
				utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
					permission: 'ADMINISTRATOR'
				});
				return;
			}
			path = `guilds/${message.guild.id}.json`;
		}
		const loadedObject = utils.readFile(path);
		if (option == 'set') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}prefix set <prefix...>`
				});
				return;
			}
			let prefix = '';
			for (let index = 1; index < object.args.length; index++) {
				const arg = object.args[index];
				if (prefix.length)
					prefix += ' ';
				prefix += arg;
			}
			loadedObject.prefix = prefix;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'prefix_changed', {
				prefix: loadedObject.prefix
			});
		} else if (option == 'reset') {
			if (!loadedObject.prefix) {
				utils.sendMessage(message.channel, object.dictionary, 'error_prefix_nothing');
				return;
			}
			delete loadedObject.prefix;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'prefix_reset');
		}
	}
};