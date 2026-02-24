import type { IChannel } from '@mezon/utils';
import { ID_MENTION_HERE, TypeMessage } from '@mezon/utils';
import type { ChannelMessage } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import type { ApiMessageMention } from 'mezon-js/api.gen';
import { Subject, merge, type Subscription } from 'rxjs';
import { bufferTime, distinctUntilChanged, filter, groupBy, map, mergeMap } from 'rxjs/operators';
import { listChannelsByUserActions } from '../channels/channelUser.slice';
import { channelMetaActions } from '../channels/channelmeta.slice';
import { channelsActions } from '../channels/channels.slice';
import { listChannelRenderAction } from '../channels/listChannelRender.slice';
import { selectMemberClanByUserId } from '../clanMembers/clan.members';
import { clansActions } from '../clans/clans.slice';
import { directMetaActions } from '../direct/direct.slice';
import { selectLatestMessageId } from '../messages/messages.slice';
import type { AppDispatch, RootState } from '../store';

import { EMarkAsReadType } from '../channels/listChannelRender.slice';

type ChannelResetEvent = {
	type: 'CHANNEL_RESET';
	clanId: string;
	channelId: string;
	badgeCount?: number;
	timestamp?: number;
	messageId?: string;
};

type TopicResetEvent = {
	type: 'TOPIC_RESET';
	clanId: string;
	channelId: string;
	badgeCount?: number;
	timestamp?: number;
	messageId?: string;
};

type ChannelIncrementEvent = {
	type: 'CHANNEL_INCREMENT';
	clanId: string;
	channelId: string;
	count: number;
	createdAt: number;
};

type ChannelDecrementEvent = {
	type: 'CHANNEL_DECREMENT';
	clanId: string;
	channelId: string;
	count: number;
};

type DmResetEvent = {
	type: 'DM_RESET';
	channelId: string;
	timestamp?: number;
	messageId?: string;
};

type DmIncrementEvent = {
	type: 'DM_INCREMENT';
	channelId: string;
	count: number;
	isMention?: boolean;
};

type ClanSyncEvent = {
	type: 'CLAN_SYNC';
	clanId: string;
};

type MarkAsReadClanEvent = {
	type: 'MARK_AS_READ_CLAN';
	clanId: string;
	channelIds: string[];
	channelUpdates: Array<{ channelId: string; messageId?: string }>;
};

type MarkAsReadCategoryEvent = {
	type: 'MARK_AS_READ_CATEGORY';
	clanId: string;
	categoryId: string;
	channelIds: string[];
	channelUpdates: Array<{ channelId: string; messageId?: string }>;
};

type MarkAsReadChannelEvent = {
	type: 'MARK_AS_READ_CHANNEL';
	clanId: string;
	channelId: string;
	channelIds: string[];
	channelUpdates: Array<{ channelId: string; messageId?: string }>;
	channels: Array<{ channelId: string; count: number }>;
};

type BadgeEvent =
	| ChannelResetEvent
	| TopicResetEvent
	| ChannelIncrementEvent
	| ChannelDecrementEvent
	| DmResetEvent
	| DmIncrementEvent
	| ClanSyncEvent
	| MarkAsReadClanEvent
	| MarkAsReadCategoryEvent
	| MarkAsReadChannelEvent;

const DEDUP_WINDOW = 3000;
const BATCH_INTERVAL = 50;
const MAX_CACHE_SIZE = 500;

class BadgeService {
	private events$ = new Subject<BadgeEvent>();
	private subscription: Subscription | null = null;
	private dispatch: AppDispatch | null = null;
	private getState: (() => RootState) | null = null;
	private processedResets = new Map<string, number>();
	private lastResetAt = new Map<string, number>();
	private processedBadgeMessageIds = new Set<string>();
	private topicBadgesByParent = new Map<string, number>();
	private topicParentMap = new Map<string, { clanId: string; parentChannelId: string }>();
	private isInitialized = false;

	init(dispatch: AppDispatch, getState: () => RootState) {
		if (this.isInitialized) {
			this.destroy();
		}
		this.dispatch = dispatch;
		this.getState = getState;
		this.isInitialized = true;
		this.setupPipelines();
	}

