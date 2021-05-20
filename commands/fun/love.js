
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

module.exports = {
	name: 'love',
	aliases: [],
	description: 'Donner le pourcentage d\'amour.',
	privateMessage: true,
	message: (message, object) => {
		const users = Array.from(message.mentions.users.values());
		if (!users.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}love <user1> [user2]`
			});
			return;
		}
		if (users.length == 1)
			users.push(message.author);
		if (users.length != 2) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}love <user> <user>`
			});
			return;
		}
		const percent = (utils.getUserScore(users[0]) + utils.getUserScore(users[1])) % 101;
		let maxBar = 30;
		let rate = maxBar * percent / 100;
		let bar = '';
		while (maxBar--)
			if (rate-- > 0)
				bar += '▣';
			else
				bar += '▢';
		utils.sendMessage(message.channel, object.dictionary, 'love_success', {
			user1: users[0],
			user2: users[1],
			percent,
			bar
		});
	}
};