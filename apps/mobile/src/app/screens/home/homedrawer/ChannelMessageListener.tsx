import {
	ActionEmitEvent,
	changeClan,
	getUpdateOrAddClanChannelCache,
	save,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_PREVIOUS_CHANNEL
} from '@mezon/mobile-components';
import {
	channelsActions,
	ChannelsEntity,
	getStoreAsync,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentChannel,
	selectCurrentClanId
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Linking, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../utils/helpers';
import { EMessageBSToShow } from './enums';
import { IMessageActionPayload } from './types';

type ChannelMessageListenerProps = {
	onMessageAction?: (payload: IMessageActionPayload) => void;
};

const ChannelMessageListener = React.memo(({ onMessageAction }: ChannelMessageListenerProps) => {
	const usersClan = useSelector(selectAllUserClans);
	const rolesInClan = useSelector(selectAllRolesClan);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const navigation = useNavigation<any>();

	const onMention = useCallback(
		async (mentionedUser: string) => {
			try {
				const tagName = mentionedUser?.slice(1);
				const clanUser = usersClan?.find((userClan) => tagName === userClan?.user?.username);
				const isRoleMention = rolesInClan?.some((role) => tagName === role?.id);
				if (!mentionedUser || tagName === 'here' || isRoleMention) return;
				onMessageAction({
					type: EMessageBSToShow.UserInformation,
					user: clanUser?.user
				});
			} catch (error) {
				/* empty */
			}
		},
		[usersClan, rolesInClan, onMessageAction]
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
				} else if ([ChannelType.CHANNEL_TYPE_TEXT, ChannelType.CHANNEL_TYPE_STREAMING].includes(type)) {
					if (type === ChannelType.CHANNEL_TYPE_STREAMING) {
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.STREAMING_ROOM
						});
						save(STORAGE_PREVIOUS_CHANNEL, currentChannel);
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
		[currentChannel, currentClanId, navigation]
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
				noFetchMembers: false
			})
		);
	};
	return <View />;
});

export default ChannelMessageListener;
