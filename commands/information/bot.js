

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');
const package = require('../../package.json');
const config = require('../../config.json');

module.exports = {
	name: 'bot',
	aliases: [],
	description: 'Obtenez des informations sur le bot.',
	privateMessage: true,
	message: (message, object) => {
		const embed = new MessageEmbed();
		embed.setTitle('Bot');
		for (const key of Object.keys(package))
			if (typeof package[key] == 'string')
				embed.addField(key.charAt(0).toUpperCase() + key.slice(1), package[key]);
		if (package.dependencies) {
			let dependencies = '';
			for (const dependency of Object.keys(package.dependencies)) {
				if (dependencies.length)
					dependencies += ',\n';
				dependencies += `\`${dependency}: ${package.dependencies[dependency]}\``;
			}
			if (dependencies != '')
				embed.addField('Dependencies', dependencies);
		}
		if (config.owners) {
			let owners = '';
			for (const owner of Object.values(config.owners)) {
				const user = message.client.users.cache.get(owner);
				if (!user)
					continue;
				if (owners != '')
					owners += ',\n';
				owners += `\`${user.tag}\``;
			}
			if (owners != '')
				embed.addField('Owners', owners);
		}
		embed.addField('ReadyAt', message.client.readyAt.toUTCString());
		embed.addField('TotalShards', message.client.ws.totalShards);
		embed.addField('Guilds', Array.from(message.client.guilds.cache).length);
		embed.addField('VoiceConnections', Array.from(message.client.voice.connections).length);
		embed.addField('Channels', Array.from(message.client.channels.cache).length);
		embed.addField('Emojis', Array.from(message.client.emojis.cache).length);
		embed.addField('Users', Array.from(message.client.users.cache.filter(user => !user.bot)).length);
		embed.setThumbnail(message.client.user.displayAvatarURL({
			dynamic: true,
			size: 4096
		}));
		utils.sendEmbed(message.channel, object.dictionary, embed);
	}
};