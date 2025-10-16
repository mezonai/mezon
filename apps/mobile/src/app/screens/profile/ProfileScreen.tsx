import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	FriendsEntity,
	accountActions,
	channelMembersActions,
	selectAllAccount,
	selectAllFriends,
	selectCurrentClanId,
	useAppDispatch,
	useWallet
} from '@mezon/store-mobile';
import { CURRENCY, createImgproxyUrl, formatBalanceToString } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../componentUI/MezonAvatar';
import MezonButton from '../../componentUI/MezonButton';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { AddStatusUserModal } from '../../components/AddStatusUserModal';
import { CustomStatusUser } from '../../components/CustomStatusUser';
import ImageNative from '../../components/ImageNative';
import { SendTokenUser } from '../../components/SendTokenUser';
import { IconCDN } from '../../constants/icon_cdn';
import { useMixImageColor } from '../../hooks/useMixImageColor';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import StatusProfile from './StatusProfile';
import { style } from './styles';

export enum ETypeCustomUserStatus {
	Save = 'Save',
	Close = 'Close'
}

const ProfileScreen = ({ navigation }: { navigation: any }) => {
	const isTabletLandscape = useTabletLandscape();
	const userProfile = useSelector(selectAllAccount);
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const allUser = useSelector(selectAllFriends);
	const { color } = useMixImageColor(userProfile?.user?.avatar_url);
	const { t } = useTranslation(['profile']);
	const { t: tUser } = useTranslation('customUserStatus');
	const { t: tStack } = useTranslation('screenStack');
	const [isVisibleAddStatusUserModal, setIsVisibleAddStatusUserModal] = useState<boolean>(false);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const { isEnableWallet, walletDetail, enableWallet } = useWallet();

	useFocusEffect(
		React.useCallback(() => {
			dispatch(accountActions.getUserProfile({ noCache: true }));
		}, [dispatch])
	);

	const userCustomStatus = useMemo(() => {
		return userProfile?.user?.user_status || '';
	}, [userProfile?.user?.user_status]);

	const userStatus = useMemo(() => {
		return userProfile?.user?.status || '';
	}, [userProfile?.user?.status]);

	const tokenInWallet = useMemo(() => {
		return walletDetail?.balance || 0;
	}, [walletDetail?.balance]);

	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser?.filter?.((user) => user.state === 0);
	}, [allUser]);

	const navigateToFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.HOME });
	};
	const navigateToSettingScreen = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.HOME });
	};

	const navigateToShopScreen = () => {
		navigation.navigate(APP_SCREEN.SHOP.STACK, { screen: APP_SCREEN.SHOP.HOME });
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
		return moment(userProfile?.user?.create_time).format('MMM DD, YYYY');
	}, [userProfile?.user?.create_time]);

	const handlePressSetCustomStatus = useCallback(() => {
		setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal);
	}, [isVisibleAddStatusUserModal]);

	const handleCustomUserStatus = useCallback(
		(customStatus = '', type: ETypeCustomUserStatus, duration?: number, noClearStatus?: boolean) => {
			setIsVisibleAddStatusUserModal(false);
			dispatch(
				channelMembersActions.updateCustomStatus({
					clanId: currentClanId ?? '',
					customStatus,
					minutes: duration,
					noClear: noClearStatus
				})
			);
		},
		[currentClanId, dispatch]
	);

	const showUserStatusBottomSheet = () => {
		const data = {
			heightFitContent: true,
			title: tUser('changeOnlineStatus'),
			children: (
				<CustomStatusUser
					userStatus={userStatus}
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

	const copyUserId = () => {
		const userId = userProfile?.user?.id;
		if (!userId || userId.trim() === '') {
			Toast.show({
				type: 'error',
				text1: t('emptyId')
			});
			return;
		}
		try {
			Clipboard.setString(userId);
			Toast.show({
				type: 'success',
				props: {
					text2: t('copySuccess'),
					leadingIcon: <MezonIconCDN icon={IconCDN.linkIcon} color={baseColor.link} />
				}
			});
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('errorCopy', { error })
			});
		}
	};

	return (
		<View style={styles.container}>
			<View style={[styles.containerBackground, { backgroundColor: color }]}>
				<View style={[styles.backgroundListIcon, isTabletLandscape && { justifyContent: 'space-between' }]}>
					{isTabletLandscape && (
						<TouchableOpacity style={styles.backgroundSetting} onPress={navigateGoback}>
							<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						</TouchableOpacity>
					)}
					<View style={{ flexDirection: 'row', gap: size.s_10 }}>
						<TouchableOpacity style={styles.backgroundSetting} onPress={() => navigateToShopScreen()}>
							<MezonIconCDN icon={IconCDN.shopSparkleIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.backgroundSetting} onPress={() => navigateToSettingScreen()}>
							<MezonIconCDN icon={IconCDN.settingIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.viewImageProfile}>
					<TouchableOpacity onPress={showUserStatusBottomSheet} style={styles.imageProfile}>
						{userProfile?.user?.avatar_url ? (
							isTabletLandscape ? (
								<Image
									source={{
										uri: createImgproxyUrl(userProfile?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })
									}}
									style={styles.imgWrapper}
								/>
							) : (
								<View style={styles.imgWrapper}>
									<ImageNative
										url={createImgproxyUrl(userProfile?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
										style={styles.imgWrapper}
									/>
								</View>
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
								<Text style={styles.textAvatar}>{userProfile?.user?.username?.charAt?.(0)?.toUpperCase()}</Text>
							</View>
						)}

						<StatusProfile />
					</TouchableOpacity>
					<View style={styles.badgeStatusTemp} />

					<View style={styles.badgeStatus}>
						<View style={styles.badgeStatusInside} />
						{!userCustomStatus && (
							<TouchableOpacity
								activeOpacity={1}
								onPress={() => setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal)}
								style={styles.iconAddStatus}
							>
								<MezonIconCDN icon={IconCDN.plusLargeIcon} height={size.s_12} width={size.s_12} color={themeValue.primary} />
							</TouchableOpacity>
						)}
						<TouchableOpacity activeOpacity={1} onPress={() => setIsVisibleAddStatusUserModal(!isVisibleAddStatusUserModal)}>
							<Text numberOfLines={1} style={styles.textStatus}>
								{userCustomStatus ? userCustomStatus : t('addStatus')}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>

			{isTabletLandscape && (
				<View style={styles.buttonListLandscape}>
					{!isEnableWallet && (
						<MezonButton
							containerStyle={styles.button}
							onPress={() => enableWallet()}
							icon={<MezonIconCDN icon={IconCDN.wallet} height={size.s_18} width={size.s_18} color={'white'} />}
							title={t('enableWallet')}
							titleStyle={styles.whiteText}
						/>
					)}
					<MezonButton
						containerStyle={styles.button}
						onPress={() => navigateToProfileSetting()}
						icon={<MezonIconCDN icon={IconCDN.pencilIcon} height={size.s_18} width={size.s_18} color={'white'} />}
						title={t('editStatus')}
						titleStyle={styles.whiteText}
					/>
				</View>
			)}

			<ScrollView style={styles.contentWrapper} contentContainerStyle={{ paddingBottom: size.s_100 }}>
				<View style={styles.contentContainer}>
					<TouchableOpacity onPress={showUserStatusBottomSheet} style={{ marginBottom: size.s_10 }}>
						<View style={styles.viewInfo}>
							<Text style={styles.textName}>{userProfile?.user?.display_name || userProfile?.user?.username}</Text>
							<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
						</View>
						<Text style={styles.text}>{userProfile?.user?.username}</Text>
					</TouchableOpacity>
					{isEnableWallet && (
						<View>
							<TouchableOpacity
								onPress={showSendTokenBottomSheet}
								style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}
							>
								<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} width={size.s_20} height={size.s_20} color={baseColor.azureBlue} />
								<View style={styles.token}>
									<Text
										style={styles.text}
									>{`${t('token')} ${formatBalanceToString((tokenInWallet || 0)?.toString())} ${CURRENCY.SYMBOL}`}</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									navigation.push(APP_SCREEN.WALLET, {
										activeScreen: 'transfer'
									});
								}}
								style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10, marginTop: size.s_10 }}
							>
								<MezonIconCDN icon={IconCDN.sendMoneyIcon} height={size.s_22} width={size.s_22} color={baseColor.bgSuccess} />
								<View style={styles.token}>
									<Text style={styles.text}>{tStack('settingStack.sendToken')}</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									navigation.push(APP_SCREEN.WALLET, {
										activeScreen: 'history'
									});
								}}
								style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10, marginTop: size.s_10 }}
							>
								<MezonIconCDN icon={IconCDN.historyIcon} height={size.s_24} width={size.s_24} color={baseColor.bgSuccess} />
								<View style={styles.token}>
									<Text style={styles.text}>{tStack('settingStack.historyTransaction')}</Text>
								</View>
							</TouchableOpacity>
						</View>
					)}

					{!isTabletLandscape && (
						<View style={styles.buttonList}>
							{!isEnableWallet && (
								<MezonButton
									containerStyle={styles.button}
									onPress={() => enableWallet()}
									icon={<MezonIconCDN icon={IconCDN.wallet} height={size.s_18} width={size.s_18} color={'white'} />}
									title={t('enableWallet')}
									titleStyle={styles.whiteText}
								/>
							)}
							<MezonButton
								containerStyle={styles.button}
								onPress={() => navigateToProfileSetting()}
								icon={<MezonIconCDN icon={IconCDN.pencilIcon} height={size.s_18} width={size.s_18} color={'white'} />}
								title={t('editStatus')}
								titleStyle={styles.whiteText}
							/>
						</View>
					)}
				</View>

				<View style={styles.contentContainer}>
					<View style={{ gap: size.s_20 }}>
						{userProfile?.user?.about_me ? (
							<View>
								<Text style={styles.textTitle}>{t('aboutMe')}</Text>
								<Text style={styles.text}>{userProfile?.user?.about_me}</Text>
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
					<MezonIconCDN
						icon={IconCDN.chevronSmallRightIcon}
						width={size.s_18}
						height={size.s_18}
						customStyle={{ marginLeft: size.s_4 }}
						color={themeValue.textStrong}
					/>
				</TouchableOpacity>

				<TouchableOpacity style={[styles.contentContainer, styles.imgList]} onPress={copyUserId}>
					<Text style={styles.textTitle}>{t('copyUserId')}</Text>
					<MezonIconCDN
						icon={IconCDN.idIcon}
						width={size.s_18}
						height={size.s_18}
						customStyle={{ marginLeft: size.s_4 }}
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
