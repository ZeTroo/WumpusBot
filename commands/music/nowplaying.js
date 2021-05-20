

const utils = require('../../utils.js');

const millistoString = millis => {
	millis -= millis % 1000;
	millis /= 1000;
	let seconde = millis % 60;
	const minute = (millis - seconde) / 60;
	if (seconde < 10)
		seconde = `0${seconde}`;
	return `${minute}:${seconde}`;
};

module.exports = {
	name: 'nowplaying',
	aliases: ['np'],
	description: 'Obtenez des informations sur la musique actuelle.',
	privateMessage: false,
	message: (message, object) => {
		if (!(message.client.music && message.client.music[message.guild.id])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_nowplaying_no_data');
			return;
		}
		const current = message.client.music[message.guild.id].current;
		let time = (current.time ? current.time : 0) + message.client.music[message.guild.id].connection.dispatcher.streamTime;
		let maxBar = 25;
		let rate = maxBar * time / current.formats[0].approxDurationMs;
		let bar = '';
		while (maxBar--)
			if (rate-- > 0)
				bar += '▣';
			else
				bar += '▢';
		const embed = utils.getCustomEmbed();
		embed.setImage(current.thumbnail.thumbnails[0].url);
		embed.addField('Title', `[${current.title}](${current.url})`);
		embed.addField('Channel', `[${current.ownerChannelName}](${current.ownerProfileUrl})`);
		embed.addField('Time', `${millistoString(time)}/${millistoString(current.formats[0].approxDurationMs)}\n${bar}`);
		embed.addField('ViewCount', current.viewCount);
		embed.addField('Category', current.category);
		embed.addField('PublishDate', current.publishDate);
		embed.addField('UploadDate', current.uploadDate);
		utils.sendEmbed(message.channel, object.dictionary, embed);
	}
};