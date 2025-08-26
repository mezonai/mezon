import { ID_MENTION_HERE, TIME_OFFSET, TypeMessage } from '@mezon/utils';
import { ChannelMessage, safeJSONParse } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import { listChannelsByUserActions } from '../channels/channelUser.slice';
import { channelMetaActions } from '../channels/channelmeta.slice';
import { channelsActions } from '../channels/channels.slice';
import { listChannelRenderAction } from '../channels/listChannelRender.slice';
import { selectMemberClanByUserId2 } from '../clanMembers/clan.members';
import { clansActions } from '../clans/clans.slice';
import { directActions } from '../direct/direct.slice';
import { directMetaActions } from '../direct/directmeta.slice';

export interface ResetBadgeParams {
	clanId: string;
	channelId: string;
	badgeCount?: number;
	timestamp?: number;
	messageId?: string;
}

const processedMessagesCache = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 60 * 1000;

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

export const resetChannelBadgeCount = (dispatch: any, params: ResetBadgeParams) => {
	const { clanId, channelId, badgeCount, timestamp, messageId } = params;

	cleanupOutdatedEntries();

	const id = channelId + messageId;

	if (messageId) {
		if (isMessageAlreadyProcessed(id)) {
			return;
		}
		if (badgeCount && badgeCount > 0) {
			processedMessagesCache.set(id, Date.now());
		}
	}

	const now = timestamp || Date.now() / 1000;

	if (clanId !== '0') {
		dispatch(listChannelRenderAction.removeBadgeFromChannel({ clanId, channelId }));
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
				timestamp: now + TIME_OFFSET
			})
		);
		dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
		dispatch(listChannelsByUserActions.updateLastSeenTime({ channelId }));
	} else {
		dispatch(directActions.removeBadgeDirect({ channelId }));
		dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: now }));
	}

	if (clanId !== '0' && badgeCount !== undefined && badgeCount > 0) {
		dispatch(clansActions.updateClanBadgeCount({ clanId, count: badgeCount * -1 }));
	}
};

export interface DecreaseChannelBadgeParams {
	message: ChannelMessage;
	userId: string;
	store: any;
}

const isMessageMentionOrReply = (msg: ChannelMessage, currentUserId: string, store: any): boolean => {
	const state = store?.getState?.();
	const currentClanUser = state ? selectMemberClanByUserId2(state, currentUserId) : undefined;

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
		const includesHere = mentions?.some((m) => m?.user_id === ID_MENTION_HERE) ?? false;
		const includesUser = mentions?.some((mention) => mention?.user_id === currentUserId) ?? false;
		const includesRole = mentions?.some((item) => (currentClanUser?.role_id as string | undefined)?.includes(item?.role_id as string)) ?? false;

		return includesHere || includesUser || includesRole;
	})();

	const isReply = msg.references?.some((ref) => ref.message_sender_id === currentUserId) ?? false;

	return hasMention || isReply;
};

export const decreaseChannelBadgeCount = (dispatch: any, params: DecreaseChannelBadgeParams) => {
	const { message, userId, store } = params;

	if (message?.code !== TypeMessage.ChatRemove || message.sender_id === userId) {
		return;
	}

	const messageTimestamp =
		message.update_time_seconds && message.update_time_seconds > 0 ? message.update_time_seconds : message.create_time_seconds || 0;

	// Handle direct messages (DM/Group)
	if (!message.clan_id || message.clan_id === '0') {
		const dmMeta = store.getState().directmeta?.entities?.[message.channel_id];
		if (dmMeta && messageTimestamp > dmMeta.lastSeenTimestamp && dmMeta.count_mess_unread > 0) {
			dispatch(directMetaActions.setCountMessUnread({ channelId: message.channel_id, count: -1 }));
		}
	} else {
		const channelMeta = store.getState().channelmeta?.entities?.[message.channel_id];
		const channel = store.getState().channels?.byClans?.[message.clan_id]?.entities?.entities?.[message.channel_id];
		const lastSeenTimestamp = channelMeta?.lastSeenTimestamp;

		if (
			channel &&
			lastSeenTimestamp &&
			messageTimestamp > lastSeenTimestamp &&
			(channel.count_mess_unread || 0) > 0 &&
			isMessageMentionOrReply(message, userId, store)
		) {
			dispatch(
				listChannelRenderAction.updateChannelUnreadCount({
					channelId: message.channel_id,
					clanId: message.clan_id,
					count: -1
				})
			);

			dispatch(
				channelsActions.updateChannelBadgeCount({
					clanId: message.clan_id,
					channelId: message.channel_id,
					count: -1
				})
			);

			dispatch(
				listChannelsByUserActions.updateChannelBadgeCount({
					channelId: message.channel_id,
					count: -1
				})
			);

			dispatch(
				clansActions.updateClanBadgeCount({
					clanId: message.clan_id,
					count: -1
				})
			);
		}
	}
};
