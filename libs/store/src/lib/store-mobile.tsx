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
import { auditLogReducer } from './auditLog/auditLog.slice';
import { auditLogFilterReducer } from './auditLog/auditLogFilter.slice';
import { canvasReducer } from './canvas/canvas.slice';
import { canvasAPIReducer } from './canvas/canvasAPI.slice';
import { userChannelsReducer } from './channelmembers/AllUsersChannelByAddChannel.slice';
import { listchannelsByUserReducer } from './channels/channelUser.slice';
import { channelAppReducer } from './channels/channelapp.slice';
import { channelMetaReducer } from './channels/channelmeta.slice';
import { hashtagDmReducer } from './channels/hashtagDm.slice';
import { CHANNEL_LIST_RENDER, listChannelRenderReducer } from './channels/listChannelRender.slice';
import { listUsersByUserReducer } from './channels/listUsers.slice';
import { clanMembersMetaReducer } from './clanMembers/clan.members.meta';
import { integrationClanWebhookReducer } from './clanWebhook/clanWebhook.slide';
import { settingChannelReducer } from './clans/clanSettingChannel.slice';
import { directMembersMetaReducer } from './direct/direct.members.meta';
import { directMetaReducer } from './direct/directmeta.slice';
import { audioCallReducer } from './dmcall/audioCall.slice';
import { DMCallReducer } from './dmcall/dmcall.slice';
import { dragAndDropReducer } from './dragAndDrop/dragAndDrop.slice';
import { E2EE_FEATURE_KEY, e2eeReducer } from './e2ee/e2ee.slice';
import { errorListenerMiddleware } from './errors/errors.listener';
import { ERRORS_FEATURE_KEY, errorsReducer } from './errors/errors.slice';
import { eventManagementReducer } from './eventManagement/eventManagement.slice';
import { fcmReducer } from './fcm/fcm.slice';
import { popupForwardReducer } from './forwardMessage/forwardMessage.slice';
import { giveCoffeeReducer } from './giveCoffee/giveCoffee.slice';
import { walletLedgerReducer } from './giveCoffee/historyTransaction.slice';
import { EMBED_MESSAGE, embedReducer } from './messages/embedMessage.slice';
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
import { usersStreamReducer } from './stream/usersStream.slice';
import { videoStreamReducer } from './stream/videoStream.slice';
import { systemMessageReducer } from './systemMessages/systemMessage.slice';
import { threadsReducer } from './threads/threads.slice';
import { toastListenerMiddleware } from './toasts/toasts.listener';
import { TOASTS_FEATURE_KEY, toastsReducer } from './toasts/toasts.slice';
import { topicsReducer } from './topicDiscussion/topicDiscussions.slice';
import { USER_STATUS_API_FEATURE_KEY, userStatusAPIReducer } from './userstatus/userstatusAPI.slice';
import { VOICE_FEATURE_KEY, voiceReducer } from './voice/voice.slice';
import { integrationWebhookReducer } from './webhook/webhook.slice';
const persistedReducer = persistReducer(
	{
		key: 'auth',
		storage,
		blacklist: ['loadingStatus']
	},
	authReducer
);

