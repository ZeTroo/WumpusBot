
const utils = require(`../../utils.js`);

module.exports = {
	name: 'history',
	aliases: [],
	description: 'Afficher un historique sur un utilisateur.',
	privateMessage: true,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'history_help', {
				prefix: object.prefix
			});
			return;
		}
		const option = object.args[0].toLowerCase();
		if (option == 'help') {
			utils.sendMessage(message.channel, object.dictionary, 'history_help', {
				prefix: object.prefix
			});
			return;
		}
		if (!['username', 'status'].includes(option)) {
			let options = '';
			for (const option of ['help', 'username', 'status']) {
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
		if (object.args.length < 2) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}history ${option} <userId>`
			});
			return;
		}
		const path = `members/${object.args[1]}.json`;
		const loadedMember = utils.readFile(path);
		const user = await message.client.users.fetch(object.args[1], false).catch(() => { });
		if (!user) {
			utils.sendMessage(message.channel, object.dictionary, 'error_history_user_not_found', {
				user: object.args[1]
			});
			return;
		}
		if (!loadedMember.history)
			loadedMember.history = {};
		if (!loadedMember.history[option]) {
			utils.sendMessage(message.channel, object.dictionary, 'error_history_no_data');
			return;
		}
		const lines = [];
		for (const log of loadedMember.history[option])
			lines.push(`- ${log}`);
		const messages = utils.remakeList(lines, 2048 - object.dictionary.history_success.length);
		for (const logs of messages) {
			const embed = utils.getEmbed(object.dictionary, 'history_success', {
				type: option,
				logs
			});
			embed.setAuthor(user.username, user.displayAvatarURL({
				dynamic: true,
				size: 4096
			}));
			utils.sendEmbed(message.channel, object.dictionary, embed);
		}
	},
	userUpdate: (oldUser, newUser) => {
		const username = newUser.username;
		const path = `members/${newUser.id}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.history)
			loadedMember.history = {};
		if (!loadedMember.history.username)
			loadedMember.history.username = [];
		if (loadedMember.history.username.length
			&& loadedMember.history.username[loadedMember.history.username.length - 1] == username)
			return;
		loadedMember.history.username.push(username);
		utils.savFile(path, loadedMember);
	},
	presenceUpdate: (oldPresence, newPresence) => {
		let state = newPresence.activities.filter(activity => activity.type == 'CUSTOM_STATUS');
		if (!state.length)
			return;
		state = state[0].state;
		if (!state)
			return;
		const path = `members/${newPresence.userID}.json`;
		const loadedMember = utils.readFile(path);
		if (!loadedMember.history)
			loadedMember.history = {};
		if (!loadedMember.history.status)
			loadedMember.history.status = [];
		if (loadedMember.history.status.length
			&& loadedMember.history.status[loadedMember.history.status.length - 1] == state)
			return;
		loadedMember.history.status.push(state);
		utils.savFile(path, loadedMember);
	}
};