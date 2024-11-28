import { captureSentryError } from '@mezon/logger';
import { EmojiDataOptionals, EmojiPlaces, EmojiStorage, IReaction } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiMessageReaction } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';

export const REACTION_FEATURE_KEY = 'reaction';

export const mapReactionToEntity = (reaction: UpdateReactionMessageArgs) => {
	return {
		...reaction
	} as ReactionEntity;
};

export interface ReactionEntity extends IReaction {
	id: string;
}

export type UpdateReactionMessageArgs = {
	id?: string;
	channel_id?: string;
	message_id?: string;
	emoji_id: string;
	emoji: string;
	count?: number;
	sender_id?: string;
	action?: boolean;
};

export type UpdateBulkMessageReactionsArgs = {
	messages: {
		id: string;
		reactions?: ApiMessageReaction[] | undefined;
		channel_id?: string;
	}[];
};

export interface ReactionState extends EntityState<ReactionEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
	reactionPlaceActive: EmojiPlaces;
	reactionTopState: boolean;
	reactionBottomState: boolean;
	reactionRightState: boolean;
	reactionBottomStateResponsive: boolean;
	messageMatchWithRef: boolean;
	positionOfSmileButton: {
		top: number;
		right: number;
		left: number;
		bottom: number;
	};
	emojiHover: EmojiDataOptionals | null;
	computedMessageReactions: Record<string, EmojiDataOptionals[]>;
}

export const reactionAdapter = createEntityAdapter({
	selectId: (emo: ReactionEntity) => emo.id || ''
});