	destroy() {
		this.subscription?.unsubscribe();
		this.subscription = null;
		this.processedResets.clear();
		this.lastResetAt.clear();
		this.processedBadgeMessageIds.clear();
		this.topicBadgesByParent.clear();
		this.topicParentMap.clear();
		this.isInitialized = false;
		this.dispatch = null;
		this.getState = null;
	}

	onReconnect() {
		this.processedResets.clear();
		this.lastResetAt.clear();
		this.processedBadgeMessageIds.clear();
		this.topicBadgesByParent.clear();
		this.topicParentMap.clear();
	}

	resetChannel(params: { clanId: string; channelId: string; badgeCount?: number; timestamp?: number; messageId?: string; isTopic?: boolean }) {
		this.lastResetAt.set(params.channelId, Date.now());
		const { isTopic, ...rest } = params;
		if (isTopic) {
			this.events$.next({ type: 'TOPIC_RESET', ...rest });
		} else {
			this.events$.next({ type: 'CHANNEL_RESET', ...rest });
		}
	}

	incrementChannel(clanId: string, channelId: string, count = 1) {
		this.events$.next({ type: 'CHANNEL_INCREMENT', clanId, channelId, count, createdAt: Date.now() });
	}

	incrementChannelIfMentioned(message: ChannelMessage, currentUserId: string): boolean {
		const state = this.getState?.();
		if (!state || !message.clan_id || !message.message_id) return false;

		const badgeKey = `${message.channel_id}_${message.message_id}`;
		if (this.processedBadgeMessageIds.has(badgeKey)) {
			return false;
		}

		if (this.isMessageMentionOrReply(state, message, currentUserId)) {
			this.processedBadgeMessageIds.add(badgeKey);
			this.cleanupProcessedMessageIds();
			this.incrementChannel(message.clan_id, message.channel_id, 1);
			return true;
		}
		return false;
	}

	incrementChannelForTopic(clanId: string, parentChannelId: string, topicId: string, messageId?: string) {
		if (messageId) {
			const badgeKey = `${parentChannelId}_${messageId}`;
			if (this.processedBadgeMessageIds.has(badgeKey)) {
				return;
			}
			this.processedBadgeMessageIds.add(badgeKey);
			this.cleanupProcessedMessageIds();
		}

		this.topicParentMap.set(topicId, { clanId, parentChannelId });
		const current = this.topicBadgesByParent.get(parentChannelId) ?? 0;
		this.topicBadgesByParent.set(parentChannelId, current + 1);

		if (this.dispatch) {
			this.dispatch(channelsActions.updateChannelBadgeCount({ clanId, channelId: parentChannelId, count: 1 }));
			this.dispatch(listChannelRenderAction.updateChannelUnreadCount({ channelId: parentChannelId, clanId, count: 1 }));
			this.dispatch(listChannelsByUserActions.updateChannelBadgeCount({ channelId: parentChannelId, count: 1 }));
		}
	}

	incrementChannelFromNotification(clanId: string, channelId: string, messageId?: string) {
		const badgeKey = messageId ? `${channelId}_${messageId}` : '';
		if (badgeKey && this.processedBadgeMessageIds.has(badgeKey)) {
			return;
		}
		if (badgeKey) {
			this.processedBadgeMessageIds.add(badgeKey);
			this.cleanupProcessedMessageIds();
		}
		this.incrementChannel(clanId, channelId, 1);
	}

	incrementChannelFromNotificationForTopic(clanId: string, parentChannelId: string, topicId: string, messageId?: string) {
		const badgeKey = messageId ? `${parentChannelId}_${messageId}` : '';
		if (badgeKey && this.processedBadgeMessageIds.has(badgeKey)) {
			return;
		}
		if (badgeKey) {
			this.processedBadgeMessageIds.add(badgeKey);
			this.cleanupProcessedMessageIds();
		}
		this.incrementChannelForTopic(clanId, parentChannelId, topicId);
	}

