import {
	Icons,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	getUpdateOrAddClanChannelCache,
	load,
	save
} from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	getStoreAsync,
	selectIsUnreadChannelById,
	selectLastChannelTimestamp,
	selectNotificationMentionCountByChannelId,
	selectVoiceChannelMembersByChannelId,
} from '@mezon/store-mobile';
import { ChannelStatusEnum, ChannelThreads, IChannel } from '@mezon/utils';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { linkGoogleMeet } from '../../../../../../utils/helpers';
import ListChannelThread from '../ChannelListThread';
import UserListVoiceChannel from '../ChannelListUserVoice';
import { style } from './styles';

function useChannelBadgeCount(channelId: string) {
	const lastChannelTimestamp = useSelector(selectLastChannelTimestamp(channelId));
	const numberNotification = useSelector(selectNotificationMentionCountByChannelId(channelId, lastChannelTimestamp));

	return numberNotification;
}

interface IChannelListItemProps {
	data: any;
	image?: string;
	isActive: boolean;
	currentChanel: IChannel;
	onLongPress: () => void;
	onLongPressThread?: (thread: ChannelThreads) => void;
}

export enum StatusVoiceChannel {
	Active = 1,
	No_Active = 0,
}

export const ChannelListItem = React.memo((props: IChannelListItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const isUnRead = useSelector(selectIsUnreadChannelById(props?.data?.id));
	const voiceChannelMember = useSelector(selectVoiceChannelMembersByChannelId(props?.data?.channel_id));
	const numberNotification = useChannelBadgeCount(props.data?.channel_id);
	const timeoutRef = useRef<any>();
	const navigation = useNavigation();

	useEffect(() => {
		return () => {
			timeoutRef.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	const handleRouteData = async (thread?: IChannel) => {
		if (props?.data?.type === ChannelType.CHANNEL_TYPE_VOICE) {
			if (props?.data?.status === StatusVoiceChannel.Active && props?.data?.meeting_code) {
				const urlVoice = `${linkGoogleMeet}${props?.data?.meeting_code}`;
				await Linking.openURL(urlVoice);
				return;
			}
		} else {
			navigation.dispatch(DrawerActions.closeDrawer());
			const channelId = thread ? thread?.channel_id : props?.data?.channel_id;
			const clanId = thread ? thread?.clan_id : props?.data?.clan_id;
			const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
			const store = await getStoreAsync();
			
			await Promise.all([
				store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false })),
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave)
			]);
			
			const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
			if (!channelsCache?.includes(channelId)) {
				save(STORAGE_CHANNEL_CURRENT_CACHE, [...channelsCache, channelId]);
			}
		}
	};

	return (
		<View>
			<TouchableOpacity
				activeOpacity={1}
				onPress={() => handleRouteData()}
				onLongPress={props.onLongPress}
				style={[styles.channelListLink, props.isActive && styles.channelListItemActive]}
			>
				<View style={[styles.channelListItem]}>
					{isUnRead && <View style={styles.dotIsNew} />}

					{props?.data?.channel_private === ChannelStatusEnum.isPrivate && props?.data?.type === ChannelType.CHANNEL_TYPE_VOICE && (
						<Icons.VoiceLockIcon width={16} height={16} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
					)}
					{props?.data?.channel_private === ChannelStatusEnum.isPrivate && props?.data?.type === ChannelType.CHANNEL_TYPE_TEXT && (
						<Icons.TextLockIcon width={16} height={16} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
					)}
					{props?.data?.channel_private === undefined && props?.data?.type === ChannelType.CHANNEL_TYPE_VOICE && (
						<Icons.VoiceNormalIcon width={16} height={16} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
					)}
					{props?.data?.channel_private === undefined && props?.data?.type === ChannelType.CHANNEL_TYPE_TEXT && (
						<Icons.TextIcon width={16} height={16} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
					)}

					<Text style={[styles.channelListItemTitle, isUnRead && styles.channelListItemTitleActive]} numberOfLines={1}>
						{props.data.channel_label}
					</Text>
				</View>
				{props?.data?.type === ChannelType.CHANNEL_TYPE_VOICE && props?.data?.status === StatusVoiceChannel.No_Active && (
					<ActivityIndicator color={themeValue.white} />
				)}

				{numberNotification > 0 && (
					<View style={styles.channelDotWrapper}>
						<Text style={styles.channelDot}>{numberNotification}</Text>
					</View>
				)}
			</TouchableOpacity>

			{!!props?.data?.threads?.length && (
				<ListChannelThread threads={props?.data?.threads} currentChanel={props.currentChanel} onPress={handleRouteData} onLongPress={props?.onLongPressThread} />
			)}
			{!!voiceChannelMember?.length && <UserListVoiceChannel userListVoice={voiceChannelMember} />}
		</View>
	);
});
