import type { Middleware, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { accountReducer } from './account/account.slice';
import { appReducer } from './app/app.slice';
import { authReducer } from './auth/auth.slice';
import { categoriesReducer } from './categories/categories.slice';
import { channelMembersReducer } from './channelmembers/channel.members';
import { channelsReducer } from './channels/channels.slice';
import { usersClanReducer } from './clanMembers/clan.members';
import { userClanProfileReducer } from './clanProfile/clanProfile.slice';
import { clansReducer } from './clans/clans.slice';
import { COMPOSE_FEATURE_KEY, composeReducer } from './compose/compose.slice';
import { directReducer } from './direct/direct.slice';
import { emojiSuggestionReducer } from './emojiSuggestion/emojiSuggestion.slice';
import { friendsReducer } from './friends/friend.slice';
import { gifsReducer } from './giftStickerEmojiPanel/gifs.slice';
import { gifsStickerEmojiReducer } from './giftStickerEmojiPanel/gifsStickerEmoji.slice';
import { inviteReducer } from './invite/invite.slice';
import { messagesReducer } from './messages/messages.slice';
import { referencesReducer } from './messages/references.slice';
import { notificationReducer } from './notification/notify.slice';
import { POLICIES_FEATURE_KEY, policiesDefaultReducer, policiesReducer } from './policies/policies.slice';
import { reactionReducer } from './reactionMessage/reactionMessage.slice';

import type { MezonContextValue } from '@mezon/transport';
import { activitiesAPIReducer } from './activities/activitiesAPI.slice';
import { adminApplicationReducer } from './application/applications.slice';
import { attachmentReducer } from './attachment/attachments.slice';
import { auditLogReducer } from './auditLog/auditLog.slice';
import { auditLogFilterReducer } from './auditLog/auditLogFilter.slice';
import { canvasReducer } from './canvas/canvas.slice';
import { canvasAPIReducer } from './canvas/canvasAPI.slice';
import { userChannelsReducer } from './channelmembers/AllUsersChannelByAddChannel.slice';
import { listchannelsByUserReducer } from './channels/channelUser.slice';
import { CHANNEL_APP, channelAppReducer } from './channels/channelapp.slice';
import { channelMetaReducer } from './channels/channelmeta.slice';
import { hashtagDmReducer } from './channels/hashtagDm.slice';
import { CHANNEL_LIST_RENDER, listChannelRenderReducer } from './channels/listChannelRender.slice';
import { listUsersByUserReducer } from './channels/listUsers.slice';
import { clanMembersMetaReducer } from './clanMembers/clan.members.meta';
import { integrationClanWebhookReducer } from './clanWebhook/clanWebhook.slide';
import { settingChannelReducer } from './clans/clanSettingChannel.slice';
import { COMUNITY_FEATURE_KEY, comunityReducer } from './comunity/comunity.slice';
import { directMembersMetaReducer } from './direct/direct.members.meta';
import { directMetaReducer } from './direct/directmeta.slice';
import { audioCallReducer } from './dmcall/audioCall.slice';
import { DMCallReducer } from './dmcall/dmcall.slice';
import { dragAndDropReducer } from './dragAndDrop/dragAndDrop.slice';
import { E2EE_FEATURE_KEY, e2eeReducer } from './e2ee/e2ee.slice';
import { emojiRecentReducer } from './emojiSuggestion/emojiRecent.slice';
import { errorListenerMiddleware } from './errors/errors.listener';
import { ERRORS_FEATURE_KEY, errorsReducer } from './errors/errors.slice';
import { eventManagementReducer } from './eventManagement/eventManagement.slice';
import { fcmReducer } from './fcm/fcm.slice';
import { popupForwardReducer } from './forwardMessage/forwardMessage.slice';
import { galleryReducer } from './gallery/gallery.slice';
import { giveCoffeeReducer } from './giveCoffee/giveCoffee.slice';
import { walletLedgerReducer } from './giveCoffee/historyTransaction.slice';
import { EMBED_MESSAGE, embedReducer } from './messages/embedMessage.slice';
import { channelCategorySettingReducer, defaultNotificationCategoryReducer } from './notificationSetting/notificationSettingCategory.slice';
import { notificationSettingReducer } from './notificationSetting/notificationSettingChannel.slice';
import { defaultNotificationClanReducer } from './notificationSetting/notificationSettingClan.slice';
import { ONBOARDING_FEATURE_KEY, onboardingReducer } from './onboarding/onboarding.slice';
import { permissionRoleChannelReducer } from './permissionChannel/permissionRoleChannel.slice';
import { pinMessageReducer } from './pinMessages/pinMessage.slice';
import { OVERRIDDEN_POLICIES_FEATURE_KEY, overriddenPoliciesReducer } from './policies/overriddenPolicies.slice';
import { QUICK_MENU_FEATURE_KEY, quickMenuReducer } from './quickMenu/quickMenu.slice';
import { IsShowReducer, RolesClanReducer, roleIdReducer } from './roleclan/roleclan.slice';
import { SEARCH_MESSAGES_FEATURE_KEY, searchMessageReducer } from './searchmessages/searchmessage.slice';
import { settingStickerReducer } from './settingSticker/settingSticker.slice';
import { groupCallReducer } from './slices/groupCall.slice';
import { usersStreamReducer } from './stream/usersStream.slice';
import { videoStreamReducer } from './stream/videoStream.slice';
import { systemMessageReducer } from './systemMessages/systemMessage.slice';
import { threadsReducer } from './threads/threads.slice';
import { toastListenerMiddleware } from './toasts/toasts.listener';
import { TOASTS_FEATURE_KEY, toastsReducer } from './toasts/toasts.slice';
import { topicsReducer } from './topicDiscussion/topicDiscussions.slice';
import { USER_STATUS_API_FEATURE_KEY, userStatusAPIReducer } from './userstatus/userstatusAPI.slice';
import { voiceReducer } from './voice/voice.slice';
import { WALLET_FEATURE_KEY, walletReducer } from './wallet/wallet.slice';
import { integrationWebhookReducer } from './webhook/webhook.slice';
import { WINDOW_CONTROLS_FEATURE_KEY, windowControlsReducer } from './windowControls/windowControls.slice';
import { TRANSACTION_HISTORY_FEATURE_KEY, transactionHistoryReducer } from './wallet/transactionHistory.slice';

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
		storage,
		blacklist: ['invitePeople']
	},
	clansReducer
);