	decrementChannel(clanId: string, channelId: string, count = 1) {
		this.events$.next({ type: 'CHANNEL_DECREMENT', clanId, channelId, count });
	}

	resetDm(channelId: string, timestamp?: number, messageId?: string) {
		this.events$.next({ type: 'DM_RESET', channelId, timestamp, messageId });
	}

	incrementDm(channelId: string, count = 1, isMention = false) {
		this.events$.next({ type: 'DM_INCREMENT', channelId, count, isMention });
	}

	markAsReadClan(clanId: string, channelIds: string[], channelUpdates: Array<{ channelId: string; messageId?: string }>) {
		const now = Date.now();
		for (const id of channelIds) this.lastResetAt.set(id, now);
		this.events$.next({ type: 'MARK_AS_READ_CLAN', clanId, channelIds, channelUpdates });
	}

	markAsReadCategory(clanId: string, categoryId: string, channelIds: string[], channelUpdates: Array<{ channelId: string; messageId?: string }>) {
		const now = Date.now();
		for (const id of channelIds) this.lastResetAt.set(id, now);
		this.events$.next({ type: 'MARK_AS_READ_CATEGORY', clanId, categoryId, channelIds, channelUpdates });
	}

	markAsReadChannel(
		clanId: string,
		channelId: string,
		channelIds: string[],
		channelUpdates: Array<{ channelId: string; messageId?: string }>,
		channels: Array<{ channelId: string; count: number }>
	) {
		const now = Date.now();
		for (const id of channelIds) this.lastResetAt.set(id, now);
		this.events$.next({ type: 'MARK_AS_READ_CHANNEL', clanId, channelId, channelIds, channelUpdates, channels });
	}

	syncClanBadge(clanId: string) {
		this.events$.next({ type: 'CLAN_SYNC', clanId });
	}

	handleMessageDeleted(message: ChannelMessage, userId: string) {
		if (!message || message?.code !== TypeMessage.ChatRemove || message.sender_id === userId) {
			return;
		}
		const state = this.getState?.();
		if (!state) return;

		const messageTimestamp =
			message.update_time_seconds && message.update_time_seconds > 0 ? message.update_time_seconds : message.create_time_seconds || 0;

		if (!message.clan_id || message.clan_id === '0') {
			this.handleDmMessageDeleted(state, message, messageTimestamp);
		} else {
			this.handleChannelMessageDeleted(state, message, messageTimestamp, userId);
		}
	}

	private setupPipelines() {
		const channelResets$ = this.events$.pipe(
			filter((e): e is ChannelResetEvent => e.type === 'CHANNEL_RESET'),
			groupBy((e) => e.channelId),
			mergeMap((group$) => group$.pipe(distinctUntilChanged((prev, curr) => this.isDuplicateReset(prev, curr))))
		);

		const topicResets$ = this.events$.pipe(
			filter((e): e is TopicResetEvent => e.type === 'TOPIC_RESET'),
			groupBy((e) => e.channelId),
			mergeMap((group$) => group$.pipe(distinctUntilChanged((prev, curr) => this.isDuplicateTopicReset(prev, curr))))
		);

		const channelIncrements$ = this.events$.pipe(
			filter((e): e is ChannelIncrementEvent => e.type === 'CHANNEL_INCREMENT'),
			bufferTime(BATCH_INTERVAL),
			filter((batch) => batch.length > 0),
			map((batch) => this.aggregateIncrements(batch))
		);

		const channelDecrements$ = this.events$.pipe(filter((e): e is ChannelDecrementEvent => e.type === 'CHANNEL_DECREMENT'));

		const dmResets$ = this.events$.pipe(filter((e): e is DmResetEvent => e.type === 'DM_RESET'));

		const dmIncrements$ = this.events$.pipe(filter((e): e is DmIncrementEvent => e.type === 'DM_INCREMENT'));

		const clanSyncs$ = this.events$.pipe(
			filter((e): e is ClanSyncEvent => e.type === 'CLAN_SYNC'),
			groupBy((e) => e.clanId),
			mergeMap((group$) =>
				group$.pipe(
					bufferTime(500),
					filter((batch) => batch.length > 0),
					map((batch) => batch[batch.length - 1])
				)
			)
		);

		const markAsReadEvents$ = this.events$.pipe(
			filter(
				(e): e is MarkAsReadClanEvent | MarkAsReadCategoryEvent | MarkAsReadChannelEvent =>
					e.type === 'MARK_AS_READ_CLAN' || e.type === 'MARK_AS_READ_CATEGORY' || e.type === 'MARK_AS_READ_CHANNEL'
			)
		);

		this.subscription = merge(
			channelResets$.pipe(map((e) => () => this.executeChannelReset(e))),
			topicResets$.pipe(map((e) => () => this.executeTopicReset(e))),
			channelIncrements$.pipe(map((aggregated) => () => this.executeChannelIncrements(aggregated))),
			channelDecrements$.pipe(map((e) => () => this.executeChannelDecrement(e))),
			dmResets$.pipe(map((e) => () => this.executeDmReset(e))),
			dmIncrements$.pipe(map((e) => () => this.executeDmIncrement(e))),
			clanSyncs$.pipe(map((e) => () => this.executeClanSync(e.clanId))),
			markAsReadEvents$.pipe(map((e) => () => this.executeMarkAsRead(e)))
		).subscribe((execute) => {
			try {
				execute();
			} catch (error) {
				console.error('[BadgeService] Error processing event:', error);
			}
		});
	}

