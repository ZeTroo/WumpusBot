

const fs = require('fs');
const MessageEmbed = require('discord.js').MessageEmbed;
const config = require('./config.json');

const loadedFiles = {};

module.exports = {
	savFile: (path, object) => {
		if (!object)
			throw "object undefined"
		if (path.lastIndexOf('/') + 1 && !fs.existsSync(path))
			fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), {
				recursive: true
			});
		fs.writeFileSync(path, JSON.stringify(object));
		loadedFiles[path] = object;
		return object;
	},
	readFile: path => {
		if (loadedFiles[path])
			return JSON.parse(JSON.stringify(loadedFiles[path]));
		if (fs.existsSync(path)) {
			const parsed = JSON.parse(fs.readFileSync(path));
			loadedFiles[path] = parsed;
			return JSON.parse(JSON.stringify(parsed));
		}
		return {};
	},
	deleteFile: path => {
		if (!fs.statSync(path).isDirectory()) {
			fs.unlinkSync(path);
			return;
		}
		for (const filename of fs.readdirSync(path))
			module.exports.deleteFile(`${path}/${filename}`);
		fs.rmdirSync(path);
	},
	getMessage: (dictionary, key, object = {}) => {
		let message = dictionary[key];
		if (!message) {
			message = dictionary.error_dictionary_not_found;
			object = { key };
		}
		for (const objectKey of Object.keys(object))
			message = `${message}`.replace(new RegExp(`<${objectKey}>`, 'g'), object[objectKey]);
		return message;
	},
	getCustomEmbed: (description) => {
		const embed = new MessageEmbed();
		if (description)
			embed.setDescription(description);
		embed.setColor(config.embed.color);
		embed.setFooter(config.embed.footer);
		return embed;
	},
	getEmbed: (dictionary, key, object) => {
		return module.exports.getCustomEmbed(module.exports.getMessage(dictionary, key, object));
	},
	sendEmbed: (channel, dictionary, embed) => {
		if (embed.description && embed.description.length > 2048)
			return module.exports.sendMessage(channel, dictionary, 'error_message_too_big');
		if (channel.type != 'dm') {
			const permissions = channel.permissionsFor(channel.guild.me);
			if (!permissions.has('SEND_MESSAGES'))
				return;
			if (!permissions.has('EMBED_LINKS'))
				return channel.send(module.exports.getMessage(dictionary, 'error_no_embed_permission'));
		}
		if (!embed.color)
			embed.setColor(config.embed.color);
		embed.setFooter(config.embed.footer);
		return channel.send(embed);
	},
	sendMessage: (channel, dictionary, key, object) => {
		return module.exports.sendEmbed(channel, dictionary, module.exports.getEmbed(dictionary, key, object));
	},
	replaceEmbed: async (message, dictionary, embed) => {
		if (embed.description && embed.description.length > 2048)
			return module.exports.replaceEmbed(message, dictionary, 'error_message_too_big');
		if (message.channel.type != 'dm'
			&& !message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS'))
			return channel.send(module.exports.getMessage(dictionary, 'error_no_embed_permission'));
		if (!embed.color)
			embed.setColor(config.embed.color);
		embed.setFooter(config.embed.footer);
		try {
			if (message.channel.type != 'dm'
				&& message.channel.permissionsFor(message.guild.me).has('MANAGE_MESSAGES'))
				await message.reactions.removeAll();
			return await message.edit(embed);
		} catch (err) {
			console.error(err);
			return module.exports.sendEmbed(message.channel, dictionary, embed);
		}
	},
	replaceMessage: (message, dictionary, key, object) => {
		return module.exports.replaceEmbed(message, dictionary, module.exports.getEmbed(dictionary, key, object));
	},
	remakeList: (array, maxChar = 2048) => {
		if (array.length == 0 || maxChar <= 0)
			return array;
		const newArray = [];
		let currentItem = '';
		for (const item of array) {
			if ((currentItem.length ? currentItem.length + 1 : currentItem.length) + item.length >= maxChar) {
				newArray.push(currentItem);
				currentItem = '';
			}
			if (currentItem != '')
				currentItem += '\n';
			currentItem += item;
		}
		newArray.push(currentItem);
		return newArray;
	},
	getUserScore(user) {
		if (user.user)
			user = user.user;
		return parseInt(user.discriminator) + parseInt(user.id) + user.createdTimestamp;
	},
	getStringScore(string) {
		let score = 0;
		for (let index = 0; index < string.length; index++)
			score += string.charCodeAt(index);
		return score;
	}
};