import type { IChannel } from '@mezon/utils';
import { ID_MENTION_HERE, TIME_OFFSET, TypeMessage, debounce } from '@mezon/utils';
import type { ChannelMessage } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import type { ApiMessageMention } from 'mezon-js/types';
import { listChannelsByUserActions } from '../channels/channelUser.slice';
import { channelMetaActions } from '../channels/channelmeta.slice';
import { channelsActions } from '../channels/channels.slice';
import { listChannelRenderAction } from '../channels/listChannelRender.slice';
import { selectMemberClanByUserId } from '../clanMembers/clan.members';
import { clansActions } from '../clans/clans.slice';
import { directMetaActions } from '../direct/direct.slice';
import { selectLatestMessageId } from '../messages/messages.slice';
import type { AppDispatch, RootState, Store } from '../store';

export interface ResetBadgeParams {
	clanId: string;
	channelId: string;
	badgeCount?: number;
	timestamp?: number;
	messageId?: string;
}

const processedMessagesCache = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 60 * 1000;

const debouncedResets = new Map<string, ReturnType<typeof debounce>>();

const cleanupOutdatedEntries = () => {
	const now = Date.now();
	for (const [id, timestamp] of processedMessagesCache.entries()) {
		if (now - timestamp > CACHE_DURATION) {
			processedMessagesCache.delete(id);
		}
	}
};

const isMessageAlreadyProcessed = (id: string): boolean => {
	const now = Date.now();
	const lastProcessed = processedMessagesCache.get(id);

	if (lastProcessed && now - lastProcessed < CACHE_DURATION) {
		return true;
	}
	return false;
};

const getCurrentClanBadgeCount = (store: { getState?: () => RootState }, clanId: string): number => {
	try {
		const state = store?.getState?.();
		return state?.clans?.entities?.[clanId]?.badge_count ?? 0;
	} catch (error) {
		console.warn('Failed to get clan badge count:', error);
		return 0;
	}
};

export const getCurrentChannelBadgeCount = (store: { getState?: () => RootState }, clanId: string, channelId: string): number => {
	try {
		const state = store?.getState?.();
		const listChannelRender = state?.CHANNEL_LIST_RENDER?.listChannelRender?.[clanId];
		if (!listChannelRender) {
			return 0;
		}

		const channel = listChannelRender.find((ch) => ch.id === channelId) as IChannel;
		return channel?.count_mess_unread ?? 0;
	} catch (error) {
		console.warn('Failed to get channel badge count:', error);
		return 0;
	}
};

const performReset = (dispatch: AppDispatch, params: ResetBadgeParams, store?: { getState?: () => RootState }) => {
	const { clanId, channelId, timestamp, messageId, badgeCount } = params;
	if (!channelId) {
		return;
	}

	const id = channelId + messageId;

	if (clanId !== '0' && isMessageAlreadyProcessed(id)) {
		return;
	}

	if (clanId !== '0' && messageId) {
		cleanupOutdatedEntries();
		processedMessagesCache.set(id, Date.now());
	}

	const now = timestamp || Date.now() / 1000;
	const currentClanBadge = store ? getCurrentClanBadgeCount(store, clanId) : 0;

	if (clanId !== '0') {
		dispatch(
			channelsActions.updateChannelBadgeCount({
				clanId,
				channelId,
				count: 0,
				isReset: true
			})
		);
		dispatch(
			channelMetaActions.setChannelLastSeenTimestamp({
				channelId,
				timestamp: now + TIME_OFFSET,
				messageId
			})
		);
		dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
		dispatch(listChannelsByUserActions.updateLastSeenTime({ channelId }));

		if (badgeCount && badgeCount > 0) {
			const actualDecrement = Math.min(badgeCount, currentClanBadge);
			dispatch(
				clansActions.updateClanBadgeCount({
					clanId,
					count: actualDecrement > 0 ? actualDecrement * -1 : 0,
					isReset: actualDecrement <= 0
				})
			);
		}
		dispatch(listChannelRenderAction.removeBadgeFromChannel({ clanId, channelId }));
	} else {
		dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
		const messageId = store?.getState ? selectLatestMessageId(store.getState(), channelId) : undefined;
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: now, messageId }));
	}
};

