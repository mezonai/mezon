import { captureSentryError } from '@mezon/logger';
import { EmojiStorage, IReaction } from '@mezon/utils';
import { EntityState, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import { ApiMessageReaction } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';
import { toastActions } from '../toasts';

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
	url?: string;
	creator_id?: string;
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
	sender_name?: string;
};

const reactionQueue: Array<() => Promise<void>> = [];
let isProcessingReactionQueue = false;

const createTimeoutPromise = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
		})
	]);
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
	let lastError: Error;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (i < maxRetries - 1) {
				const delayTime = baseDelay * Math.pow(2, i);
				await new Promise((resolve) => setTimeout(resolve, delayTime));
			}
		}
	}

	throw lastError!;
};

async function processReactionQueue(dispatch?: any) {
	if (isProcessingReactionQueue || reactionQueue.length === 0) return;
	isProcessingReactionQueue = true;
	while (reactionQueue.length > 0) {
		const action = reactionQueue.shift();
		if (action) {
			try {
				await action();
			} catch (e) {
				console.error('Reaction queue processing failed:', e);
				captureSentryError(e, 'messages/writeMessageReaction');
				dispatch(
					toastActions.addToast({
						message: 'Socket has issue. Cannot react right now.',
						type: 'warning',
						autoClose: 3000
					})
				);
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
			emoji_recent_id,
			sender_name
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

				await retryWithBackoff(
					async () => {
						return await createTimeoutPromise(
							socket.writeMessageReaction(
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
								emoji_recent_id,
								sender_name
							),
							2000,
							'Message reaction operation timed out'
						);
					},
					1,
					1000
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
				console.error('WriteMessageReaction failed:', error);
				captureSentryError(error, 'messages/writeMessageReaction');
				throw error;
			}
		};

		reactionQueue.push(action);
		processReactionQueue(thunkAPI.dispatch);
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
