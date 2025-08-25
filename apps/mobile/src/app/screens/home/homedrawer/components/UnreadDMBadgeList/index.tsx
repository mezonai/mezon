import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	directActions,
	selectDirectById,
	selectDirectsUnreadlist,
	selectIsLoadDMData,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import ImageNative from 'apps/mobile/src/app/components/ImageNative';
import { ChannelType } from 'mezon-js';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Circle } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../app/navigation/ScreenTypes';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

const UnreadDMBadgeItem = memo(({ dmId, numUnread }: { dmId: string; numUnread: number }) => {
	const dm = useAppSelector((state) => selectDirectById(state, dmId)) || ({} as DirectEntity);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
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
								<Text style={styles.badgeText}>{numUnread > 99 ? '99+' : numUnread || ''}</Text>
							</View>
						)}
					</View>
				);
			case ChannelType.CHANNEL_TYPE_GROUP:
				return (
					<View style={styles.avatarWrapper}>
						{dm?.topic && !dm?.topic?.includes('avatar-group.png') ? (
							<View style={styles.groupAvatarWrapper}>
								<ImageNative
									url={createImgproxyUrl(dm?.topic ?? '')}
									style={{ width: '100%', height: '100%' }}
									resizeMode={'cover'}
								/>
							</View>
						) : (
							<View style={styles.groupAvatar}>
								<MezonIconCDN icon={IconCDN.userGroupIcon} />
							</View>
						)}

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

	const navigateToDirectMessageMDetail = async () => {
		if (isTabletLandscape) {
			await dispatch(directActions.setDmGroupCurrentId(dm?.channel_id));
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
		} else {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: dm?.channel_id, from: APP_SCREEN.HOME });
		}
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
	const isLoading = useSelector(selectIsLoadDMData);
	return (
		<View style={[styles.container, !!unReadDM?.length && styles.containerBottom]}>
			{!isLoading && (
				<View style={{ paddingVertical: size.s_20 }}>
					<Circle color={themeValue.textDisabled} size={size.s_42} />
				</View>
			)}
			{!!unReadDM?.length &&
				unReadDM?.map((dm: DirectEntity, index) => {
					return <UnreadDMBadgeItem key={`${dm?.id}_${index}`} dmId={dm?.id} numUnread={dm?.count_mess_unread || 0} />;
				})}
			{!!unReadDM?.length && <View style={styles.lineBottom} />}
		</View>
	);
});
