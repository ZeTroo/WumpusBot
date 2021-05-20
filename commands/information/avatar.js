
const utils = require('../../utils.js');

module.exports = {
	name: 'avatar',
	aliases: ['pp'],
	description: 'Voir l\'avatar de quelqu\'un.',
	privateMessage: true,
	message: async (message, object) => {
		const users = [];
		for (const arg of object.args) {
			const user = await message.client.users.fetch(arg, false).catch(() => { });
			if (!user) {
				utils.sendMessage(message.channel, object.dictionary, 'error_avatar_user_not_found', {
					user: arg
				});
				continue;
			}
			users.push(user);
		}
		if (!users.length) {
			if (object.args.length)
				return;
			users.push(message.author);
		}
		for (const user of users) {
			const link = user.displayAvatarURL({
				dynamic: true,
				size: 4096
			});
			utils.sendEmbed(message.channel, object.dictionary, utils.getEmbed(object.dictionary, 'avatar_success', {
				link
			}).setImage(link));
		}
	}
};