import { MezonContextValue } from '@mezon/transport';
import storage from '@react-native-async-storage/async-storage';
import { Middleware, ThunkDispatch, UnknownAction, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createTransform, persistReducer, persistStore } from 'redux-persist';
import { accountReducer } from './account/account.slice';
import { appReducer } from './app/app.slice';
import { authReducer } from './auth/auth.slice';
import { categoriesReducer } from './categories/categories.slice';
import { channelMembersReducer } from './channelmembers/channel.members';
import { channelsReducer } from './channels/channels.slice';
import { usersClanReducer } from './clanMembers/clan.members';
import { userClanProfileReducer } from './clanProfile/clanProfile.slice';
import { clansReducer } from './clans/clans.slice';
import { directReducer } from './direct/direct.slice';
import { emojiSuggestionReducer } from './emojiSuggestion/emojiSuggestion.slice';
import { friendsReducer } from './friends/friend.slice';
import { gifsReducer } from './giftStickerEmojiPanel/gifs.slice';
import { gifsStickerEmojiReducer } from './giftStickerEmojiPanel/gifsStickerEmoji.slice';
import { inviteReducer } from './invite/invite.slice';
import { MessagesState, messagesReducer } from './messages/messages.slice';
import { referencesReducer } from './messages/references.slice';
import { notificationReducer } from './notification/notify.slice';
import { POLICIES_FEATURE_KEY, policiesDefaultReducer, policiesReducer } from './policies/policies.slice';
import { reactionReducer } from './reactionMessage/reactionMessage.slice';

import { activitiesAPIReducer } from './activities/activitiesAPI.slice';
import { adminApplicationReducer } from './application/applications.slice';
import { attachmentReducer } from './attachment/attachments.slice';
import { canvasReducer } from './canvas/canvas.slice';
import { canvasAPIReducer } from './canvas/canvasAPI.slice';
import { userChannelsReducer } from './channelmembers/AllUsersChannelByAddChannel.slice';
import { listchannelsByUserReducer } from './channels/channelUser.slice';
import { channelMetaReducer } from './channels/channelmeta.slice';
import { hashtagDmReducer } from './channels/hashtagDm.slice';
import { listUsersByUserReducer } from './channels/listUsers.slice';
import { settingChannelReducer } from './clans/clanSettingChannel.slice';
import { directMetaReducer } from './direct/directmeta.slice';
import { dragAndDropReducer } from './dragAndDrop/dragAndDrop.slice';
import { errorListenerMiddleware } from './errors/errors.listener';
import { ERRORS_FEATURE_KEY, errorsReducer } from './errors/errors.slice';
import { eventManagementReducer } from './eventManagement/eventManagement.slice';
import { popupForwardReducer } from './forwardMessage/forwardMessage.slice';
import { giveCoffeeReducer } from './giveCoffee/giveCoffee.slice';
import { notifiReactMessageReducer } from './notificationSetting/notificationReactMessage.slice';
import { channelCategorySettingReducer, defaultNotificationCategoryReducer } from './notificationSetting/notificationSettingCategory.slice';
import { notificationSettingReducer } from './notificationSetting/notificationSettingChannel.slice';
import { defaultNotificationClanReducer } from './notificationSetting/notificationSettingClan.slice';
import { permissionRoleChannelReducer } from './permissionChannel/permissionRoleChannel.slice';
import { pinMessageReducer } from './pinMessages/pinMessage.slice';
import { OVERRIDDEN_POLICIES_FEATURE_KEY, overriddenPoliciesReducer } from './policies/overriddenPolicies.slice';
import { IsShowReducer, RolesClanReducer, roleIdReducer } from './roleclan/roleclan.slice';
import { SEARCH_MESSAGES_FEATURE_KEY, searchMessageReducer } from './searchmessages/searchmessage.slice';
import { settingStickerReducer } from './settingSticker/settingSticker.slice';
import { channelsStreamReducer } from './stream/channelsStream.slice';
import { usersStreamReducer } from './stream/usersStream.slice';
import { videoStreamReducer } from './stream/videoStream.slice';
import { systemMessageReducer } from './systemMessages/systemMessage.slide';
import { threadsReducer } from './threads/threads.slice';
import { toastListenerMiddleware } from './toasts/toasts.listener';
import { TOASTS_FEATURE_KEY, toastsReducer } from './toasts/toasts.slice';
import { voiceReducer } from './voice/voice.slice';
import { integrationWebhookReducer } from './webhook/webhook.slice';
const persistedReducer = persistReducer(
	{
		key: 'auth',
		storage
	},
	authReducer
);

const persistedClansReducer = persistReducer(
	{
		key: 'clans',
		storage
	},
	clansReducer
);