const persistedAppReducer = persistReducer(
	{
		key: 'apps',
		storage,
		blacklist: [
			'loadingMainMobile',
			'isFromFcmMobile',
			'hasInternetMobile',
			'isShowChatStream',
			'chatStreamWidth',
			'isShowCanvas',
			'isShowSettingFooter',
			'isShowWelcomeMobile'
		]
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

const persistedEmojiRecentReducer = persistReducer(
	{
		key: 'emojiRecent',
		storage
	},
	emojiRecentReducer
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
		blacklist: ['request', 'previousChannels', 'scrollOffset', 'showScrollDownButton']
	},
	channelsReducer
);

const persistedThreadReducer = persistReducer(
	{
		key: 'threads',
		storage,
		blacklist: ['isShowCreateThread', 'isThreadModalVisible', 'isFocusThreadBox']
	},
	threadsReducer
);

const persistedTopicReducer = persistReducer(
	{
		key: 'topicdiscussions',
		storage,
		blacklist: ['isShowCreateTopic', 'isFocusTopicBox']
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
		blacklist: ['ongoingEvent', 'showModalEvent', 'showModalDetailEvent']
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
		storage,
		blacklist: ['isPinModalVisible']
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

const persistedOnboardingReducer = persistReducer(
	{
		key: ONBOARDING_FEATURE_KEY,
		storage,
		whitelist: ['keepAnswers', 'answerByClanId']
	},
	onboardingReducer
);
const persistedComunityReducer = persistReducer(
	{
		key: COMUNITY_FEATURE_KEY,
		storage
	},
	comunityReducer
);

const persistedChannelAppReducer = persistReducer(
	{
		key: CHANNEL_APP,
		storage,
		whitelist: ['position', 'size', 'prePosition', 'preSize']
	},
	channelAppReducer
);

const persistedCompose = persistReducer(
	{
		key: COMPOSE_FEATURE_KEY,
		storage
	},
	composeReducer
);

const persistedWalletStore = persistReducer(
	{
		key: WALLET_FEATURE_KEY,
		storage
	},
	walletReducer
);

const reducer = {
	app: persistedAppReducer,
	account: accountReducer,
	auth: persistedReducer,
	attachments: attachmentReducer,
	gallery: galleryReducer,
	clans: persistedClansReducer,
	channels: persistedChannelReducer,
	channelmeta: persistedChannelMetaReducer,
	settingSticker: persistedsettingClanStickerReducer,
	allUsersByAddChannel: persisteduserChannelsReducer,
	listchannelbyusers: persistedListchannelsByUserReducer,
	listpermissionroleschannel: persistedPermissionRoleChannelReducer,
	channelMembers: channelMembersReducer,
	listusersbyuserid: persistedListUsersByUserReducer,
	threads: persistedThreadReducer,
	topicdiscussions: persistedTopicReducer,
	[SEARCH_MESSAGES_FEATURE_KEY]: searchMessageReducer,
	messages: messagesReducer,
	categories: persistedCatReducer,
	rolesclan: persistedRolesClanReducer,
	eventmanagement: persistedEventMngtReducer,
	usersClan: usersClanReducer,
	[POLICIES_FEATURE_KEY]: policiesReducer,
	userClanProfile: userClanProfileReducer,
	friends: friendsReducer,
	direct: directReducer,
	directmeta: directMetaReducer,
	roleId: roleIdReducer,
	policiesDefaultSlice: policiesDefaultReducer,
	[OVERRIDDEN_POLICIES_FEATURE_KEY]: overriddenPoliciesReducer,
	notificationsetting: notificationSettingReducer,
	pinmessages: persistedPinMsgReducer,
	defaultnotificationclan: persistedDefaultNotiClanReducer,
	defaultnotificationcategory: persistedDefaultNotiCatReducer,
	notichannelcategorysetting: persistedChannelCatSettingReducer,
	hashtagdm: persistedHashTagDmReducer,
	invite: inviteReducer,
	isshow: IsShowReducer,
	forwardmessage: popupForwardReducer,
	notification: notificationReducer,
	voice: voiceReducer,
	usersstream: usersStreamReducer,
	videostream: videoStreamReducer,
	channelApp: persistedChannelAppReducer,
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
	emojiRecent: persistedEmojiRecentReducer,
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
	[ONBOARDING_FEATURE_KEY]: persistedOnboardingReducer,
	dmcall: DMCallReducer,
	[USER_STATUS_API_FEATURE_KEY]: userStatusAPIReducer,
	[E2EE_FEATURE_KEY]: e2eeReducer,
	[EMBED_MESSAGE]: embedReducer,
	walletLedger: walletLedgerReducer,
	[CHANNEL_LIST_RENDER]: listChannelRenderReducer,
	[COMPOSE_FEATURE_KEY]: persistedCompose,
	groupCall: groupCallReducer,
	[QUICK_MENU_FEATURE_KEY]: quickMenuReducer,
	[COMUNITY_FEATURE_KEY]: persistedComunityReducer,
	[WINDOW_CONTROLS_FEATURE_KEY]: windowControlsReducer,
	[TRANSACTION_HISTORY_FEATURE_KEY]: transactionHistoryReducer,
	[WALLET_FEATURE_KEY]: persistedWalletStore
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
		devTools: process.env.NODE_ENV !== 'production',
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
			}).prepend(errorListenerMiddleware.middleware, toastListenerMiddleware.middleware)
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