export const updateReactionMessage = createAsyncThunk(
	'messages/updateReactionMessage',

	async ({ id, channel_id, message_id, sender_id, emoji_id, emoji, count, action }: UpdateReactionMessageArgs, thunkAPI) => {
		try {
			await thunkAPI.dispatch(reactionActions.setReactionDataSocket({ id, channel_id, message_id, sender_id, emoji_id, emoji, count, action }));
		} catch (error) {
			captureSentryError(error, 'messages/updateReactionMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type WriteMessageReactionArgs = {
	id: string;
	clanId: string;
	channelId: string;
	mode: number;
	messageId: string;
	emoji_id: string;
	emoji: string;
	count: number;
	messageSenderId: string;
	actionDelete: boolean;
	isPublic: boolean;
	userId: string;
};

const reactionQueue: Array<() => Promise<void>> = [];
let isProcessingReactionQueue = false;

async function processReactionQueue() {
	if (isProcessingReactionQueue || reactionQueue.length === 0) return;
	isProcessingReactionQueue = true;
	while (reactionQueue.length > 0) {
		const action = reactionQueue.shift();
		if (action) {
			try {
				await action();
			} catch (e) {
				captureSentryError(e, 'messages/writeMessageReaction');
			}
		}
	}
	isProcessingReactionQueue = false;
}

export const writeMessageReaction = createAsyncThunk(
	'messages/writeMessageReaction',
	async (
		{ id, clanId, channelId, mode, messageId, emoji_id, emoji, count, messageSenderId, actionDelete, isPublic, userId }: WriteMessageReactionArgs,
		thunkAPI
	) => {
		const action = async () => {
			try {
				const mezon = await ensureSession(getMezonCtx(thunkAPI));
				const session = mezon.sessionRef.current;
				const client = mezon.clientRef.current;
				const socket = mezon.socketRef.current;

				if (!client || !session || !socket) {
					throw new Error('Client is not initialized');
				}

				await socket.writeMessageReaction(
					id,
					clanId,
					channelId,
					mode,
					isPublic,
					messageId,
					emoji_id,
					emoji,
					count,
					messageSenderId,
					actionDelete
				);

				const emojiLastest: EmojiStorage = {
					emojiId: emoji_id,
					emoji,
					messageId,
					senderId: userId,
					action: actionDelete,
					channel_id: channelId
				};
				saveRecentEmoji(emojiLastest);
			} catch (error) {
				captureSentryError(error, 'messages/writeMessageReaction');
				thunkAPI.rejectWithValue(error);
			}
		};

		reactionQueue.push(action);
		processReactionQueue();
	}
);

export const initialReactionState: ReactionState = reactionAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	reactionPlaceActive: EmojiPlaces.EMOJI_REACTION,
	reactionTopState: false,
	reactionBottomState: false,
	reactionRightState: false,
	reactionBottomStateResponsive: false,
	messageMatchWithRef: false,
	positionOfSmileButton: {
		top: 0,
		right: 0,
		left: 0,
		bottom: 0
	},
	emojiHover: null,
	computedMessageReactions: {}
});

export const reactionSlice = createSlice({
	name: REACTION_FEATURE_KEY,
	initialState: initialReactionState,
	reducers: {
		removeAll: reactionAdapter.removeAll,
		setReactionPlaceActive(state, action) {
			state.reactionPlaceActive = action.payload;
		},
		setReactionTopState(state, action) {
			state.reactionTopState = action.payload;
		},
		setReactionBottomState(state, action) {
			state.reactionBottomState = action.payload;
		},
		setReactionBottomStateResponsive(state, action) {
			state.reactionBottomStateResponsive = action.payload;
		},

		setReactionRightState(state, action) {
			state.reactionRightState = action.payload;
		},

		setReactionDataSocket: (state, action: PayloadAction<UpdateReactionMessageArgs>) => {
			const reactionDataSocket = {
				...action.payload,
				count: action.payload.count || 1
			};

			const isAdd = !action.payload.action;
			// Server not send id
			// We have to find the id of the reaction by message_id and emoji and sender_id
			if (reactionDataSocket.id !== '') {
				const reactionEntities = reactionAdapter.getSelectors().selectAll(state);
				const reaction = reactionEntities.find(
					(reaction) =>
						reaction.message_id === reactionDataSocket.message_id &&
						reaction.emoji === reactionDataSocket.emoji &&
						reaction.sender_id === reactionDataSocket.sender_id
				);

				if (reaction) {
					reactionDataSocket.id = reaction.id;
				}
			}

			const existing = reactionAdapter.getSelectors().selectById(state, reactionDataSocket.id || '');
			if (isAdd && !existing) {
				reactionAdapter.addOne(state, mapReactionToEntity(reactionDataSocket));
			} else if (isAdd && existing) {
				reactionAdapter.updateOne(state, {
					id: reactionDataSocket.id || '',
					changes: {
						count: existing.count + reactionDataSocket.count
					}
				});
			} else if (!isAdd && existing) {
				reactionAdapter.removeOne(state, reactionDataSocket.id || '');
			} else {
				// Do nothing when remove reaction and not found
			}

			if (action.payload.message_id && action.payload.channel_id) {
				const combinedId = `${action.payload.channel_id}_${action.payload.message_id}`;
				state.computedMessageReactions[combinedId] = combineMessageReactions(state, combinedId);
			}
		},
		setMessageMatchWithRef(state, action) {
			state.messageMatchWithRef = action.payload;
		},
		setPositionOfSmileButton(state, action) {
			state.positionOfSmileButton = action.payload;
		},
		updateBulkMessageReactions: (state, action: PayloadAction<UpdateBulkMessageReactionsArgs>) => {
			const { messages } = action.payload;
			for (const message of messages) {
				const reactionsRaw = message.reactions;
				const reactions = (reactionsRaw || []).map((reaction) => {
					const id = reaction.id || '';
					const message_id = message.id;
					return mapReactionToEntity({ ...reaction, id, message_id, channel_id: message.channel_id });
				});
				reactionAdapter.upsertMany(state, reactions);
				if (!reactions?.length) continue;

				const combinedId = `${message.channel_id}_${message.id}`;
				state.computedMessageReactions[combinedId] = combineMessageReactions(state, combinedId);
			}
		}
	}
});
function saveRecentEmoji(emojiLastest: EmojiStorage) {
	const storedEmojis = localStorage.getItem('recentEmojis');
	const emojisRecentParse = storedEmojis ? JSON.parse(storedEmojis) : [];

	if (emojisRecentParse.length > 0) {
		const lastEmoji = emojisRecentParse[emojisRecentParse.length - 1];
		if (lastEmoji.emoji === emojiLastest.emoji && lastEmoji.senderId === emojiLastest.senderId) {
			return;
		}
	}
	const duplicateIndex = emojisRecentParse.findIndex(
		(item: EmojiStorage) => item.emoji === emojiLastest.emoji && item.senderId === emojiLastest.senderId
	);

	if (emojiLastest.action === true) {
		if (duplicateIndex !== -1) {
			emojisRecentParse.splice(duplicateIndex, 1);
		}
	} else {
		if (duplicateIndex === -1) {
			emojisRecentParse.push(emojiLastest);
		}
	}

	if (emojisRecentParse.length > 20) {
		emojisRecentParse.splice(0, emojisRecentParse.length - 20);
	}

	localStorage.setItem('recentEmojis', JSON.stringify(emojisRecentParse));
}
function combineMessageReactions(state: ReactionState, combinedId: string): EmojiDataOptionals[] {
	const reactionEntities = reactionAdapter.getSelectors().selectAll(state);
	const [channel_id, message_id] = combinedId.split('_');
	const reactions = reactionEntities.filter((reaction) => reaction.message_id === message_id && reaction.channel_id === channel_id);

	const dataCombined: Record<string, EmojiDataOptionals> = {};

	for (const reaction of reactions) {
		const emojiId = reaction.emoji_id || ('' as string);
		const emoji = reaction.emoji || ('' as string);

		if (reaction.count < 1) {
			continue;
		}

		if (!dataCombined[emoji]) {
			dataCombined[emoji] = {
				emojiId,
				emoji,
				senders: [],
				action: false,
				message_id: message_id,
				// TODO: TBD
				id: '',
				channel_id: ''
			};
		}

		const newSender = {
			sender_id: reaction.sender_id,
			count: reaction.count
		};

		const reactionData = dataCombined[emoji];
		const senderIndex = reactionData.senders.findIndex((sender) => sender.sender_id === newSender.sender_id);

		if (senderIndex === -1) {
			reactionData.senders.push(newSender);
		} else if (reactionData?.senders[senderIndex]) {
			reactionData.senders[senderIndex].count = newSender.count;
		}
	}

	const dataCombinedArray = Object.values(dataCombined);

	return dataCombinedArray;
}

export const reactionReducer = reactionSlice.reducer;

export const reactionActions = {
	...reactionSlice.actions,
	updateReactionMessage,
	writeMessageReaction
};

const { selectAll, selectEntities } = reactionAdapter.getSelectors();

export const getReactionState = (rootState: { [REACTION_FEATURE_KEY]: ReactionState }): ReactionState => rootState[REACTION_FEATURE_KEY];

export const selectAllEmojiReaction = createSelector(getReactionState, selectAll);

export const selectEmojiReactionEntities = createSelector(getReactionState, selectEntities);

export const selectReactionPlaceActive = createSelector(getReactionState, (state: ReactionState) => state.reactionPlaceActive);

export const selectReactionTopState = createSelector(getReactionState, (state: ReactionState) => state.reactionTopState);

export const selectReactionBottomState = createSelector(getReactionState, (state: ReactionState) => state.reactionBottomState);

export const selectReactionBottomStateResponsive = createSelector(getReactionState, (state: ReactionState) => state.reactionBottomStateResponsive);

export const selectReactionRightState = createSelector(getReactionState, (state: ReactionState) => state.reactionRightState);

export const selectMessageMatchWithRef = createSelector(getReactionState, (state: ReactionState) => state.messageMatchWithRef);

export const selectPositionEmojiButtonSmile = createSelector(getReactionState, (state: ReactionState) => state.positionOfSmileButton);

export const selectComputedMessageReactions = createSelector(getReactionState, (state: ReactionState) => state.computedMessageReactions);

export const selectIsMessageHasReaction = (channelId: string, messageId: string) =>
	createSelector(selectComputedMessageReactions, (computedMessageReactions) => {
		const combinedId = `${channelId}_${messageId}`;
		return computedMessageReactions[combinedId] && computedMessageReactions[combinedId].length > 0;
	});

export const selectComputedReactionsByMessageId = (channelId: string, messageId: string) =>
	createSelector(selectComputedMessageReactions, (computedMessageReactions) => {
		const combinedId = `${channelId}_${messageId}`;
		return computedMessageReactions[combinedId] || [];
	});

export const selectReactionsByEmojiIdFromMessage = createSelector(
	[selectComputedMessageReactions, (_, channelId: string, messageId: string, emojiId: string) => `${channelId},${messageId},${emojiId}`],
	(computedMessageReactions, payload) => {
		const [channelId, messageId, emojiId] = payload.split(',');

		if (channelId && messageId && emojiId) {
			const combinedId = `${channelId}_${messageId}`;
			const reactionsForMessage = computedMessageReactions[combinedId] || [];
			const filteredReactions = reactionsForMessage.filter((reaction) => reaction.emojiId === emojiId);

			if (filteredReactions.length > 0) {
				const reaction = filteredReactions[0];

				const senders =
					reaction.senders?.map((sender) => ({
						sender_id: sender.sender_id,
						count: sender.count
					})) || [];

				return {
					emojiId: reaction.emojiId,
					emoji: reaction.emoji,
					senders,
					action: reaction.action ?? false,
					messageId: reaction.message_id,
					id: reaction.id || '',
					channelId: reaction.channel_id || ''
				};
			}
		}
		return null;
	}
);
