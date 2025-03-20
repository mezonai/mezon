import { useAuth, useFriends, useMemberStatus } from '@mezon/core';
import { ActionEmitEvent, CheckIcon, DisturbStatusIcon, Icons, IdleStatusIcon, OfflineStatus, OnlineStatus } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	FriendsEntity,
	channelMembersActions,
	selectAccountCustomStatus,
	selectCurrentClanId,
	selectUserStatus,
	useAppDispatch
} from '@mezon/store-mobile';
import { createImgproxyUrl, formatNumber } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../componentUI/MezonAvatar';
import { MezonButton } from '../../componentUI/MezonButton';
import { AddStatusUserModal } from '../../components/AddStatusUserModal';
import { CustomStatusUser, EUserStatus } from '../../components/CustomStatusUser';
import { SendTokenUser } from '../../components/SendTokenUser';
import { useMixImageColor } from '../../hooks/useMixImageColor';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

export enum ETypeCustomUserStatus {
	Save = 'Save',
	Close = 'Close'
}

const ProfileScreen = ({ navigation }: { navigation: any }) => {
	const isTabletLandscape = useTabletLandscape();
	const user = useAuth();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const { friends: allUser } = useFriends();
	const { color } = useMixImageColor(user?.userProfile?.user?.avatar_url);
	const { t } = useTranslation('profile');
	const { t: tUser } = useTranslation('customUserStatus');
	const [isVisibleAddStatusUserModal, setIsVisibleAddStatusUserModal] = useState<boolean>(false);
	const userCustomStatus = useSelector(selectAccountCustomStatus);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const memberStatus = useMemberStatus(user?.userId || '');
	const userStatus = useSelector(selectUserStatus);

	const userStatusIcon = useMemo(() => {
		const mobileIconSize = isTabletLandscape ? size.s_20 : size.s_18;
		switch (userStatus?.status) {
			case EUserStatus.ONLINE:
				if (memberStatus?.isMobile) {
					return <Icons.IconMobileDevice width={mobileIconSize} height={mobileIconSize} />;
				}
				return memberStatus?.status ? (
					<OnlineStatus width={size.s_20} height={size.s_20} />
				) : (
					<OfflineStatus width={size.s_16} height={size.s_16} />
				);

			case EUserStatus.IDLE:
				return <IdleStatusIcon width={size.s_20} height={size.s_20} />;

			case EUserStatus.DO_NOT_DISTURB:
				return <DisturbStatusIcon />;

			case EUserStatus.INVISIBLE:
				return <OfflineStatus width={size.s_16} height={size.s_16} />;

			default:
				return <OnlineStatus width={size.s_20} height={size.s_20} />;
		}
	}, [isTabletLandscape, memberStatus, userStatus]);

	const tokenInWallet = useMemo(() => {
		return user?.userProfile?.wallet ? safeJSONParse(user?.userProfile?.wallet || '{}')?.value : 0;
	}, [user?.userProfile?.wallet]);

	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user.state === 0);
	}, [allUser]);

	const navigateToFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.HOME });
	};
	const navigateToSettingScreen = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.HOME });
	};

	const navigateGoback = () => {
		navigation.goBack();
	};

	const navigateToProfileSetting = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.PROFILE });
	};

	const firstFriendImageList = useMemo(() => {
		return friendList?.slice?.(0, 5)?.map((friend) => ({
			avatarUrl: friend?.user?.avatar_url,
			username: friend?.user?.username || friend?.user?.display_name
		}));
	}, [friendList]);

	const memberSince = useMemo(() => {
		return moment(user?.userProfile?.user?.create_time).format('MMM DD, YYYY');
	}, [user]);

	const handlePressSetCustomStatus = () => {
		setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal);
	};

	const handleCustomUserStatus = (customStatus = '', type: ETypeCustomUserStatus, duration?: number, noClearStatus?: boolean) => {
		setIsVisibleAddStatusUserModal(false);
		dispatch(
			channelMembersActions.updateCustomStatus({
				clanId: currentClanId ?? '',
				customStatus: customStatus,
				minutes: duration,
				noClear: noClearStatus
			})
		);
	};

	const showUserStatusBottomSheet = () => {
		const data = {
			heightFitContent: true,
			title: tUser('changeOnlineStatus'),
			children: (
				<CustomStatusUser
					userCustomStatus={userCustomStatus}
					onPressSetCustomStatus={handlePressSetCustomStatus}
					handleCustomUserStatus={handleCustomUserStatus}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const showSendTokenBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <SendTokenUser />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={styles.container}>
			<View style={[styles.containerBackground, { backgroundColor: color }]}>
				<View style={[styles.backgroundListIcon, isTabletLandscape && { justifyContent: 'space-between' }]}>
					{isTabletLandscape && (
						<TouchableOpacity style={styles.backgroundSetting} onPress={navigateGoback}>
							<Icons.ChevronSmallLeftIcon height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						</TouchableOpacity>
					)}
					<TouchableOpacity style={styles.backgroundSetting} onPress={() => navigateToSettingScreen()}>
						<Icons.SettingsIcon height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
					</TouchableOpacity>
				</View>

				<TouchableOpacity onPress={showUserStatusBottomSheet} style={styles.viewImageProfile}>
					{user?.userProfile?.user?.avatar_url ? (
						isTabletLandscape ? (
							<Image
								source={{
									uri: createImgproxyUrl(user?.userProfile?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })
								}}
								style={styles.imgWrapper}
							/>
						) : (
							<FastImage
								source={{
									uri: createImgproxyUrl(user?.userProfile?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })
								}}
								style={styles.imgWrapper}
							/>
						)
					) : (
						<View
							style={{
								backgroundColor: themeValue.colorAvatarDefault,
								overflow: 'hidden',
								width: '100%',
								height: '100%',
								borderRadius: isTabletLandscape ? size.s_70 : size.s_50,
								alignItems: 'center',
								justifyContent: 'center'
							}}
						>
							<Text style={styles.textAvatar}>{user?.userProfile?.user?.username?.charAt?.(0)?.toUpperCase()}</Text>
						</View>
					)}

					<View
						style={[
							{
								backgroundColor: themeValue.tertiary,
								borderRadius: size.s_20,
								position: 'absolute',
								bottom: -size.s_2,
								right: -size.s_4
							},
							styles.dotStatusUser
						]}
					>
						{userStatusIcon}
					</View>
				</TouchableOpacity>
			</View>

			{isTabletLandscape && (
				<View style={styles.buttonListLandscape}>
					<MezonButton viewContainerStyle={styles.button} onPress={() => setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal)}>
						<Icons.ChatIcon height={size.s_20} width={size.s_20} color={'white'} />
						<Text style={styles.whiteText}>{t('addStatus')}</Text>
					</MezonButton>

					<MezonButton viewContainerStyle={styles.button} onPress={() => navigateToProfileSetting()}>
						<Icons.PencilIcon height={size.s_18} width={size.s_18} color={'white'} />
						<Text style={styles.whiteText}>{t('editStatus')}</Text>
					</MezonButton>
				</View>
			)}

			<ScrollView style={styles.contentWrapper}>
				<View style={styles.contentContainer}>
					{!!user?.userProfile?.user?.display_name && (
						<TouchableOpacity style={styles.viewInfo} onPress={showUserStatusBottomSheet}>
							<Text style={styles.textName}>{user?.userProfile?.user?.display_name}</Text>
							<Icons.ChevronSmallDownIcon height={size.s_18} width={size.s_18} color={themeValue.text} />
						</TouchableOpacity>
					)}
					<Text style={styles.text}>{user?.userProfile?.user?.username}</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10, marginTop: size.s_10 }}>
						<CheckIcon width={size.s_14} height={size.s_14} color={Colors.azureBlue} />
						<TouchableOpacity style={styles.token} onPress={showSendTokenBottomSheet}>
							<Text
								style={styles.text}
							>{`${t('token')} ${tokenInWallet ? formatNumber(Number(tokenInWallet), 'vi-VN', 'VND') : '0'}`}</Text>
						</TouchableOpacity>
					</View>
					{userCustomStatus ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<TouchableOpacity
								onPress={() => setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal)}
								style={styles.customUserStatusBtn}
							>
								<Text style={styles.text}>{userCustomStatus}</Text>
							</TouchableOpacity>
							<Pressable onPress={() => handleCustomUserStatus('', ETypeCustomUserStatus.Close)} style={styles.closeBtnUserStatus}>
								<Icons.CircleXIcon height={size.s_18} width={size.s_18} color={themeValue.text} />
							</Pressable>
						</View>
					) : null}
					{!isTabletLandscape && (
						<View style={styles.buttonList}>
							<MezonButton
								viewContainerStyle={styles.button}
								onPress={() => setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal)}
							>
								<Icons.ChatIcon height={size.s_20} width={size.s_20} color={'white'} />
								<Text style={styles.whiteText}>{t('addStatus')}</Text>
							</MezonButton>

							<MezonButton viewContainerStyle={styles.button} onPress={() => navigateToProfileSetting()}>
								<Icons.PencilIcon height={size.s_18} width={size.s_18} color={'white'} />
								<Text style={styles.whiteText}>{t('editStatus')}</Text>
							</MezonButton>
						</View>
					)}
				</View>

				<View style={styles.contentContainer}>
					<View style={{ gap: size.s_20 }}>
						{user?.userProfile?.user?.about_me ? (
							<View>
								<Text style={styles.textTitle}>{t('aboutMe')}</Text>
								<Text style={styles.text}>{user?.userProfile?.user?.about_me}</Text>
							</View>
						) : null}

						<View>
							<Text style={styles.textTitle}>{t('mezonMemberSince')}</Text>
							<Text style={styles.text}>{memberSince}</Text>
						</View>
					</View>
				</View>

				<TouchableOpacity style={[styles.contentContainer, styles.imgList]} onPress={() => navigateToFriendScreen()}>
					<Text style={styles.textTitle}>{t('yourFriend')}</Text>

					<MezonAvatar avatarUrl="" username="" height={size.s_30} width={size.s_30} stacks={firstFriendImageList} />
					<Icons.ChevronSmallRightIcon
						width={size.s_18}
						height={size.s_18}
						style={{ marginLeft: size.s_4 }}
						color={themeValue.textStrong}
					/>
				</TouchableOpacity>
			</ScrollView>
			<AddStatusUserModal
				userCustomStatus={userCustomStatus}
				isVisible={isVisibleAddStatusUserModal}
				setIsVisible={(value) => {
					setIsVisibleAddStatusUserModal(value);
				}}
				handleCustomUserStatus={handleCustomUserStatus}
			/>
		</View>
	);
};

export default ProfileScreen;