const persistedAppReducer = persistReducer(
	{
		key: 'apps',
		storage,
		blacklist: ['loadingMainMobile', 'isFromFcmMobile', 'hasInternetMobile', 'isShowChatStream', 'chatStreamWidth', 'isShowCanvas']
	},
	appReducer
);

const persistedEmojiSuggestionReducer = persistReducer(
	{
		key: 'suggestionemoji',
		storage
	},
	emojiSuggestionReducer
);

const transformJumpingError = createTransform<MessagesState, MessagesState>(
	(inboundState) => {
		return inboundState;
	},
	(outboundState, key) => {
		if (key === 'isJumpingToPresent') {
			return {
				...outboundState,
				isJumpingToPresent: {}
			};
		}
		return outboundState;
	},
	{ whitelist: ['isJumpingToPresent'] }
);

const persistedMessageReducer = persistReducer(
	{
		key: 'messages',
		storage,
		blacklist: ['typingUsers', 'isSending']
	},
	messagesReducer
);

const persistedCatReducer = persistReducer(
	{
		key: 'categories',
		storage
	},
	categoriesReducer
);

const persistedChannelReducer = persistReducer(
	{
		key: 'channels',
		storage,
		blacklist: ['request']
	},
	channelsReducer
);

const persistedThreadReducer = persistReducer(
	{
		key: 'threads',
		storage,
		blacklist: ['isShowCreateThread']
	},
	threadsReducer
);

const persistedChannelMembersReducer = persistReducer(
	{
		key: 'channelmembers',
		storage,
		blacklist: ['onlineStatusUser']
	},
	channelMembersReducer
);

const persistedListUsersByUserReducer = persistReducer(
	{
		key: 'listusersbyuserid',
		storage,
		blacklist: ['onlineStatusUser']
	},
	listUsersByUserReducer
);

const persistedListchannelsByUserReducer = persistReducer(
	{
		key: 'listchannelbyusers',
		storage
	},
	listchannelsByUserReducer
);

const persistedPermissionRoleChannelReducer = persistReducer(
	{
		key: 'listpermissionroleschannel',
		storage
	},
	permissionRoleChannelReducer
);

const persistedRolesClanReducer = persistReducer(
	{
		key: 'rolesclan',
		storage
	},
	RolesClanReducer
);

const persistedEventMngtReducer = persistReducer(
	{
		key: 'eventmanagement',
		storage,
		blacklist: ['ongoingEvent']
	},
	eventManagementReducer
);

const persistedChannelCatSettingReducer = persistReducer(
	{
		key: 'notichannelcategorysetting',
		storage
	},
	channelCategorySettingReducer
);

const persistedPinMsgReducer = persistReducer(
	{
		key: 'pinmessages',
		storage
	},
	pinMessageReducer
);

const persistedDefaultNotiClanReducer = persistReducer(
	{
		key: 'defaultnotificationclan',
		storage
	},
	defaultNotificationClanReducer
);

const persistedDefaultNotiCatReducer = persistReducer(
	{
		key: 'defaultnotificationcategory',
		storage
	},
	defaultNotificationCategoryReducer
);

const persistedHashTagDmReducer = persistReducer(
	{
		key: 'hashtagdm',
		storage
	},
	hashtagDmReducer
);

const persistedNotiReactMsgReducer = persistReducer(
	{
		key: 'notifireactmessage',
		storage
	},
	notifiReactMessageReducer
);

const persistedGifsStickerEmojiReducer = persistReducer(
	{
		key: 'gifsstickersemojis',
		storage,
		blacklist: ['subPanelActive']
	},
	gifsStickerEmojiReducer
);

const persistedChannelMetaReducer = persistReducer(
	{
		key: 'channelmeta',
		storage
	},
	channelMetaReducer
);

const persistedsettingClanStickerReducer = persistReducer(
	{
		key: 'settingSticker',
		storage,
		blacklist: ['hasGrandchildModal']
	},
	settingStickerReducer
);

const persisteduserChannelsReducer = persistReducer(
	{
		key: 'allUsersByAddChannel',
		storage
	},
	userChannelsReducer
);

const persistedStreamReducer = persistReducer(
	{
		key: 'stream',
		storage
	},
	videoStreamReducer
);

const persistPoliciesReducer = persistReducer(
	{
		key: 'policiesReducer',
		storage
	},
	policiesReducer
);

const persistOverriddenPoliciesReducer = persistReducer(
	{
		key: 'overriddenPoliciesReducer',
		storage
	},
	overriddenPoliciesReducer
);

const persistuUersClanReducer = persistReducer(
	{
		key: 'usersClanReducer',
		storage
	},
	usersClanReducer
);

const persistAccountReducer = persistReducer(
	{
		key: 'accountReducer',
		storage
	},
	accountReducer
);

