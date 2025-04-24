import { captureSentryError } from '@mezon/logger';
import { EmojiStorage, IReaction } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
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
	reactionTopState: boolean;
	reactionRightState: boolean;
	messageMatchWithRef: boolean;
	positionOfSmileButton: {
		top: number;
		right: number;
		left: number;
		bottom: number;
	};
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
	topic_id?: string;
	emoji_recent_id?: string;
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
		{
			id,
			clanId,
			channelId,
			mode,
			messageId,
			emoji_id,
			emoji,
			count,
			messageSenderId,
			actionDelete,
			isPublic,
			userId,
			topic_id,
			emoji_recent_id
		}: WriteMessageReactionArgs,
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
					actionDelete,
					topic_id,
					emoji_recent_id
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
	}
});

export const reactionSlice = createSlice({
	name: REACTION_FEATURE_KEY,
	initialState: initialReactionState,
	reducers: {
		removeAll: reactionAdapter.removeAll,
		setReactionTopState(state, action) {
			state.reactionTopState = action.payload;
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
						reaction.emoji_id === reactionDataSocket.emoji_id &&
						reaction.sender_id === reactionDataSocket.sender_id &&
						reaction?.channel_id === reactionDataSocket?.channel_id
				);

				if (reaction) {
					reactionDataSocket.id = reaction.id;
				}
			}

			console.log(reactionDataSocket, 'reactionDataSocke');

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
		},
		setPositionOfSmileButton(state, action) {
			state.positionOfSmileButton = action.payload;
		}
	}
});
function saveRecentEmoji(emojiLastest: EmojiStorage) {
	const storedEmojis = localStorage.getItem('recentEmojis');
	const emojisRecentParse = storedEmojis ? safeJSONParse(storedEmojis) : [];

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

export const reactionReducer = reactionSlice.reducer;

export const reactionActions = {
	...reactionSlice.actions,
	writeMessageReaction
};

export const getReactionState = (rootState: { [REACTION_FEATURE_KEY]: ReactionState }): ReactionState => rootState[REACTION_FEATURE_KEY];

export const selectReactionTopState = createSelector(getReactionState, (state: ReactionState) => state.reactionTopState);

export const selectReactionRightState = createSelector(getReactionState, (state: ReactionState) => state.reactionRightState);

export const selectPositionEmojiButtonSmile = createSelector(getReactionState, (state: ReactionState) => state.positionOfSmileButton);
