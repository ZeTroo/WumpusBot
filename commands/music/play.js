

const url = require('url');
const utils = require('../../utils.js');
const YoutubeVideo = require('../../youtube-wrapper/index.js').Video;
const prism = require('prism-media');

const generateTranscoder = (url, { start = 0, duration = 0 } = {}, { bass = 0, treble = 0, speed = 1 } = {}) => {
	let args = [
		'-reconnect', '1',
		'-reconnect_streamed', '1',
		'-ss', start
	];
	if (duration)
		args = args.concat(['-to', duration]);
	//		'-af', `bass=g=${bass}, treble=g=${treble}, atempo=${speed}`,
	args = args.concat([
		'-i', url,
		'-f', 's16le',
		'-ar', '48000',
		'-ac', '2',
		'-af', `bass=g=${bass}, treble=g=${treble}`,
		'-c:v', 'libx264',
		'-preset', 'veryslow',
		'-crf', '0',
		'-movflags', '+faststart'
	]);
	const transcoder = new prism.FFmpeg({ args });
	transcoder._readableState.reading = true;
	transcoder._readableState.needReadable = true;
	return transcoder;
}
const trancodertoOpus = (trancoder, volume) => {
	const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 48 * 20 });
	const volumeTransformer = new prism.VolumeTransformer({ type: 's16le', volume });
	return trancoder.pipe(volumeTransformer).pipe(opus);
}
const start = async (client, guildId, music) => {
	client.music[guildId].current = music;
	if (music.expires - parseInt(music.lengthSeconds) <= Date.now()) {
		await music.fetch();
		if (music.status
			|| !(music.formats && music.formats.length)) {
			start(client, guildId, music);
			return;
		}
	}
	const format = music.formats.find(format => !format.qualityLabel && format.audioChannels);
	const transcoder = generateTranscoder(format.url, {
		start: music.time ? `${music.time}ms` : 0,
		duration: format.approxDurationMs ? `${format.approxDurationMs}ms` : 0
	}, client.music[guildId].boost);
	const opus = trancodertoOpus(transcoder, client.music[guildId].volume);
	const dispatcher = client.music[guildId].connection.player.createDispatcher({
		type: 'opus',
		fec: true,
		bitrate: 48,
		highWaterMark: 16
	}, { opus });
	opus.pipe(dispatcher);
	dispatcher.on('finish', async (reason) => {
		dispatcher.destroy();
		if (music.time)
			delete music.time;
		if (!Array.from(client.music[guildId].connection.channel.members.values()).filter(member => !member.user.bot).length) {
			client.music[guildId].connection.disconnect();
			return;
		}
		if (client.music[guildId].loop) {
			start(client, guildId, music);
			return;
		} else {
			if (client.music[guildId].loopqueue)
				client.music[guildId].playlist.push(music);
			else if (client.music[guildId].autoplay && !client.music[guildId].playlist.length && music.next) {
				const next = await new YoutubeVideo(music.next).fetch();
				if (!next.status
					&& !(music.liveBroadcastDetails && music.liveBroadcastDetails.isLiveNow)
					&& next.formats && next.formats.length) {
					next.request = 'AutoPlay';
					client.music[guildId].playlist.push(next);
				}
			}
		}
		if (client.music[guildId].playlist.length) {
			let index;
			if (client.music[guildId].random)
				index = Math.floor(Math.random() * client.music[guildId].playlist.length);
			else
				index = 0;
			const music = client.music[guildId].playlist[index];
			client.music[guildId].playlist.splice(index, 1);
			start(client, guildId, music);
		} else
			client.music[guildId].connection.disconnect();
	});
};

const play = async (member, client, channel, guild, dictionary, link, index = -2) => {
	if (!member.voice.channelID) {
		utils.sendMessage(channel, dictionary, 'error_play_no_voice');
		return;
	}
	if (guild.me.voice.channelID && member.voice.channelID != guild.me.voice.channelID) {
		utils.sendMessage(channel, dictionary, 'error_play_not_same_voice');
		return;
	}
	const sendedMessage = await utils.sendMessage(channel, dictionary, 'play_loading');
	const music = await new YoutubeVideo(link).fetch();
	if (music.status) {
		utils.replaceMessage(sendedMessage, dictionary, 'error_play_unplayable', {
			reason: music.reason
		});
		return;
	}
	if (music.liveBroadcastDetails && music.liveBroadcastDetails.isLiveNow) {
		utils.replaceMessage(sendedMessage, dictionary, 'error_play_live_not_supported');
		return;
	}
	if (!(music.formats && music.formats.length)) {
		utils.replaceMessage(sendedMessage, dictionary, 'error_play_no_stream');
		return;
	}
	if (!guild.me.voice.channelID) {
		const channel = await guild.channels.cache.get(member.voice.channelID);
		if (!channel.joinable) {
			utils.replaceMessage(sendedMessage, dictionary, 'error_play_cannot_join');
			return;
		}
		await utils.replaceMessage(sendedMessage, dictionary, 'play_joining');
		await channel.join();
	}
	if (!client.music)
		client.music = {};
	if (!client.music[guild.id])
		client.music[guild.id] = {};
	if (!client.music[guild.id].playlist)
		client.music[guild.id].playlist = [];
	music.request = member.user;
	const parsed = url.parse(link, true);
	if (parsed.query.t)
		music.time = parsed.query.t * 1000;
	let key;
	const object = {
		title: music.title,
		url: music.url,
		channel: music.ownerChannelName,
		channelUrl: music.ownerProfileUrl
	};
	if (!client.music[guild.id].connection || index == -1) {
		if (!client.music[guild.id].connection) {
			const connection = guild.me.voice.connection;
			connection.on('disconnect', () => delete client.music[guild.id]);
			client.music[guild.id].connection = connection;
		}
		await start(client, guild.id, music);
		key = 'play_success';
	} else {
		if (index == -2)
			index = client.music[guild.id].playlist.length;
		client.music[guild.id].playlist.splice(index, 0, music);
		object.index = index + 1;
		key = 'play_queue';
	}
	const embed = utils.getEmbed(dictionary, key, object);
	embed.setThumbnail(music.thumbnail.thumbnails[0].url);
	utils.replaceEmbed(sendedMessage, dictionary, embed);
}

module.exports = {
	name: 'play',
	aliases: ['p'],
	description: 'Jouer de la musique.',
	privateMessage: false,
	message: async (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}play <url>`
			});
			return;
		}
		play(message.member, message.client, message.channel, message.guild, object.dictionary, object.args[0]);
	},
	play,
	start
};