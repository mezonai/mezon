import { size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import { directActions, selectDirectById, selectDirectsUnreadlist, selectIsLoadDMData, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../components/ImageNative';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
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
						{dm?.avatars?.[0] ? (
							<FastImage
								source={{
									uri: createImgproxyUrl(dm?.avatars?.[0] ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								resizeMode="cover"
								style={styles.dmAvatar}
							/>
						) : (
							<View style={styles.wrapperTextAvatar}>
								<Text style={styles.textAvatar}>{dm?.channelLabel?.charAt?.(0)}</Text>
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
						{dm?.channel_avatar && !dm?.channel_avatar?.includes('avatar-group.png') ? (
							<View style={styles.groupAvatarWrapper}>
								<ImageNative url={createImgproxyUrl(dm?.channel_avatar ?? '')} style={styles.imageFull} resizeMode={'cover'} />
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
			await dispatch(directActions.setDmGroupCurrentId(dm?.channelId));
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
		} else {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: dm?.channelId, from: APP_SCREEN.HOME });
		}
	};

	return (
		<TouchableOpacity onPress={navigateToDirectMessageMDetail} style={[styles.mt10]}>
			<View>{getBadge(dm)}</View>
		</TouchableOpacity>
	);
});

const UnreadDMLoading = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const unReadDM = useSelector(selectDirectsUnreadlist);
	const isLoading = useSelector(selectIsLoadDMData);
	const opacity = useRef(new Animated.Value(!isLoading ? 1 : 0)).current;
	const containerHeight = useRef(new Animated.Value(!isLoading ? size.s_50 : 0)).current;
	const listOpacity = useRef(new Animated.Value(0)).current;
	const listTranslateY = useRef(new Animated.Value(20)).current;
	const [showData, setShowData] = useState(false);

	useEffect(() => {
		Animated.timing(opacity, {
			toValue: isLoading ? 0 : 1,
			duration: 300,
			useNativeDriver: true
		}).start();

		Animated.timing(containerHeight, {
			toValue: isLoading ? 0 : size.s_50,
			duration: 300,
			delay: isLoading ? 150 : 0,
			useNativeDriver: false
		}).start(async () => {
			await sleep(500);
			setShowData(true);
		});

		if (isLoading) {
			setShowData(false);
			// Reset list animation values
			listOpacity.setValue(0);
			listTranslateY.setValue(20);
		}
	}, [isLoading, opacity, containerHeight, listOpacity, listTranslateY]);

	useEffect(() => {
		if (showData) {
			Animated.parallel([
				Animated.timing(listOpacity, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true
				}),
				Animated.timing(listTranslateY, {
					toValue: 0,
					duration: 400,
					useNativeDriver: true
				})
			]).start();
		}
	}, [showData, listOpacity, listTranslateY]);

	return (
		<View style={[styles.container, !!unReadDM?.length && styles.containerBottom]}>
			<Animated.View style={[styles.animatedContainer, { height: containerHeight }]}>
				<Animated.View style={[styles.animatedInner, { opacity }]}>
					<Flow color={themeValue.textDisabled} size={size.s_30} />
				</Animated.View>
			</Animated.View>
			{showData &&
				!!unReadDM?.length &&
				unReadDM?.map((dm: DirectEntity, index) => {
					return <UnreadDMBadgeItem key={`${dm?.id}_${index}`} dmId={dm?.id} numUnread={dm?.count_mess_unread || 0} />;
				})}
			{showData && !!unReadDM?.length && <View style={styles.lineBottom} />}
		</View>
	);
});

export const UnreadDMBadgeList = UnreadDMLoading;