	private executeChannelReset(event: ChannelResetEvent) {
		const dispatch = this.dispatch;
		const state = this.getState?.();
		if (!dispatch || !state) return;

		const { clanId, channelId, messageId, timestamp } = event;
		const now = timestamp || Date.now() / 1000;
		const currentChannelBadge = this.getChannelBadgeCount(state, clanId, channelId);
		const currentClanBadge = state.clans?.entities?.[clanId]?.badge_count ?? 0;
		const topicBadgeCount = this.topicBadgesByParent.get(channelId) ?? 0;

		if (topicBadgeCount > 0) {
			const ownBadge = Math.max(0, currentChannelBadge - topicBadgeCount);
			if (ownBadge > 0) {
				dispatch(channelsActions.updateChannelBadgeCount({ clanId, channelId, count: -ownBadge }));
				dispatch(listChannelRenderAction.updateChannelUnreadCount({ channelId, clanId, count: -ownBadge }));
				dispatch(listChannelsByUserActions.updateChannelBadgeCount({ channelId, count: -ownBadge }));
				if (currentClanBadge > 0) {
					const actualDecrement = Math.min(ownBadge, currentClanBadge);
					dispatch(clansActions.updateClanBadgeCount({ clanId, count: -actualDecrement }));
				}
			}
		} else {
			const effectiveBadgeCount = currentChannelBadge || event.badgeCount || 0;

			dispatch(channelsActions.updateChannelBadgeCount({ clanId, channelId, count: 0, isReset: true }));
			dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
			dispatch(listChannelRenderAction.removeBadgeFromChannel({ clanId, channelId }));

			if (effectiveBadgeCount > 0 && currentClanBadge > 0) {
				const actualDecrement = Math.min(effectiveBadgeCount, currentClanBadge);
				const isFullReset = actualDecrement >= currentClanBadge;
				dispatch(clansActions.updateClanBadgeCount({ clanId, count: -actualDecrement, isReset: isFullReset }));
			}
		}

		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp: now, messageId }));
		dispatch(listChannelsByUserActions.updateLastSeenTime({ channelId }));
		this.markResetProcessed(channelId, messageId);
	}

	private executeTopicReset(event: TopicResetEvent) {
		const dispatch = this.dispatch;
		const state = this.getState?.();
		if (!dispatch || !state) return;

		const { clanId, channelId: topicId, messageId, timestamp } = event;
		const now = timestamp || Date.now() / 1000;

		const topicParent = this.topicParentMap.get(topicId);
		if (topicParent) {
			const { clanId: parentClanId, parentChannelId } = topicParent;
			const parentTopicBadge = this.topicBadgesByParent.get(parentChannelId) ?? 0;
			if (parentTopicBadge > 0) {
				const decrement = parentTopicBadge;
				this.topicBadgesByParent.set(parentChannelId, parentTopicBadge - decrement);
				dispatch(channelsActions.updateChannelBadgeCount({ clanId: parentClanId, channelId: parentChannelId, count: -decrement }));
				dispatch(listChannelRenderAction.updateChannelUnreadCount({ channelId: parentChannelId, clanId: parentClanId, count: -decrement }));
				dispatch(listChannelsByUserActions.updateChannelBadgeCount({ channelId: parentChannelId, count: -decrement }));
				dispatch(clansActions.updateClanBadgeCount({ clanId, count: -parentTopicBadge, isReset: false }));
			}
			this.topicParentMap.delete(topicId);
		}

		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: topicId, timestamp: now, messageId }));
		dispatch(listChannelsByUserActions.updateLastSeenTime({ channelId: topicId }));
		this.markResetProcessed(topicId, messageId);
	}

	private executeChannelIncrements(aggregated: Map<string, { clanId: string; channelId: string; totalCount: number }>) {
		const dispatch = this.dispatch;
		if (!dispatch) return;

		for (const [, { clanId, channelId, totalCount }] of aggregated) {
			if (totalCount <= 0) continue;
			dispatch(channelsActions.updateChannelBadgeCount({ clanId, channelId, count: totalCount }));
			dispatch(listChannelRenderAction.updateChannelUnreadCount({ channelId, clanId, count: totalCount }));
			dispatch(listChannelsByUserActions.updateChannelBadgeCount({ channelId, count: totalCount }));
			dispatch(clansActions.updateClanBadgeCount({ clanId, count: totalCount }));
		}
	}

	private executeChannelDecrement(event: ChannelDecrementEvent) {
		const dispatch = this.dispatch;
		const state = this.getState?.();
		if (!dispatch || !state) return;

		const { clanId, channelId, count } = event;
		const currentClanBadge = state.clans?.entities?.[clanId]?.badge_count ?? 0;

		dispatch(listChannelRenderAction.updateChannelUnreadCount({ channelId, clanId, count: -count }));
		dispatch(channelsActions.updateChannelBadgeCount({ clanId, channelId, count: -count }));
		dispatch(listChannelsByUserActions.updateChannelBadgeCount({ channelId, count: -count }));
		if (currentClanBadge > 0) {
			dispatch(clansActions.updateClanBadgeCount({ clanId, count: -count }));
		}
	}

	private executeDmReset(event: DmResetEvent) {
		const dispatch = this.dispatch;
		const state = this.getState?.();
		if (!dispatch || !state) return;

		const { channelId, timestamp } = event;
		const now = timestamp || Date.now() / 1000;

		dispatch(listChannelsByUserActions.resetBadgeCount({ channelId }));
		const latestMessageId = selectLatestMessageId(state, channelId);
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: now, messageId: event.messageId || latestMessageId }));
	}

	private executeDmIncrement(event: DmIncrementEvent) {
		const dispatch = this.dispatch;
		if (!dispatch) return;
		dispatch(directMetaActions.setCountMessUnread({ channelId: event.channelId, count: event.count, isMention: event.isMention }));
	}

	private executeMarkAsRead(event: MarkAsReadClanEvent | MarkAsReadCategoryEvent | MarkAsReadChannelEvent) {
		const dispatch = this.dispatch;
		if (!dispatch) return;

		let categoryBadgeTotal = 0;
		if (event.type === 'MARK_AS_READ_CATEGORY') {
			categoryBadgeTotal = this.sumChannelBadges(event.clanId, event.channelIds);
		}

		dispatch(channelMetaActions.setChannelsLastSeenTimestamp(event.channelUpdates));
		dispatch(channelsActions.resetChannelsCount({ clanId: event.clanId, channelIds: event.channelIds }));
		dispatch(listChannelsByUserActions.markAsReadChannel(event.channelIds));

		switch (event.type) {
			case 'MARK_AS_READ_CLAN':
				dispatch(clansActions.updateClanBadgeCount({ clanId: event.clanId, count: 0, isReset: true }));
				dispatch(listChannelRenderAction.handleMarkAsReadListRender({ type: EMarkAsReadType.CLAN, clanId: event.clanId }));
				break;

			case 'MARK_AS_READ_CATEGORY': {
				if (categoryBadgeTotal > 0) {
					const currentClanBadge = this.getState?.()?.clans?.entities?.[event.clanId]?.badge_count ?? 0;
					const decrement = Math.min(categoryBadgeTotal, currentClanBadge);
					dispatch(clansActions.updateClanBadgeCount({ clanId: event.clanId, count: -decrement, isReset: decrement >= currentClanBadge }));
				}
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CATEGORY,
						clanId: event.clanId,
						categoryId: event.categoryId
					})
				);
				break;
			}

			case 'MARK_AS_READ_CHANNEL':
				dispatch(clansActions.updateClanBadgeCountFromChannels({ clanId: event.clanId, channels: event.channels }));
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CHANNEL,
						clanId: event.clanId,
						channelId: event.channelId
					})
				);
				break;
		}
	}

	private executeClanSync(clanId: string) {
		const state = this.getState?.();
		const dispatch = this.dispatch;
		if (!state || !dispatch) return;

		const channelEntities = state.channels?.byClans?.[clanId]?.entities?.entities;
		if (!channelEntities) return;

		const totalChannelBadge = Object.values(channelEntities).reduce((sum, ch) => sum + (ch?.count_mess_unread ?? 0), 0);
		const currentClanBadge = state.clans?.entities?.[clanId]?.badge_count ?? 0;

		if (totalChannelBadge !== currentClanBadge) {
			dispatch(clansActions.setClanBadgeCount({ clanId, badgeCount: totalChannelBadge }));
		}
	}

	private isDuplicateReset(prev: ChannelResetEvent, curr: ChannelResetEvent): boolean {
		const state = this.getState?.();
		if (!state) return false;

		const currentBadge = this.getChannelBadgeCount(state, curr.clanId, curr.channelId);

		if (currentBadge > 0) return false;

		const key = curr.channelId + (curr.messageId || '');
		const lastProcessed = this.processedResets.get(key);

		if (!lastProcessed) return false;

		return Date.now() - lastProcessed < DEDUP_WINDOW;
	}

	private isDuplicateTopicReset(prev: TopicResetEvent, curr: TopicResetEvent): boolean {
		const state = this.getState?.();
		if (!state) return false;

		const currentBadge = this.getChannelBadgeCount(state, curr.clanId, curr.channelId);
		if (currentBadge > 0) return false;

		const key = `topic_${curr.channelId}${curr.messageId || ''}`;
		const lastProcessed = this.processedResets.get(key);
		if (!lastProcessed) return false;

		return Date.now() - lastProcessed < DEDUP_WINDOW;
	}

	private markResetProcessed(channelId: string, messageId?: string) {
		const key = channelId + (messageId || '');

		this.processedResets.set(key, Date.now());

		if (this.processedResets.size > MAX_CACHE_SIZE) {
			const entries = Array.from(this.processedResets.entries());
			entries.sort((a, b) => a[1] - b[1]);
			const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE / 2);
			for (const [k] of toRemove) {
				this.processedResets.delete(k);
			}
		}
	}

	private cleanupProcessedMessageIds() {
		if (this.processedBadgeMessageIds.size > MAX_CACHE_SIZE) {
			const iterator = this.processedBadgeMessageIds.values();
			const removeCount = this.processedBadgeMessageIds.size - MAX_CACHE_SIZE / 2;
			for (let i = 0; i < removeCount; i++) {
				const val = iterator.next().value;
				if (val) this.processedBadgeMessageIds.delete(val);
			}
		}
	}

	private aggregateIncrements(batch: ChannelIncrementEvent[]): Map<string, { clanId: string; channelId: string; totalCount: number }> {
		const aggregated = new Map<string, { clanId: string; channelId: string; totalCount: number }>();
		for (const event of batch) {
			const resetTime = this.lastResetAt.get(event.channelId);
			if (resetTime && event.createdAt < resetTime) {
				continue;
			}
			const key = `${event.clanId}-${event.channelId}`;
			const existing = aggregated.get(key);
			if (existing) {
				existing.totalCount += event.count;
			} else {
				aggregated.set(key, { clanId: event.clanId, channelId: event.channelId, totalCount: event.count });
			}
		}
		return aggregated;
	}

	private getChannelBadgeCount(state: RootState, clanId: string, channelId: string): number {
		const listChannelRender = state?.CHANNEL_LIST_RENDER?.listChannelRender?.[clanId];
		if (listChannelRender) {
			const channel = listChannelRender.find((ch) => ch.id === channelId) as IChannel;
			if (channel) return channel?.count_mess_unread ?? 0;
		}
		return state?.channels?.byClans?.[clanId]?.entities?.entities?.[channelId]?.count_mess_unread ?? 0;
	}

	private sumChannelBadges(clanId: string, channelIds: string[]): number {
		const state = this.getState?.();
		if (!state) return 0;
		const channelEntities = state.channels?.byClans?.[clanId]?.entities?.entities;
		if (!channelEntities) return 0;
		return channelIds.reduce((sum, id) => {
			const entity = channelEntities[id];
			return sum + (entity?.count_mess_unread ?? 0);
		}, 0);
	}

	private handleDmMessageDeleted(state: RootState, message: ChannelMessage, messageTimestamp: number) {
		const dmMeta = state.direct?.entities?.[message.channel_id];
		const lastSeenTimestamp = Number(dmMeta?.last_seen_message?.timestamp_seconds ?? Number.NaN);
		if (
			dmMeta &&
			!Number.isNaN(lastSeenTimestamp) &&
			messageTimestamp > lastSeenTimestamp &&
			dmMeta.count_mess_unread !== undefined &&
			dmMeta.count_mess_unread > 0
		) {
			this.dispatch?.(directMetaActions.setCountMessUnread({ channelId: message.channel_id, count: -1 }));
		}
	}

	private handleChannelMessageDeleted(state: RootState, message: ChannelMessage, messageTimestamp: number, userId: string) {
		const channelMeta = state.channelmeta?.entities?.[message.channel_id];
		const clanId = message.clan_id || '';
		const channel = state.channels?.byClans?.[clanId]?.entities?.entities?.[message.channel_id];
		const lastSeenTimestamp = channelMeta?.lastSeenTimestamp;

		const shouldDecrease =
			channel &&
			lastSeenTimestamp &&
			messageTimestamp > lastSeenTimestamp &&
			(channel.count_mess_unread || 0) > 0 &&
			this.isMessageMentionOrReply(state, message, userId);

		if (shouldDecrease && (channel?.count_mess_unread || 0) > 0) {
			this.decrementChannel(clanId, message.channel_id, 1);
		}
	}

	private isMessageMentionOrReply(state: RootState, msg: ChannelMessage, currentUserId: string): boolean {
		const currentClanUser = selectMemberClanByUserId(state, currentUserId);

		let mentions: ApiMessageMention[] | undefined;
		if (Array.isArray(msg?.mentions)) {
			mentions = msg.mentions as unknown as ApiMessageMention[];
		} else if (typeof msg?.mentions === 'string') {
			mentions = safeJSONParse(msg.mentions) as ApiMessageMention[] | undefined;
		}

		const includesHere = mentions?.some((m) => m?.user_id === ID_MENTION_HERE) ?? false;
		const includesUser = mentions?.some((mention) => mention?.user_id === currentUserId) ?? false;
		const includesRole = mentions?.some((item) => (currentClanUser?.role_id as string | undefined)?.includes(item?.role_id as string)) ?? false;

		const isReply = msg.references?.some((ref) => ref.message_sender_id === currentUserId) ?? false;
		return includesHere || includesUser || includesRole || isReply;
	}
}

export const badgeService = new BadgeService();
