import { useMemberStatus } from '@mezon/core';
import { ActionEmitEvent, Icons, OverflowMenuHorizontalIcon } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { selectDmGroupCurrent, selectMemberClanByUserId2 } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { memo, useContext, useMemo } from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import MenuCustomDm from '../../MenuCustomDm';
import { threadDetailContext } from '../MenuThreadDetail';
import { style } from './styles';

export const ThreadHeader = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useContext(threadDetailContext);
	const currentDmGroup = useSelector(selectDmGroupCurrent(currentChannel?.id ?? ''));
	const isTabletLandscape = useTabletLandscape();

	const isDMThread = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);
	const userStatus = useMemberStatus(currentChannel?.user_id?.length === 1 ? currentChannel?.user_id[0] : '');

	const user = useSelector((state) => selectMemberClanByUserId2(state, currentChannel?.user_id?.length === 1 ? currentChannel?.user_id[0] : ''));
	const status = getUserStatusByMetadata(user?.user?.metadata);

	const navigation = useNavigation<any>();
	const openMenu = () => {
		const data = {
			heightFitContent: true,
			children: <MenuCustomDm currentChannel={currentChannel} channelLabel={channelLabel} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};
	const channelLabel = useMemo(() => {
		return (currentDmGroup?.channel_label ||
			currentChannel?.channel_label ||
			(typeof currentChannel?.usernames === 'string' ? currentChannel?.usernames : currentChannel?.usernames?.[0] || 'defaultLabel')) as string;
	}, [currentDmGroup?.channel_label, currentChannel?.channel_label, currentChannel?.usernames]);

	const isChannel = useMemo(() => {
		return !!currentChannel?.channel_label && !Number(currentChannel?.parent_id);
	}, [currentChannel?.channel_label, currentChannel?.parent_id]);

	const handlebackMessageDetail = () => {
		if (isDMThread && !isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: currentChannel?.id });
		} else {
			navigation.goBack();
		}
	};

	const isAgeRestrictedChannel = useMemo(() => {
		return currentChannel?.age_restricted === 1;
	}, [currentChannel?.age_restricted]);

	const renderChannelIcon = () => {
		const isPrivateChannel = currentChannel?.channel_private === ChannelStatusEnum.isPrivate;
		const isTextOrThreadChannel = [ChannelType.CHANNEL_TYPE_CHANNEL, ChannelType.CHANNEL_TYPE_THREAD].includes(currentChannel?.type);
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
			return <Icons.HashtagWarning width={20} height={20} color={themeValue.text} />;
		}
		if (isPrivateChannel && isTextOrThreadChannel) {
			return isChannel ? (
				<Icons.TextLockIcon width={20} height={20} color={themeValue.text} />
			) : (
				<Icons.ThreadLockIcon width={20} height={20} color={themeValue.text} />
			);
		}

		return isChannel ? (
			<Icons.TextIcon width={20} height={20} color={themeValue.text} />
		) : (
			<Icons.ThreadIcon width={20} height={20} color={themeValue.text} />
		);
	};

	return (
		<View style={styles.channelLabelWrapper}>
			<TouchableOpacity style={styles.iconBackHeader} onPress={handlebackMessageDetail}>
				<Icons.ArrowLargeLeftIcon color={themeValue.text} height={20} width={20} />
			</TouchableOpacity>

			{isDMThread ? (
				<View style={styles.avatarWrapper}>
					<View>
						{currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP ? (
							<View style={[styles.groupAvatar, styles.avatarSize]}>
								<Icons.GroupIcon color={baseColor.white} />
							</View>
						) : (
							<MezonAvatar
								avatarUrl={currentChannel?.channel_avatar?.[0]}
								username={channelLabel}
								userStatus={userStatus}
								customStatus={status}
							/>
						)}
					</View>
					<Text numberOfLines={5} style={styles.dmLabel}>
						{channelLabel}
					</Text>
				</View>
			) : (
				<View style={styles.channelText}>
					{renderChannelIcon()}
					<Text numberOfLines={1} style={styles.channelLabel}>
						{channelLabel}
					</Text>
				</View>
			)}
			{isDMThread && (
				<TouchableOpacity onPress={openMenu} style={styles.iconMenuHeader}>
					<OverflowMenuHorizontalIcon color={themeValue.white} />
				</TouchableOpacity>
			)}
		</View>
	);
});
