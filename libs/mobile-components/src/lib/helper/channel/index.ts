// eslint-disable-next-line @nx/enforce-module-boundaries
import { channelsActions, clansActions, getStoreAsync } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '../../constant';
import { load, remove, save } from '../storage';

type ClanChannelPair = {
	clanId: string;
	channelId: string;
};

export function getUpdateOrAddClanChannelCache(clanId: string, channelId: string) {
	const data = load(STORAGE_DATA_CLAN_CHANNEL_CACHE) || [];
	const result = [...data];
	const pairIndex = data.findIndex((pair: ClanChannelPair) => pair.clanId === clanId);

	if (pairIndex !== -1) {
		// If a pair with the given clanId is found, update its channelId
		result[pairIndex].channelId = channelId;
	} else {
		// If no pair is found, add a new one
		result.push({ clanId, channelId });
	}

	return result;
}

export function getInfoChannelByClanId(data: ClanChannelPair[], clanId: string) {
	const pairIndex = data.findIndex((pair: ClanChannelPair) => pair.clanId === clanId);
	return pairIndex !== -1 ? data[pairIndex] : null;
}

export const setCurrentClanLoader = async (clans: any, clan_id?: string, autoJoinChannel = true) => {
	const lastClanId = clan_id ? clan_id : clans?.[clans?.length - 1]?.clan_id;
	const store = await getStoreAsync();
	if (lastClanId) {
		save(STORAGE_CLAN_ID, lastClanId);
		await store.dispatch(clansActions.joinClan({ clanId: lastClanId }));
		await store.dispatch(clansActions.changeCurrentClan({ clanId: lastClanId }));
		if (autoJoinChannel) {
			const respChannel = await store.dispatch(channelsActions.fetchChannels({ clanId: lastClanId, noCache: true }));
			await setDefaultChannelLoader(respChannel.payload, lastClanId);
		}
	}
	return null;
};

export const setDefaultChannelLoader = async (dataChannel: any, clanId: string, dataSave?: any) => {
	if (dataSave) {
		const infoChannelCache = getInfoChannelByClanId(dataSave || [], clanId);
		if (infoChannelCache?.channelId && infoChannelCache?.clanId) {
			await jumpToChannel(infoChannelCache.channelId, infoChannelCache.clanId);
		}
		return;
	}
	const data = load(STORAGE_DATA_CLAN_CHANNEL_CACHE);
	const infoChannelCache = getInfoChannelByClanId(data || [], clanId);
	if (infoChannelCache?.channelId && infoChannelCache?.clanId) {
		await jumpToChannel(infoChannelCache.channelId, infoChannelCache.clanId);
	} else {
		const data = dataChannel?.channels || dataChannel || [];
		const dataChannelSort = data?.sort?.((a: any, b: any) => {
			if (a.category_name && b.category_name) {
				return a.category_name.localeCompare(b.category_name);
			}
			return 0;
		});
		const firstChannelText = dataChannelSort?.find?.(
			(channel: { type: ChannelType; parrent_id: string }) => channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && channel?.parrent_id === '0'
		);
		if (firstChannelText) {
			const firstChannelId = firstChannelText?.channel_id;
			const firstClanId = firstChannelText?.clan_id;
			if (firstChannelId && firstClanId) {
				const dataSave = getUpdateOrAddClanChannelCache(firstClanId, firstChannelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
				await jumpToChannel(firstChannelId, firstClanId);
			}
		}
	}
};

export const jumpToChannel = async (channelId: string, clanId: string) => {
	if (channelId && clanId) {
		const store = await getStoreAsync();
		// const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
		// if (!channelsCache?.includes(channelId)) {
		// 	save(STORAGE_CHANNEL_CURRENT_CACHE, [...channelsCache, channelId]);
		// }
		store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false, isClearMessage: true }));
	}
};

export const hasNonEmptyChannels = (data: any) => {
	return data.some((item: any) => item?.channels && item?.channels?.length > 0);
};

export const cleanChannelData = (channels: any[]) => {
	return channels.map((channel) => {
		return {
			...channel,
			last_sent_message: undefined,
			last_seen_message: undefined,
			threads: channel.threads.map((thread: any) => {
				return {
					...thread,
					last_sent_message: undefined,
					last_seen_message: undefined
				};
			})
		};
	});
};

export const changeClan = async (clanId: string) => {
	const store = await getStoreAsync();
	await remove(STORAGE_CHANNEL_CURRENT_CACHE);
	save(STORAGE_CLAN_ID, clanId);
	const promises = [];
	promises.push(store.dispatch(clansActions.joinClan({ clanId: clanId })));
	promises.push(store.dispatch(clansActions.changeCurrentClan({ clanId: clanId })));
	promises.push(store.dispatch(channelsActions.fetchChannels({ clanId: clanId, noCache: true })));
	const results = await Promise.all(promises);
	const channelResp = results.find((result) => result.type === 'channels/fetchChannels/fulfilled');
	if (channelResp) {
		await setDefaultChannelLoader(channelResp.payload, clanId);
	}
};
