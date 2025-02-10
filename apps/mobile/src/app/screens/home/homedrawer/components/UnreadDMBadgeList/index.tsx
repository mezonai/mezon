import { UserGroupIcon } from '@mezon/mobile-components';
import { Block, useTheme } from '@mezon/mobile-ui';
import { DirectEntity, selectDirectById, selectDirectsUnreadlist, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../../../../app/navigation/ScreenTypes';
import { style } from './styles';

const UnreadDMBadgeItem = memo(({ dmId, numUnread }: { dmId: string; numUnread: number }) => {
	const dm = useAppSelector((state) => selectDirectById(state, dmId)) || ({} as DirectEntity);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const getBadge = (dm: DirectEntity) => {
		switch (dm.type) {
			case ChannelType.CHANNEL_TYPE_DM:
				return (
					<View style={styles.avatarWrapper}>
						{dm?.channel_avatar?.[0] ? (
							<FastImage
								source={{
									uri: createImgproxyUrl(dm?.channel_avatar?.[0] ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								resizeMode="cover"
								style={styles.groupAvatar}
							/>
						) : (
							<View style={styles.wrapperTextAvatar}>
								<Text style={styles.textAvatar}>{dm?.channel_label?.charAt?.(0)}</Text>
							</View>
						)}
						{numUnread > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{numUnread || ''}</Text>
							</View>
						)}
					</View>
				);
			case ChannelType.CHANNEL_TYPE_GROUP:
				return (
					<View style={styles.groupAvatar}>
						<UserGroupIcon />
						{numUnread > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{numUnread}</Text>
							</View>
						)}
					</View>
				);
			default:
				return <View />;
		}
	};

	const navigateToDirectMessageMDetail = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: dm?.channel_id, from: APP_SCREEN.HOME });
	};

	return (
		<TouchableOpacity onPress={navigateToDirectMessageMDetail} style={[styles.mt10]}>
			<View>{getBadge(dm)}</View>
		</TouchableOpacity>
	);
});

export const UnreadDMBadgeList = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const unReadDM = useSelector(selectDirectsUnreadlist);
	return (
		<View style={[styles.container, !!unReadDM?.length && styles.containerBottom]}>
			{!!unReadDM?.length &&
				unReadDM?.map((dm: DirectEntity, index) => {
					return <UnreadDMBadgeItem key={`${dm?.id}_${index}`} dmId={dm?.id} numUnread={dm?.count_mess_unread || 0} />;
				})}
			{!!unReadDM?.length && <Block style={styles.lineBottom} />}
		</View>
	);
});
