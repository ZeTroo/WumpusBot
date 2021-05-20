

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

const emojis = ['👊', '✋', '✌️'];

module.exports = {
	name: 'rps',
	aliases: [],
	description: 'Pierre papier ciseaux.',
	privateMessage: true,
	message: async (message, object) => {
		if (message.channel.type != 'dm')
			for (const permission of ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'])
				if (!message.guild.me.hasPermission(permission)) {
					utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
						permission
					});
					return;
				}
		const reactionMessage = await utils.sendMessage(message.channel, object.dictionary, 'rps_reaction');
		for (const emoji of emojis)
			await reactionMessage.react(emoji);
		const reaction = (await reactionMessage.awaitReactions((reaction, user) => emojis.includes(reaction.emoji.name)
			&& user.id == message.author.id, {
			max: 1,
			time: 15000
		})).first();
		const select = emojis.indexOf(reaction.emoji.name);
		const bot = Math.floor(Math.random() * emojis.length);
		let score = select - bot;
		if (score < 0)
			score += emojis.length;
		const embed = new MessageEmbed();
		let description;
		if (!score)
			description = utils.getMessage(object.dictionary, 'rps_draw');
		else if (score == 1)
			description = utils.getMessage(object.dictionary, 'rps_won');
		else
			description = utils.getMessage(object.dictionary, 'rps_lost');
		embed.setDescription(`${description}\n${emojis[select]} - ${emojis[bot]}`);
		utils.replaceEmbed(reactionMessage, object.dictionary, embed);
	}
};