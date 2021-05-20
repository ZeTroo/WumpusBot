
const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');
const stream = require('../../stream.js');

const nasa = {};
const NasaUrl = 'https://api.nasa.gov/planetary/apod?hd=true&api_key=';

module.exports = {
	name: 'nasa',
	aliases: [],
	description: 'Obtenez l\'image astronomique de la journée.',
	privateMessage: true,
	message: async (message, object) => {
		const date = new Date();
		date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
		const hour = date.getHours();
		if (hour != nasa.hour) {
			nasa.object = JSON.parse(await stream.promise(`${NasaUrl}${message.client._config.nasa}`));
			nasa.hour = hour;
		}
		let embed = new MessageEmbed();
		if (nasa.object.msg) {
			embed.setTitle(nasa.object.code);
			embed.setDescription(nasa.object.msg);
		} else {
			embed.setTitle(nasa.object.title);
			embed.setURL(nasa.object.url);
			embed.setDescription(nasa.object.explanation);
			if (nasa.object.copyright)
				embed.addField('Copyright', nasa.object.copyright);
			if (nasa.object.media_type == 'image')
				embed.setImage(nasa.object.url);
			else
				embed.setDescription(`${embed.description}\n\n[[${nasa.object.media_type}]](${nasa.object.url})`);
		}
		utils.sendEmbed(message.channel, object.dictionary, embed);
	}
};