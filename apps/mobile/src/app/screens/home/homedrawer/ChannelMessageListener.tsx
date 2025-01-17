import { useAuth } from '@mezon/core';
import { ActionEmitEvent, changeClan, getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import {
	channelsActions,
	ChannelsEntity,
	getStoreAsync,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDmGroupCurrentId,
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
import { EMessageBSToShow } from './enums';

const ChannelMessageListener = React.memo(() => {
	const usersClan = useSelector(selectAllUserClans);
	const rolesInClan = useSelector(selectAllRolesClan);
	const clanId = useSelector(selectCurrentClanId);
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const currentClanId = currentDirectId ? '0' : clanId;
	const navigation = useNavigation<any>();
	const playStream = useSelector(selectStatusStream);
	const dispatch = useAppDispatch();
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const { handleChannelClick, disconnect } = useWebRTCStream();
	const { userProfile } = useAuth();

	const onMention = useCallback(
		async (mentionedUser: string) => {
			try {
				const tagName = mentionedUser?.slice(1);
				const clanUser = usersClan?.find((userClan) => tagName === userClan?.user?.username);
				const isRoleMention = rolesInClan?.some((role) => tagName === role?.id);
				if (!mentionedUser || tagName === 'here' || isRoleMention) return;
				DeviceEventEmitter.emit(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, {
					type: EMessageBSToShow.UserInformation,
					user: clanUser?.user
				});
			} catch (error) {
				/* empty */
			}
		},
		[usersClan, rolesInClan]
	);

	const onChannelMention = useCallback(
		async (channel: ChannelsEntity) => {
			try {
				const type = channel?.type;
				const channelId = channel?.channel_id;
				const clanId = channel?.clan_id;

				if (type === ChannelType.CHANNEL_TYPE_VOICE && channel?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
					await Linking.openURL(urlVoice);
				} else if ([ChannelType.CHANNEL_TYPE_CHANNEL, ChannelType.CHANNEL_TYPE_THREAD, ChannelType.CHANNEL_TYPE_STREAMING].includes(type)) {
					if (type === ChannelType.CHANNEL_TYPE_STREAMING) {
						if (currentStreamInfo?.streamId !== channel?.id || (!playStream && currentStreamInfo?.streamId === channel?.id)) {
							disconnect();
							handleChannelClick(
								channel?.clan_id as string,
								channel?.channel_id as string,
								userProfile?.user?.id as string,
								channel?.channel_id as string,
								userProfile?.user?.username as string
							);
							dispatch(
								videoStreamActions.startStream({
									clanId: channel?.clan_id || '',
									clanName: channel?.clan_name || '',
									streamId: channel?.channel_id || '',
									streamName: channel?.channel_label || '',
									parentId: channel?.parrent_id || ''
								})
							);
						}
					} else {
						navigation.navigate(APP_SCREEN.HOME_DEFAULT);
					}
					if (currentClanId !== clanId) {
						changeClan(clanId);
					}
					DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
						isFetchMemberChannelDM: true
					});
					const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
					save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
					await jumpToChannel(channelId, clanId);
				}
			} catch (error) {
				/* empty */
			}
		},
		[currentClanId, dispatch, navigation, playStream]
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