const reducer = {
	app: persistedAppReducer,
	account: persistAccountReducer,
	auth: persistedReducer,
	attachments: attachmentReducer,
	clans: persistedClansReducer,
	channels: persistedChannelReducer,
	channelmeta: persistedChannelMetaReducer,
	settingSticker: persistedsettingClanStickerReducer,
	allUsersByAddChannel: persisteduserChannelsReducer,
	listchannelbyusers: persistedListchannelsByUserReducer,
	listpermissionroleschannel: persistedPermissionRoleChannelReducer,
	channelMembers: persistedChannelMembersReducer,
	listusersbyuserid: persistedListUsersByUserReducer,
	threads: persistedThreadReducer,
	[SEARCH_MESSAGES_FEATURE_KEY]: searchMessageReducer,
	messages: persistedMessageReducer,
	categories: persistedCatReducer,
	rolesclan: persistedRolesClanReducer,
	eventmanagement: persistedEventMngtReducer,
	usersClan: persistuUersClanReducer,
	[POLICIES_FEATURE_KEY]: persistPoliciesReducer,
	userClanProfile: userClanProfileReducer,
	friends: friendsReducer,
	direct: directReducer,
	directmeta: directMetaReducer,
	roleId: roleIdReducer,
	policiesDefaultSlice: policiesDefaultReducer,
	[OVERRIDDEN_POLICIES_FEATURE_KEY]: persistOverriddenPoliciesReducer,
	notificationsetting: notificationSettingReducer,
	pinmessages: persistedPinMsgReducer,
	defaultnotificationclan: persistedDefaultNotiClanReducer,
	defaultnotificationcategory: persistedDefaultNotiCatReducer,
	notichannelcategorysetting: persistedChannelCatSettingReducer,
	hashtagdm: persistedHashTagDmReducer,
	notifireactmessage: persistedNotiReactMsgReducer,
	invite: inviteReducer,
	isshow: IsShowReducer,
	forwardmessage: popupForwardReducer,
	notification: notificationReducer,
	voice: voiceReducer,
	usersstream: usersStreamReducer,
	channelsstream: channelsStreamReducer,
	videostream: persistedStreamReducer,
	canvas: canvasReducer,
	canvasapi: canvasAPIReducer,
	activitiesapi: activitiesAPIReducer,
	references: referencesReducer,
	reaction: reactionReducer,
	suggestionEmoji: persistedEmojiSuggestionReducer,
	gifs: gifsReducer,
	gifsStickersEmojis: persistedGifsStickerEmojiReducer,
	dragAndDrop: dragAndDropReducer,
	[ERRORS_FEATURE_KEY]: errorsReducer,
	[TOASTS_FEATURE_KEY]: toastsReducer,
	integrationWebhook: integrationWebhookReducer,
	adminApplication: adminApplicationReducer,
	systemMessages: systemMessageReducer,
	giveCoffee: giveCoffeeReducer,
	settingClanChannel: settingChannelReducer
};

let storeInstance = configureStore({
	reducer
});

let storeCreated = false;

export type RootState = ReturnType<typeof storeInstance.getState>;

export type PreloadedRootState = RootState | undefined;

const limitDataMiddleware: Middleware = () => (next) => (action: any) => {
	// Check if the action is of type 'persist/REHYDRATE' and the key is 'messages'
	if (action.type === 'persist/REHYDRATE' && action.key === 'messages') {
		const { channelIdLastFetch, channelMessages } = action.payload || {};

		if (channelIdLastFetch && channelMessages?.[channelIdLastFetch]) {
			// Limit the channelMessages to only include messages for the last fetched channelId
			action.payload = {
				...action.payload,
				channelMessages: {
					[channelIdLastFetch]: channelMessages[channelIdLastFetch]
				}
			};
		}
	}
	// Pass the action to the next middleware or reducer
	return next(action);
};

export const initStore = (mezon: MezonContextValue, preloadedState?: PreloadedRootState) => {
	const store = configureStore({
		reducer,
		preloadedState,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: {
					extraArgument: {
						mezon
					}
				},
				immutableCheck: false,
				serializableCheck: false
			}).prepend(errorListenerMiddleware.middleware, toastListenerMiddleware.middleware, limitDataMiddleware)
	});
	storeInstance = store;
	storeCreated = true;
	const persistor = persistStore(store);
	return { store, persistor };
};

export type Store = typeof storeInstance;

export type AppThunkDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

export type AppDispatch = typeof storeInstance.dispatch & AppThunkDispatch;

export const getStore = () => {
	return storeInstance;
};

export const getStoreAsync = async () => {
	if (!storeCreated) {
		return new Promise<Store>((resolve) => {
			const interval = setInterval(() => {
				if (storeCreated) {
					clearInterval(interval);
					resolve(storeInstance);
				}
			}, 100);
		});
	}
	return storeInstance;
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
