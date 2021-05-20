
const Client = require('discord.js').Client;
const utils = require('../../utils.js');

module.exports = {
	name: 'broadcast',
	aliases: '',
	description: 'Envoyez un message à autant de personnes que possible avec un bot en particulier',
	privateMessage: true,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'broadcast_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'broadcast_help', {
				prefix: object.prefix
			});
			return;
		} else if (!['dm', 'channel'].includes(option)) {
			let options = '';
			for (const option of ['help', 'dm', 'channel']) {
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
		if (object.args.length < 3) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}prefix ${option} ${object.args.length == 1 ? '<token>' : object.args[1]} <message...>`
			});
			return;
		}
		const token = object.args[1];
		let broadcastMessage = '';
		for (let index = 2; index < object.args.length; index++) {
			if (broadcastMessage.length)
				broadcastMessage += ' ';
			broadcastMessage += object.args[index];
		}
		const client = new Client({
			fetchAllMembers: true
		});
		client.on('ready', async () => {
			await utils.replaceMessage(sendedMessage, object.dictionary, 'broadcast_sending', {
				message: broadcastMessage
			});
			const guilds = {};
			const done = [];
			for (const guild of client.guilds.cache.values()) {
				let count = 0;
				if (option == 'dm') {
					for (const member of guild.members.cache.values())
						if (!done.includes(member.id)) {
							await member.send(broadcastMessage).then(() => count++).catch(() => { });
							done.push(member.id);
						}
				} else if (option == 'channel')
					for (const channel of guild.channels.cache.values())
						if (channel.type == 'text' && !done.includes(channel.id)) {
							await channel.send(broadcastMessage).then(() => count++).catch(() => { });
							done.push(channel.id);
						}
				if (count)
					guilds[guild.name] = count;
			}
			let servers = '';
			for (const guild of Object.keys(guilds)) {
				if (servers.length)
					servers += '\n';
				servers += `${guild} **(${guilds[guild]} messages sended)**`;
			}
			utils.replaceMessage(sendedMessage, object.dictionary, 'broadcast_success', {
				servers,
			});
			client.destroy();
		});
		const sendedMessage = await utils.sendMessage(message.channel, object.dictionary, 'broadcast_login', {
			token
		});
		client.login(token).catch(err => utils.replaceMessage(sendedMessage, object.dictionary, 'error_broadcast_cannot_login', {
			message: err.message
		}));
	}
};