import { useAuth } from '@mezon/core';
import { ActionEmitEvent, changeClan, getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import {
	channelsActions,
	ChannelsEntity,
	directActions,
	getStore,
	getStoreAsync,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDmGroupCurrentId,
	selectGrouplMembers,
	selectSession,
	selectStatusStream,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Linking, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useWebRTCStream } from '../../../components/StreamContext/StreamContext';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../utils/helpers';
import UserProfile from './components/UserProfile';

const ChannelMessageListener = React.memo(() => {
	const store = getStore();
	const navigation = useNavigation<any>();
	const dispatch = useAppDispatch();
	const { handleChannelClick, disconnect } = useWebRTCStream();
	const { userProfile } = useAuth();
	const sessionUser = useSelector(selectSession);

	const onMention = useCallback(
		async (mentionedUser: string) => {
			try {
				const tagName = mentionedUser?.slice(1);
				let listUser = [];
				const currentDirectId = selectDmGroupCurrentId(store.getState());
				if (!!currentDirectId && currentDirectId !== '0') {
					listUser = selectGrouplMembers(store.getState(), currentDirectId);
				} else {
					listUser = selectAllUserClans(store.getState());
				}
				const rolesInClan = selectAllRolesClan(store.getState());

				const clanUser = listUser?.find((userClan) => tagName === userClan?.user?.username);
				const isRoleMention = rolesInClan?.some((role) => tagName === role?.id);
				if (!mentionedUser || tagName === 'here' || isRoleMention) return;
				const data = {
					snapPoints: ['50%', '80%'],
					hiddenHeaderIndicator: true,
					children: <UserProfile userId={clanUser?.user?.id} user={clanUser?.user} directId={currentDirectId} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			} catch (error) {
				/* empty */
			}
		},
		[store]
	);

	const onChannelMention = useCallback(
		async (channel: ChannelsEntity) => {
			try {
				const type = channel?.type;
				const channelId = channel?.channel_id;
				const clanId = channel?.clan_id;
				const clanIdStore = selectCurrentClanId(store.getState());
				const currentDirectId = selectDmGroupCurrentId(store.getState());
				const currentClanId = currentDirectId ? '0' : clanIdStore;

				if (type === ChannelType.CHANNEL_TYPE_GMEET_VOICE && channel?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
					await Linking.openURL(urlVoice);
				} else if (type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && channel?.meeting_code) {
					const data = {
						channelId: channelId || '',
						roomName: channel?.meeting_code,
						clanId: clanId
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);
				} else if (
					[
						ChannelType.CHANNEL_TYPE_CHANNEL,
						ChannelType.CHANNEL_TYPE_THREAD,
						ChannelType.CHANNEL_TYPE_STREAMING,
						ChannelType.CHANNEL_TYPE_APP
					].includes(type)
				) {
					const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
					save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
					await jumpToChannel(channelId, clanId);
					if (type === ChannelType.CHANNEL_TYPE_STREAMING) {
						const currentStreamInfo = selectCurrentStreamInfo(store.getState());
						const playStream = selectStatusStream(store.getState());
						if (currentStreamInfo?.streamId !== channel?.id || (!playStream && currentStreamInfo?.streamId === channel?.id)) {
							disconnect();
							handleChannelClick(
								channel?.clan_id as string,
								channel?.channel_id as string,
								userProfile?.user?.id as string,
								channel?.channel_id as string,
								userProfile?.user?.username as string,
								sessionUser?.token
							);
							dispatch(
								videoStreamActions.startStream({
									clanId: channel?.clan_id || '',
									clanName: channel?.clan_name || '',
									streamId: channel?.channel_id || '',
									streamName: channel?.channel_label || '',
									parentId: channel?.parent_id || ''
								})
							);
						}
					} else {
						if (currentDirectId) {
							dispatch(directActions.setDmGroupCurrentId(''));
							navigation.navigate(APP_SCREEN.HOME_DEFAULT);
						}
					}
					if (currentClanId !== clanId) {
						changeClan(clanId);
					}
					DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
						isFetchMemberChannelDM: true
					});
				}
			} catch (error) {
				/* empty */
			}
		},
		[disconnect, dispatch, handleChannelClick, navigation, store, userProfile?.user?.id, userProfile?.user?.username]
	);

	useEffect(() => {
		const eventOnMention = DeviceEventEmitter.addListener(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, onMention);
		const eventOnChannelMention = DeviceEventEmitter.addListener(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, onChannelMention);

		return () => {
			eventOnMention.remove();
			eventOnChannelMention.remove();
		};
	}, [onChannelMention, onMention]);

	const jumpToChannel = async (channelId: string, clanId: string) => {
		const store = await getStoreAsync();
		store.dispatch(
			channelsActions.joinChannel({
				clanId,
				channelId,
				noFetchMembers: false,
				noCache: true
			})
		);
	};
	return <View />;
});

export default ChannelMessageListener;