const persistedClansReducer = persistReducer(
	{
		key: 'clans',
		storage,
		blacklist: ['invitePeople']
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

// comment logic cache messages
const persistedMessageReducer = persistReducer(
	{
		key: 'messages',
		storage,
		blacklist: ['typingUsers', 'isSending', 'isViewingOlderMessagesByChannelId']
	},
	messagesReducer
);

const persistedDirectReducer = persistReducer(
	{
		key: 'directMessage',
		storage,
		blacklist: ['currentDirectMessageId', 'statusDMChannelUnread', 'socketStatus', 'loadingStatus']
	},
	directReducer
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

const persistedTopicReducer = persistReducer(
	{
		key: 'topicdiscussions',
		storage,
		blacklist: ['isShowCreateTopic']
	},
	topicsReducer
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
const persistListChannelRenderReducer = persistReducer(
	{
		key: CHANNEL_LIST_RENDER,
		storage
	},
	listChannelRenderReducer
);

const persistedVoiceReducer = persistReducer(
	{
		key: VOICE_FEATURE_KEY,
		storage,
		whitelist: ['voiceInfo']
	},
	voiceReducer
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
	threads: threadsReducer,
	topicdiscussions: persistedTopicReducer,
	[SEARCH_MESSAGES_FEATURE_KEY]: searchMessageReducer,
	messages: persistedMessageReducer,
	categories: persistedCatReducer,
	rolesclan: persistedRolesClanReducer,
	eventmanagement: persistedEventMngtReducer,
	usersClan: persistuUersClanReducer,
	[POLICIES_FEATURE_KEY]: persistPoliciesReducer,
	userClanProfile: userClanProfileReducer,
	friends: friendsReducer,
	direct: persistedDirectReducer,
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
	voice: persistedVoiceReducer,
	usersstream: usersStreamReducer,
	videostream: videoStreamReducer,
	channelApp: channelAppReducer,
	canvas: canvasReducer,
	canvasapi: canvasAPIReducer,
	activitiesapi: activitiesAPIReducer,
	auditlog: auditLogReducer,
	audiocall: audioCallReducer,
	fcm: fcmReducer,
	auditlogfilter: auditLogFilterReducer,
	references: referencesReducer,
	reaction: reactionReducer,
	suggestionEmoji: persistedEmojiSuggestionReducer,
	gifs: gifsReducer,
	gifsStickersEmojis: persistedGifsStickerEmojiReducer,
	dragAndDrop: dragAndDropReducer,
	[ERRORS_FEATURE_KEY]: errorsReducer,
	[TOASTS_FEATURE_KEY]: toastsReducer,
	integrationWebhook: integrationWebhookReducer,
	integrationClanWebhook: integrationClanWebhookReducer,
	adminApplication: adminApplicationReducer,
	systemMessages: systemMessageReducer,
	giveCoffee: giveCoffeeReducer,
	settingClanChannel: settingChannelReducer,
	clanMembersMeta: clanMembersMetaReducer,
	directmembersmeta: directMembersMetaReducer,
	dmcall: DMCallReducer,
	[USER_STATUS_API_FEATURE_KEY]: userStatusAPIReducer,
	[E2EE_FEATURE_KEY]: e2eeReducer,
	[EMBED_MESSAGE]: embedReducer,
	walletLedger: walletLedgerReducer,
	[CHANNEL_LIST_RENDER]: persistListChannelRenderReducer
};

let storeInstance = configureStore({
	reducer
});

let storeCreated = false;

export type RootState = ReturnType<typeof storeInstance.getState>;

export type PreloadedRootState = RootState | undefined;

// const LIMIT_CHANNEL_CACHE = 10;
const limitDataMiddleware: Middleware = () => (next) => (action: any) => {
	// Check if the action is of type 'persist/REHYDRATE' and the key is 'channels'
	if (action.type === 'persist/REHYDRATE' && action?.key === 'channels') {
		if (action.payload && action.payload.byClans) {
			Object.keys(action.payload.byClans)?.forEach((clanId) => {
				if (action.payload.byClans[clanId].currentChannelId) {
					delete action.payload.byClans[clanId].currentChannelId;
				}
			});
		}
	}
	// comment logic cache messages
	// if (action.type === 'persist/REHYDRATE' && action.key === 'messages') {
	// 	const { channelMessages } = action.payload || {};
	// 	if (channelMessages && typeof channelMessages === 'object') {
	// 		const keys = Object.keys(channelMessages);
	// 		if (channelMessages && keys?.length > LIMIT_CHANNEL_CACHE) {
	// 			while (keys.length > LIMIT_CHANNEL_CACHE) {
	// 				const oldestKey = keys.shift();
	// 				if (oldestKey) {
	// 					delete channelMessages[oldestKey];
	// 				}
	// 			}
	// 		}
	// 	}
	// }
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
