import { describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { CLANS_FEATURE_KEY, clansActions, clansReducer, mapClanToEntity, selectCurrentClanProPlan } from './clans.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({
	...jest.requireActual('../../../../utils/src/lib/utils/clanChannel'),
	FOR_1_HOUR_SEC: 3600,
	LIMIT_CLAN_ITEM: 50,
	ONE_MILISECONDS: 1
}));
jest.mock('mezon-js', () => ({ ChannelType: { CHANNEL_TYPE_CHANNEL: 1 } }));
jest.mock('mezon-js-protobuf', () => ({ ClanDescList: {}, ListClanDescRequest: {} }));
jest.mock('react-redux', () => ({ batch: (fn: () => void) => fn() }));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: jest.fn() }));
jest.mock('../account/account.slice', () => ({ accountActions: {} }));
jest.mock('../application/adminAPI.slice', () => ({ callApiAdmin: jest.fn() }));
jest.mock('../avatarOverride/avatarOverride', () => ({ setUserAvatarOverride: jest.fn() }));
jest.mock('../channels/channelmeta.slice', () => ({ channelMetaActions: {} }));
jest.mock('../channels/channels.slice', () => ({ channelsActions: {} }));
jest.mock('../clanMembers/clan.members', () => ({ usersClanActions: {}, fetchClanMembersWithStatus: jest.fn() }));
jest.mock('../emojiSuggestion/emojiSuggestion.slice', () => ({ emojiSuggestionSlice: {} }));
jest.mock('../eventManagement/eventManagement.slice', () => ({ eventManagementActions: {} }));
jest.mock('../messages/messages.slice', () => ({ messagesActions: {}, processQueuedLastSeenMessages: jest.fn() }));
jest.mock('../notificationSetting/notificationSettingChannel.slice', () => ({ notificationSettingActions: {} }));
jest.mock('../notificationSetting/notificationSettingClan.slice', () => ({ defaultNotificationActions: {} }));
jest.mock('../policies/policies.slice', () => ({ policiesActions: {} }));
jest.mock('../roleclan/roleclan.slice', () => ({ rolesClanActions: {} }));
jest.mock('../settingSticker/settingSticker.slice', () => ({ settingClanStickerSlice: {}, soundEffectActions: {} }));
jest.mock('../stream/usersStream.slice', () => ({ usersStreamActions: {} }));
jest.mock('../voice/voice.slice', () => ({ voiceActions: {} }));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSocket: jest.fn(),
	ensureSession: jest.fn(),
	ensureClient: jest.fn(),
	fetchDataWithSocketFallback: jest.fn()
}));

const createClansStore = () => configureStore({ reducer: { [CLANS_FEATURE_KEY]: clansReducer } });

describe('selectCurrentClanProPlan', () => {
	it('returns true when the current clan entity has pro_plan: true', () => {
		const store = createClansStore();
		const proClan = mapClanToEntity({ clan_id: 'clan-pro', clan_name: 'Pro Clan', pro_plan: true } as never);
		store.dispatch(clansActions.add(proClan));
		store.dispatch(clansActions.setCurrentClanId('clan-pro'));

		expect(selectCurrentClanProPlan(store.getState())).toBe(true);
	});

	it('returns false when pro_plan is false or absent', () => {
		const store = createClansStore();
		store.dispatch(clansActions.add(mapClanToEntity({ clan_id: 'clan-false', clan_name: 'False', pro_plan: false } as never)));
		store.dispatch(clansActions.add(mapClanToEntity({ clan_id: 'clan-absent', clan_name: 'Absent' } as never)));

		store.dispatch(clansActions.setCurrentClanId('clan-false'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);

		store.dispatch(clansActions.setCurrentClanId('clan-absent'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);
	});

	it('returns false when there is no current clan or the current clan is missing', () => {
		const store = createClansStore();
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);

		store.dispatch(clansActions.setCurrentClanId('missing-clan'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);

		store.dispatch(clansActions.setCurrentClanId('0'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);
	});

	it('follows the active clan when switching between Pro and non-Pro clans', () => {
		const store = createClansStore();
		store.dispatch(clansActions.add(mapClanToEntity({ clan_id: 'clan-1', clan_name: 'One', pro_plan: true } as never)));
		store.dispatch(clansActions.add(mapClanToEntity({ clan_id: 'clan-2', clan_name: 'Two', pro_plan: false } as never)));

		store.dispatch(clansActions.setCurrentClanId('clan-1'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(true);

		store.dispatch(clansActions.setCurrentClanId('clan-2'));
		expect(selectCurrentClanProPlan(store.getState())).toBe(false);
	});

	it('keeps pro_plan: true on an existing Pro clan when clansActions.update runs without pro_plan', () => {
		const store = createClansStore();
		store.dispatch(clansActions.add(mapClanToEntity({ clan_id: 'clan-pro', clan_name: 'Pro Clan', pro_plan: true } as never)));
		store.dispatch(clansActions.setCurrentClanId('clan-pro'));

		store.dispatch(
			clansActions.update({
				dataUpdate: {
					clan_id: 'clan-pro',
					clan_name: 'Renamed Pro Clan',
					logo: '',
					banner: '',
					status: 1,
					is_onboarding: false,
					welcome_channel_id: '0',
					onboarding_banner: '',
					about: '',
					prevent_anonymous: false
				}
			})
		);

		const updatedClan = store.getState()[CLANS_FEATURE_KEY].entities['clan-pro'] as { clan_name?: string; pro_plan?: boolean } | undefined;
		expect(updatedClan?.clan_name).toBe('Renamed Pro Clan');
		expect(updatedClan?.pro_plan).toBe(true);
		expect(selectCurrentClanProPlan(store.getState())).toBe(true);
	});
});
