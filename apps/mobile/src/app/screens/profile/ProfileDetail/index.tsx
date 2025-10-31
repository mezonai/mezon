import { useAuth, useDirect, useFriends } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	DMCallActions,
	EStateFriend,
	directActions,
	selectDirectsOpenlist,
	selectFriendById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { checkNotificationPermissionAndNavigate } from '../../../utils/notificationPermissionHelper';
import { DirectMessageCallMain } from '../../messages/DirectMessageCall';
import { style } from './styles';

enum UserRelationshipStatus {
	NOT_FRIENDS = 'not_friends',
	FRIENDS = 'friends',
	PENDING_REQUEST = 'pending_request',
	MY_PENDING = 'my_pending',
	BLOCKED = 'blocked'
}

export const ProfileDetail = memo(() => {
	const { t } = useTranslation(['profile']);
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userId } = useAuth();
	const { acceptFriend, deleteFriend, addFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();
	const { data: routeRawData, username } = route.params || {};

	const profileData = useMemo(() => {
		try {
			if (!routeRawData) return null;
			const decodedData = JSON.parse(decodeURIComponent(atob(routeRawData)));
			return {
				username,
				avatar_url: decodedData?.avatar,
				display_name: decodedData?.name,
				user_id: decodedData?.id || ''
			};
		} catch (error) {
			return null;
		}
	}, [routeRawData, username]);

	const infoFriend = useAppSelector((state) => selectFriendById(state, profileData?.user_id));
	const listDM = useAppSelector(selectDirectsOpenlist);
	const youSelf = useMemo(() => {
		return profileData?.user_id === userId;
	}, [profileData?.user_id, userId]);

	const userRelationshipStatus = useMemo(() => {
		if (!profileData?.user_id) return UserRelationshipStatus.NOT_FRIENDS;

		const isFriend = infoFriend?.state === EStateFriend.FRIEND;
		if (isFriend) return UserRelationshipStatus.FRIENDS;

		const hasPendingRequest = infoFriend?.state === EStateFriend.OTHER_PENDING;
		if (hasPendingRequest) return UserRelationshipStatus.PENDING_REQUEST;

		const myPending = infoFriend?.state === EStateFriend.MY_PENDING;
		if (myPending) return UserRelationshipStatus.MY_PENDING;

		const isBlocked = infoFriend?.state === EStateFriend.BLOCK;
		if (isBlocked) return UserRelationshipStatus.BLOCKED;

		return UserRelationshipStatus.NOT_FRIENDS;
	}, [profileData?.user_id, infoFriend]);

	const navigateToMessageDetail = useCallback(async () => {
		if (!profileData?.user_id) return;

		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});

		const directMessage = listDM?.find?.((dm) => {
			const userIds = dm?.user_ids;
			return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === profileData.user_id;
		});

		if (directMessage?.id) {
			if (isTabletLandscape) {
				await dispatch(directActions.setDmGroupCurrentId(directMessage?.id));
				navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			} else {
				navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: directMessage?.id });
			}
			return;
		}

		const response = await createDirectMessageWithUser(
			profileData.user_id,
			profileData.display_name || profileData.username,
			profileData.username,
			profileData.avatar_url
		);

		if (response?.channel_id) {
			await checkNotificationPermissionAndNavigate(() => {
				if (isTabletLandscape) {
					dispatch(directActions.setDmGroupCurrentId(response?.channel_id || ''));
					navigation.navigate(APP_SCREEN.MESSAGES.HOME);
				} else {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: response?.channel_id });
				}
			});
		}
	}, [
		profileData?.user_id,
		profileData?.display_name,
		profileData?.username,
		profileData?.avatar_url,
		listDM,
		isTabletLandscape,
		dispatch,
		navigation,
		createDirectMessageWithUser
	]);

	const handleCallUser = useCallback(async () => {
		if (!profileData?.user_id) return;

		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});

		const directMessage = listDM?.find?.((dm) => {
			const userIds = dm?.user_ids;
			return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === profileData.user_id;
		});

		if (directMessage?.id) {
			dispatch(DMCallActions.removeAll());
			const params = {
				receiverId: profileData.user_id,
				receiverAvatar: profileData.avatar_url,
				receiverName: profileData.display_name || profileData.username,
				directMessageId: directMessage?.id
			};
			const data = {
				children: <DirectMessageCallMain route={{ params }} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			return;
		}

		const response = await createDirectMessageWithUser(
			profileData.user_id,
			profileData.display_name || profileData.username,
			profileData.username,
			profileData.avatar_url
		);

		if (response?.channel_id) {
			dispatch(DMCallActions.removeAll());
			const params = {
				receiverId: profileData.user_id,
				receiverAvatar: profileData.avatar_url,
				receiverName: profileData.display_name || profileData.username,
				directMessageId: response?.channel_id
			};
			const data = {
				children: <DirectMessageCallMain route={{ params }} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		}
	}, [
		profileData?.user_id,
		profileData?.display_name,
		profileData?.username,
		profileData?.avatar_url,
		listDM,
		navigation,
		createDirectMessageWithUser
	]);

	const handleAddFriend = useCallback(() => {
		const userIdToAddFriend = profileData?.user_id;
		if (userIdToAddFriend) {
			addFriend({
				usernames: [],
				ids: [userIdToAddFriend]
			});
		}
	}, [profileData?.user_id, addFriend]);

	const handleAcceptRequest = useCallback(() => {
		const userIdToAcceptRequest = profileData?.user_id;
		if (userIdToAcceptRequest) {
			acceptFriend(profileData?.username, userIdToAcceptRequest);
		}
	}, [profileData?.user_id, profileData?.username, acceptFriend]);

	const handleCancelRequest = useCallback(() => {
		const userIdToCancelRequest = profileData?.user_id;
		if (userIdToCancelRequest) {
			deleteFriend(profileData?.username, userIdToCancelRequest);
		}
	}, [profileData?.user_id, profileData?.username, deleteFriend]);

	const handleDismiss = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	if (!username || !profileData || userRelationshipStatus === UserRelationshipStatus.BLOCKED) {
		return (
			<View style={styles.container}>
				<View style={styles.profileContainer}>
					<Text style={styles.profileTitle}>{t('userProfile', 'USER PROFILE')}</Text>
					<View style={styles.userInfo}>
						<Text style={styles.username}>{t('userNotFound', 'User not found')}</Text>
						<Text style={styles.userStatus}>
							{t('userNotFoundMessage', 'The user with username @{{username}} could not be found.', { username })}
						</Text>
					</View>
					<TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={handleDismiss}>
						<Text style={styles.actionButtonText}>{t('goBack', 'Go Back')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.profileContainer}>
				<Text style={styles.profileTitle}>{t('userProfile', 'USER PROFILE')}</Text>

				<View style={styles.userInfo}>
					{profileData.avatar_url ? (
						<FastImage
							source={{
								uri: createImgproxyUrl(profileData.avatar_url, { width: 200, height: 200, resizeType: 'fit' })
							}}
							style={styles.profileImage}
						/>
					) : (
						<View style={styles.defaultAvatar}>
							<Text style={styles.defaultAvatarText}>
								{profileData.display_name?.charAt(0)?.toUpperCase() || profileData.username?.charAt(0)?.toUpperCase()}
							</Text>
						</View>
					)}

					<Text style={styles.username} numberOfLines={1}>
						{profileData?.display_name || profileData?.username}
					</Text>
				</View>

				{!youSelf && (
					<View>
						{userRelationshipStatus === UserRelationshipStatus.NOT_FRIENDS && (
							<TouchableOpacity style={styles.actionButton} onPress={handleAddFriend}>
								<Text style={styles.actionButtonText}>{t('addFriend', 'Add Friend')}</Text>
							</TouchableOpacity>
						)}

						{userRelationshipStatus === UserRelationshipStatus.MY_PENDING && (
							<TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAcceptRequest}>
								<Text style={styles.actionButtonText}>{t('acceptRequest', 'Accept Request')}</Text>
							</TouchableOpacity>
						)}

						{userRelationshipStatus === UserRelationshipStatus.PENDING_REQUEST && (
							<TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelRequest}>
								<Text style={styles.actionButtonText}>{t('cancelRequest', 'Cancel Request')}</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity style={styles.actionButton} onPress={navigateToMessageDetail}>
							<Text style={styles.actionButtonText}>{t('message', 'Message')}</Text>
						</TouchableOpacity>
					</View>
				)}

				<TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={handleDismiss}>
					<Text style={styles.actionButtonText}>{youSelf ? t('goBack', 'Go Back') : t('noThanks', 'No, Thanks')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
});
