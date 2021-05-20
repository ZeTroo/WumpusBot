

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'dictionary',
	aliases: [],
	description: 'Consultez le dictionnaire, changez-le ou modifiez-le.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'dictionary_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'dictionary_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'display') {
			utils.sendMessage(message.channel, object.dictionary, 'dictionary_display', {
				dictionary: object.language
			});
			return;
		} else if (option == 'list') {
			let dictionaries = '';
			for (const dictionary of Object.keys(message.client._dictionaries)) {
				if (dictionaries.length)
					dictionaries += ', ';
				dictionaries += `\`${dictionary}\``;
			}
			utils.sendMessage(message.channel, object.dictionary, 'dictionary_list', {
				dictionaries
			});
			return;
		} else if (option == 'get') {
			const lines = [];
			for (const key of Object.keys(object.dictionary))
				lines.push(`**${key}**:\n\`${object.dictionary[key].replace(new RegExp('`', 'g'), '\'')}\`\n`);
			const messages = utils.remakeList(lines);
			for (const description of messages) {
				const embed = new MessageEmbed();
				embed.setTitle(object.language);
				embed.setDescription(description);
				utils.sendEmbed(message.channel, object.dictionary, embed);
			}
			return;
		} else if (!['set', 'edit', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'display', 'list', 'set', 'edit', 'reset']) {
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
					format: `${object.prefix}dictionary set <language>`
				});
				return;
			}
			const newLanguage = object.args[1].toLowerCase();
			for (const language of Object.keys(message.client._dictionaries))
				if (newLanguage == language.toLowerCase()) {
					if (!loadedObject.dictionary)
						loadedObject.dictionary = {};
					loadedObject.dictionary.language = language;
					utils.savFile(path, loadedObject);
					utils.sendMessage(message.channel, object.dictionary, 'dictionary_change', {
						dictionary: loadedObject.dictionary.language
					});
					return;
				}
			utils.sendMessage(message.channel, object.dictionary, 'error_dictionary_language_unavailable', {
				language: object.args[1]
			});
		} else if (option == 'edit') {
			if (object.args.length < 3) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}dictionary edit ${option} ${object.args.length == 1 ? '<key>' : object.args[1]} <value>`
				});
				return;
			}
			const key = object.args[1].toLowerCase();
			for (const key1 of Object.keys(object.dictionary))
				if (key == key1.toLowerCase()) {
					if (!loadedObject.dictionary)
						loadedObject.dictionary = {};
					if (!loadedObject.dictionary.custom)
						loadedObject.dictionary.custom = {};
					let value = '';
					for (let index = 2; index < object.args.length; index++) {
						if (value.length)
							value += ' ';
						value += object.args[index];
					}
					loadedObject.dictionary.custom[key1] = value;
					utils.savFile(path, loadedObject);
					utils.sendMessage(message.channel, object.dictionary, 'dictionary_edit', {
						key: key1,
						value
					});
					return;
				}
			utils.sendMessage(message.channel, object.dictionary, 'error_dictionary_key_unavailable', {
				key: object.args[1]
			});
		} else if (option == 'reset') {
			if (!loadedObject.dictionary) {
				utils.sendMessage(message.channel, object.dictionary, 'error_dictionary_no_custom');
				return;
			}
			delete loadedObject.dictionary;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'dictionary_reset');
		}
	}
};