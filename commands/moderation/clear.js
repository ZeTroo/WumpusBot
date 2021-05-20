
const utils = require('../../utils.js');
const pending = [];

module.exports = {
	name: 'clear',
	aliases: ['wipe', 'clean', 'bulk'],
	description: 'Supprimer les messages d\'une chaîne.',
	privateMessage: false,
	message: async (message, object) => {
		if (pending.includes(message.channel.id)) {
			message.delete();
			return;
		}
		if (!message.channel.permissionsFor(message.member).has('MANAGE_MESSAGES')) {
			utils.sendMessage(message.channel, object.dictionary, 'error_no_permission', {
				permission: 'MANAGE_MESSAGES'
			});
			return;
		}
		for (const permission of ['MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
			if (!message.guild.me.hasPermission(permission)) {
				utils.sendMessage(message.channel, object.dictionary, 'error_bot_no_permission', {
					permission
				});
				return;
			}
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}clear <number>`
			});
			return;
		}
		if (isNaN(object.args[0])) {
			utils.sendMessage(message.channel, object.dictionary, 'error_isnana', {
				arg: object.args[0]
			});
			return;
		}
		const numberMax = parseInt(object.args[0]);
		if (numberMax <= 0) {
			utils.sendMessage(message.channel, object.dictionary, 'error_clear_number_too_small');
			return;
		}
		let bulkLength;
		let deleted = 0;
		let number = numberMax;
		const now = Date.now();
		const index = pending.length;
		pending.push(message.channel.id);
		do {
			const fetched = (await message.channel.messages.fetch({
				limit: number < 100 ? number : 100
			}, false)).filter(message => message.createdTimestamp <= now);
			bulkLength = Array.from((await message.channel.bulkDelete(fetched, true)).values()).length;
			deleted += bulkLength;
			number -= bulkLength;
		}
		while (bulkLength && number);
		pending.splice(index, 1);
		utils.sendMessage(message.channel, object.dictionary, 'clear_success', {
			count: deleted
		});
	}
};