export const resetChannelBadgeCount = (dispatch: AppDispatch, params: ResetBadgeParams, store?: { getState?: () => RootState }) => {
	const { clanId, channelId } = params;
	const key = `${clanId}-${channelId}`;

	if (!debouncedResets.has(key)) {
		const debouncedFunction = debounce(
			(dispatch: AppDispatch, params: ResetBadgeParams, store?: { getState?: () => RootState }) => {
				performReset(dispatch, params, store);
			},
			100,
			true,
			false
		);
		debouncedResets.set(key, debouncedFunction);
	}

	const debouncedFunction = debouncedResets.get(key);
	if (debouncedFunction) {
		debouncedFunction(dispatch, params, store);
	}
};

export interface DecreaseChannelBadgeParams {
	message: ChannelMessage;
	userId: string;
	store: Store;
}

const isMessageMentionOrReply = (msg: ChannelMessage, currentUserId: string, store: Store): boolean => {
	const state = store?.getState?.();
	const currentClanUser = state ? selectMemberClanByUserId(state, currentUserId) : undefined;

	const hasMention = (() => {
		if (!currentUserId) return false;

		// Normalize mentions to an array
		let mentions: ApiMessageMention[] | undefined;
		if (Array.isArray(msg?.mentions)) {
			mentions = msg.mentions as unknown as ApiMessageMention[];
		} else if (typeof msg?.mentions === 'string') {
			mentions = safeJSONParse(msg.mentions) as ApiMessageMention[] | undefined;
		}

		// Special @here mention
		const includesHere = mentions?.some((m) => m?.userId === ID_MENTION_HERE) ?? false;
		const includesUser = mentions?.some((mention) => mention?.userId === currentUserId) ?? false;
		const includesRole = mentions?.some((item) => (currentClanUser?.roleId as string | undefined)?.includes(item?.roleId as string)) ?? false;

		return includesHere || includesUser || includesRole;
	})();

	const isReply = msg.references?.some((ref) => ref.messageSenderId === currentUserId) ?? false;

	return hasMention || isReply;
};

export const decreaseChannelBadgeCount = (dispatch: AppDispatch, params: DecreaseChannelBadgeParams) => {
	const { message, userId, store } = params;

	if (!message || message?.code !== TypeMessage.ChatRemove || message.senderId === userId) {
		return;
	}

	const messageTimestamp =
		message.updateTimeSeconds && message.updateTimeSeconds > 0 ? message.updateTimeSeconds : message.createTimeSeconds || 0;

	// Handle direct messages (DM/Group)
	if (!message.clanId || message.clanId === '0') {
		const dmMeta = store.getState().direct?.entities?.[message.channelId];
		const lastSeenTimestamp = Number(dmMeta?.lastSeenMessage?.timestampSeconds ?? Number.NaN);
		if (
			dmMeta &&
			!Number.isNaN(lastSeenTimestamp) &&
			messageTimestamp > lastSeenTimestamp &&
			dmMeta.count_mess_unread !== undefined &&
			dmMeta.count_mess_unread > 0
		) {
			dispatch(directMetaActions.setCountMessUnread({ channelId: message.channelId, count: -1 }));
		}
	} else {
		const state = store.getState();
		const channelMeta = state.channelmeta?.entities?.[message.channelId];
		const channel = state.channels?.byClans?.[message.clanId]?.entities?.entities?.[message.channelId];
		const currentClanBadge = state.clans?.entities?.[message.clanId]?.badge_count ?? 0;
		const lastSeenTimestamp = channelMeta?.lastSeenTimestamp;

		const shouldDecrease =
			channel &&
			lastSeenTimestamp &&
			messageTimestamp > lastSeenTimestamp &&
			(channel.count_mess_unread || 0) > 0 &&
			isMessageMentionOrReply(message, userId, store);

		if (shouldDecrease) {
			const channelBadgeCount = channel.count_mess_unread || 0;
			if (channelBadgeCount > 0) {
				dispatch(
					listChannelRenderAction.updateChannelUnreadCount({
						channelId: message.channelId,
						clanId: message.clanId,
						count: -1
					})
				);

				dispatch(
					channelsActions.updateChannelBadgeCount({
						clanId: message.clanId,
						channelId: message.channelId,
						count: -1
					})
				);

				dispatch(
					listChannelsByUserActions.updateChannelBadgeCount({
						channelId: message.channelId,
						count: -1
					})
				);

				if (currentClanBadge > 0) {
					dispatch(
						clansActions.updateClanBadgeCount({
							clanId: message.clanId,
							count: -1
						})
					);
				}
			}
		}
	}
};
