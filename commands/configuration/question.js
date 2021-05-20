

const MessageEmbed = require('discord.js').MessageEmbed;
const utils = require('../../utils.js');

const getObject = (guild) => {
	const object = utils.readFile(`guilds/${guild.id}.json`);
	if (!object.dictionary)
		object.dictionary = {};
	if (!object.dictionary.language)
		object.dictionary.language = guild.client._config.dictionary;
	if (!object.prefix)
		object.prefix = guild.client._config.prefix;
	const dictionary = JSON.parse(JSON.stringify(guild.client._dictionaries[object.dictionary.language]));
	if (object.dictionary.custom) {
		for (const key of Object.keys(object.dictionary.custom))
			dictionary[key] = object.dictionary.custom[key];
		object.dictionary.language += ' *(custom)*';
	}
	Object.assign(object, {
		language: object.dictionary.language,
		dictionary
	});
	return object;
};

module.exports = {
	name: 'question',
	aliases: [],
	description: 'Vérifiez quand un membre arrive.',
	privateMessage: false,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'question_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'question_help', {
				prefix: object.prefix
			});
			return;
		} else if (option == 'settings') {
			if (!object.question) {
				utils.sendMessage(message.channel, object.dictionary, 'error_question_no_data');
				return;
			}
			const embed = new MessageEmbed();
			embed.addField('Activate', object.question.activate ? object.question.activate : true);
			if (object.question.list && object.question.list.length) {
				let list = '';
				let index = 0;
				for (const question of object.question.list) {
					if (list.length)
						list += '\n';
					list += `${++index} - **${question}**`;
				}
				embed.addField('Questions', list);
			}
			utils.sendEmbed(message.channel, object.dictionary, embed);
		} else if (!['activate', 'add', 'remove', 'reset'].includes(option)) {
			let options = '';
			for (const option of ['help', 'activate', 'add', 'remove', 'settings', 'reset']) {
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
		if (!message.member.hasPermission('ADMINISTRATOR')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'ADMINISTRATOR'
			});
			return;
		}
		for (const permission of ['MANAGE_CHANNELS', 'SEND_MESSAGES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY'])
			if (!message.guild.me.hasPermission(permission)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
					permission
				});
				return;
			}
		const path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (option == 'activate') {
			if (object.args.length < 2
				|| !['true', 'false'].includes(object.args[1].toLowerCase())) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}question activate <true/false>`
				});
				return;
			}
			let bool = object.args[1].toLowerCase() == 'true';
			if (!loadedObject.question)
				loadedObject.question = {};
			loadedObject.question.activate = bool;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'question_activate', {
				bool
			});
		} else if (option == 'add') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}question add <question...>`
				});
				return;
			}
			let input = '';
			for (let index = 1; index < object.args.length; index++) {
				if (input.length)
					input += ' ';
				input += object.args[index];
			}
			if (!loadedObject.question)
				loadedObject.question = {};
			if (!loadedObject.question.list)
				loadedObject.question.list = [];
			loadedObject.question.list.push(input);
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'question_add', {
				question: input
			});
		} else if (option == 'remove') {
			if (object.args.length < 2) {
				utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
					format: `${object.prefix}question remove <number>`
				});
				return;
			}
			if (isNaN(object.args[1])) {
				utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
					arg: object.args[1]
				});
				return;
			}
			if (!loadedObject.question)
				loadedObject.question = {};
			if (!loadedObject.question.list)
				loadedObject.question.list = [];
			const number = parseInt(object.args[1]);
			if (number <= 0 || number > loadedObject.question.list.length) {
				utils.sendMessage(message.channel, object.dictionary, 'error_question_index_not_found', {
					index: number
				});
				return;
			}
			const question = loadedObject.question.list.splice(number - 1, 1)[0];
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'question_remove', {
				question
			});
		} else if (option == 'reset') {
			if (!loadedObject.question) {
				utils.sendMessage(message.channel, object.dictionary, 'error_question_no_data');
				return;
			}
			delete loadedObject.question;
			utils.savFile(path, loadedObject);
			utils.sendMessage(message.channel, object.dictionary, 'question_reset')
		}
	},
	guildMemberAdd: async member => {
		if (member.hasPermission('VIEW_CHANNEL'))
			return;
		for (const permission of ['MANAGE_CHANNELS', 'SEND_MESSAGES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY'])
			if (!member.guild.me.hasPermission(permission))
				return;
		const object = getObject(member.guild);
		if (!(object.question
			&& object.question.list
			&& object.question.list.length))
			return;
		if (!object.question.channels)
			object.question.channels = {};
		let category = member.guild.channels.cache.get(object.question.channels.question);
		if (!category) {
			category = await member.guild.channels.create('Questions', {
				type: 'category',
				reason: 'To ask questions.'
			});
			object.question.channels.question = category.id;
			utils.savFile(`guilds/${member.guild.id}.json`, object);
		}
		const channel = await member.guild.channels.create(member.user.username, {
			type: 'text',
			topic: utils.getMessage(object.dictionary, 'question_topic'),
			parent: category,
			permissionOverwrites: [
				{
					id: member.id,
					allow: [
						'VIEW_CHANNEL',
						'READ_MESSAGE_HISTORY',
						'SEND_MESSAGES'
					],
				},
				{
					id: member.client.user.id,
					allow: [
						'VIEW_CHANNEL',
						'MANAGE_CHANNELS',
						'MANAGE_ROLES',
						'SEND_MESSAGES',
						'EMBED_LINKS',
						'READ_MESSAGE_HISTORY'
					],
				},
				{
					id: member.guild.roles.everyone.id,
					deny: ['VIEW_CHANNEL'],
				},
			],
			reason: 'To ask questions.'
		});
		await utils.sendEmbed(channel, object.dictionary, utils.getCustomEmbed(object.question.list[0]));
		if (member.hasPermission('VIEW_CHANNEL')) {
			channel.delete();
			return;
		}
		const path = `members/${member.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.guilds)
			loadedMember.guilds = {};
		if (!loadedMember.guilds[member.guild.id])
			loadedMember.guilds[member.guild.id] = {};
		loadedMember.guilds[member.guild.id].question = channel.id;
		utils.savFile(path, loadedMember);
	},
	guildMemberRemove: member => {
		const path = `members/${member.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.guilds)
			loadedMember.guilds = {};
		if (!loadedMember.guilds[member.guild.id])
			loadedMember.guilds[member.guild.id] = {};
		const channel = member.guild.channels.cache.get(loadedMember.guilds[member.guild.id].question);
		if (!(channel && channel.permissionsFor(member.guild.me).has('MANAGE_CHANNELS')))
			return;
		channel.delete();
		delete loadedMember.guilds[member.guild.id].question;
		utils.savFile(path, loadedMember);
	},
	guildMemberUpdate: (oldMember, newMember) => {
		if (newMember.hasPermission('VIEW_CHANNEL'))
			module.exports.guildMemberRemove(newMember);
	},
	message_offline: async message => {
		if (message.author.bot
			|| message.channel.type == 'dm'
			|| !message.channel.permissionsFor(message.guild.me).has('MANAGE_CHANNELS'))
			return;
		let path = `members/${message.member.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.guilds)
			loadedMember.guilds = {};
		if (!loadedMember.guilds[message.guild.id])
			loadedMember.guilds[message.guild.id] = {};
		if (message.channel != loadedMember.guilds[message.guild.id].question)
			return;
		const count = message.channel.messages.cache.array().filter(item => item.author.id == message.author.id).length;
		path = `guilds/${message.guild.id}.json`;
		const loadedObject = utils.readFile(path);
		if (!loadedObject.question)
			loadedObject.question = {};
		if (!loadedObject.question.list)
			loadedObject.question.list = [];
		if (count > loadedObject.question.list.length)
			return;
		if (count == loadedObject.question.list.length) {
			if (!loadedObject.question.channels)
				loadedObject.question.channels = {};
			let category = message.guild.channels.cache.get(loadedObject.question.channels.answer);
			if (!category) {
				category = await message.guild.channels.create('Answers', {
					type: 'category',
					reason: 'To ask questions.'
				});
				loadedObject.question.channels.answer = category.id;
				utils.savFile(path, loadedObject);
			}
			message.channel.setParent(category, 'All questions have been answered.');
			for (const role of message.guild.roles.cache.values())
				if (role.permissions.has('MANAGE_ROLES'))
					message.channel.updateOverwrite(role, { VIEW_CHANNEL: true }, 'All questions have been answered.');
			return;
		}
		utils.sendEmbed(message.channel, getObject(message.guild).dictionary, utils.getCustomEmbed(loadedObject.question.list[count]));
	}
};