import { useAuth, useDirect, useFriends, useMemberCustomStatus, useMemberStatus } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	DMCallActions,
	EStateFriend,
	RolesClanEntity,
	RootState,
	directActions,
	friendsActions,
	getStore,
	selectAccountCustomStatus,
	selectAllRolesClan,
	selectDirectsOpenlist,
	selectFriendById,
	selectMemberClanByUserId2,
	selectStatusSentMobile,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR, IMessageWithUser } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useMixImageColor } from '../../../../../../app/hooks/useMixImageColor';
import { APP_SCREEN } from '../../../../../../app/navigation/ScreenTypes';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../components/ImageNative';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { getUserStatusByMetadata } from '../../../../../utils/helpers';
import { checkNotificationPermissionAndNavigate } from '../../../../../utils/notificationPermissionHelper';
import { DirectMessageCallMain } from '../../../../messages/DirectMessageCall';
import { style } from './UserProfile.styles';
import EditUserProfileBtn from './component/EditUserProfileBtn';
import { PendingContent } from './component/PendingContent';
import UserInfoDm from './component/UserInfoDm';
import UserSettingProfile from './component/UserSettingProfile';

interface userProfileProps {
	userId?: string;
	user?: any;
	message?: IMessageWithUser;
	checkAnonymous?: boolean;
	onClose?: () => void;
	showAction?: boolean;
	showRole?: boolean;
	currentChannel?: ChannelsEntity;
	directId?: string;
}

export enum EFriendState {
	Friend,
	SentRequestFriend,
	ReceivedRequestFriend
}

export const formatDate = (dateString: string) => {
	const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', options);
};

const UserProfile = React.memo(
	({ userId, user, onClose, checkAnonymous, message, showAction = true, showRole = true, currentChannel, directId }: userProfileProps) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue, isTabletLandscape);
		const { userProfile } = useAuth();
		const { t } = useTranslation(['userProfile', 'friends']);
		const userById = useAppSelector((state) => selectMemberClanByUserId2(state, userId || user?.id));
		const userStatus = useMemberStatus(userId || user?.id);
		const rolesClan: RolesClanEntity[] = useSelector(selectAllRolesClan);
		const messageAvatar = useMemo(() => {
			return message?.clan_avatar || message?.avatar;
		}, [message?.clan_avatar, message?.avatar]);
		const { color } = useMixImageColor(
			messageAvatar || userById?.clan_avatar || userById?.user?.avatar_url || userProfile?.user?.avatar_url || ''
		);
		const navigation = useNavigation<any>();
		const { createDirectMessageWithUser } = useDirect();
		const listDM = useSelector(selectDirectsOpenlist);
		const userCustomStatus = useMemberCustomStatus(userId || user?.id || '');
		const { acceptFriend, deleteFriend, addFriend } = useFriends();
		const [isShowPendingContent, setIsShowPendingContent] = useState(false);
		const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
		const dispatch = useAppDispatch();
		const dmChannel = useMemo(() => {
			return listDM?.find((dm) => dm?.id === directId);
		}, [directId, listDM]);
		const isDMGroup = useMemo(() => {
			return dmChannel?.type === ChannelType.CHANNEL_TYPE_GROUP;
		}, [dmChannel?.type]);

		const isDM = useMemo(() => {
			return currentChannel?.type === ChannelType.CHANNEL_TYPE_DM || currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP;
		}, [currentChannel?.type]);
		const infoFriend = useAppSelector((state) => selectFriendById(state, userId || user?.id));
		const isBlocked = useMemo(() => {
			return infoFriend?.state === EStateFriend.BLOCK;
		}, [infoFriend?.state]);

		const status = getUserStatusByMetadata(user?.user?.metadata) || user?.metadata?.user_status;

		useEffect(() => {
			if (isShowPendingContent) {
				setIsShowPendingContent(false);
			}
		}, [infoFriend?.state]);

		const isKicked = useMemo(() => {
			return !userById;
		}, [userById]);

		const handleAddFriend = async () => {
			const userIdToAddFriend = userId || user?.id;
			if (userIdToAddFriend) {
				await addFriend({
					usernames: [],
					ids: [userIdToAddFriend]
				});

				showAddFriendToast();
			}
		};

		const showAddFriendToast = useCallback(() => {
			const store = getStore();
			const statusSentMobile = selectStatusSentMobile(store.getState() as RootState);
			if (statusSentMobile?.isSuccess) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('friends:toast.sendAddFriendSuccess'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
			} else {
				Toast.show({
					type: 'error',
					props: {
						text2: t('friends:toast.sendAddFriendFail'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
					}
				});
			}
			dispatch(friendsActions.setSentStatusMobile(null));
		}, []);

		const iconFriend = useMemo(() => {
			switch (infoFriend?.state) {
				case EFriendState.Friend:
					return {
						icon: IconCDN.userFriendIcon,
						action: () => setIsShowPendingContent(true)
					};
				case EFriendState.ReceivedRequestFriend:
					return {
						icon: IconCDN.userPendingIcon,
						action: () => setIsShowPendingContent(true)
					};
				case EFriendState.SentRequestFriend:
					return {
						icon: IconCDN.userPendingIcon,
						action: () => setIsShowPendingContent(true)
					};
				default:
					return {
						icon: IconCDN.userPlusIcon,
						action: handleAddFriend
					};
			}
		}, [infoFriend?.state]);

		const userRolesClan = useMemo(() => {
			return userById?.role_id
				? rolesClan?.filter?.((role) => userById?.role_id?.includes(role.id) && role?.slug !== `everyone-${role?.clan_id}`)
				: [];
		}, [userById?.role_id, rolesClan]);

		const isCheckOwner = useMemo(() => {
			const userId = userById?.user?.google_id || userById?.user?.id;
			const id = userProfile?.user?.google_id || userProfile?.user?.id;
			return userId === id;
		}, [userById, userProfile]);

		const displayStatus = useMemo(() => {
			return isCheckOwner ? currentUserCustomStatus : userCustomStatus;
		}, [currentUserCustomStatus, isCheckOwner, userCustomStatus]);

		const directMessageWithUser = useCallback(
			async (userId: string) => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false
				});
				const directMessage = listDM?.find?.((dm) => {
					const userIds = dm?.user_id;
					return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === userId;
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
					userId,
					message?.display_name || user?.user?.display_name || user?.display_name || userById?.user?.display_name,
					message?.user?.username || user?.user?.username || user?.username || userById?.user?.username,
					message?.avatar || user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url
				);

				if (response?.channel_id) {
					await checkNotificationPermissionAndNavigate(() => {
						if (isTabletLandscape) {
							dispatch(directActions.setDmGroupCurrentId(directMessage?.id || ''));
							navigation.navigate(APP_SCREEN.MESSAGES.HOME);
						} else {
							navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: response?.channel_id });
						}
					});
				}
			},
			[
				createDirectMessageWithUser,
				dispatch,
				isTabletLandscape,
				listDM,
				message?.avatar,
				message?.display_name,
				message?.user?.username,
				navigation,
				user?.avatar_url,
				user?.display_name,
				user?.user?.avatar_url,
				user?.user?.display_name,
				user?.user?.username,
				user?.username,
				userById?.user?.avatar_url,
				userById?.user?.display_name,
				userById?.user?.username
			]
		);

		const navigateToMessageDetail = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			if (onClose && typeof onClose === 'function') {
				onClose();
			}
			directMessageWithUser(userId || user?.id);
		};

		const handleCallUser = useCallback(
			async (userId: string) => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false
				});
				const directMessage = listDM?.find?.((dm) => {
					const userIds = dm?.user_id;
					return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === userId;
				});
				if (directMessage?.id) {
					const params = {
						receiverId: userId,
						receiverAvatar: message?.avatar || user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url,
						receiverName: message?.display_name || user?.user?.display_name || user?.display_name || userById?.user?.display_name,
						directMessageId: directMessage?.id
					};
					const data = {
						children: <DirectMessageCallMain route={{ params }} />
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
					return;
				}
				const response = await createDirectMessageWithUser(
					userId,
					message?.display_name || user?.user?.display_name || user?.display_name || userById?.user?.display_name,
					message?.user?.username || user?.user?.username || user?.username || userById?.user?.username,
					message?.avatar || user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url
				);
				if (response?.channel_id) {
					dispatch(DMCallActions.removeAll());
					const params = {
						receiverId: userId,
						receiverAvatar: message?.avatar || user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url,
						receiverName: message?.display_name || user?.user?.display_name || user?.display_name || userById?.user?.display_name,
						directMessageId: response?.channel_id
					};
					const data = {
						children: <DirectMessageCallMain route={{ params }} />
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
				}
			},
			[
				createDirectMessageWithUser,
				listDM,
				message?.avatar,
				message?.display_name,
				message?.user?.username,
				navigation,
				user?.avatar_url,
				user?.display_name,
				user?.user?.avatar_url,
				user?.user?.display_name,
				user?.user?.username,
				user?.username,
				userById?.user?.avatar_url,
				userById?.user?.display_name,
				userById?.user?.username
			]
		);

		const actionList = [
			{
				id: 1,
				text: t('userAction.sendMessage'),
				icon: <MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.text} />,
				action: navigateToMessageDetail,
				isShow: (!!infoFriend && infoFriend?.state === EFriendState.Friend) || !!userById
			},
			{
				id: 2,
				text: t('userAction.voiceCall'),
				icon: <MezonIconCDN icon={IconCDN.phoneCallIcon} color={themeValue.text} />,
				action: () => handleCallUser(userId || user?.id),
				isShow: (!!infoFriend && infoFriend?.state === EFriendState.Friend) || !!userById
			},
			{
				id: 4,
				text: t('userAction.addFriend'),
				icon: <MezonIconCDN icon={IconCDN.userPlusIcon} color={baseColor.green} />,
				action: handleAddFriend,
				isShow: !infoFriend && !isBlocked,
				textStyles: {
					color: baseColor.green
				}
			},
			{
				id: 5,
				text: t('userAction.pending'),
				icon: <MezonIconCDN icon={IconCDN.clockIcon} color={baseColor.goldenrodYellow} />,
				action: () => {
					setIsShowPendingContent(true);
				},
				isShow:
					!!infoFriend &&
					infoFriend?.state !== undefined &&
					[EFriendState.ReceivedRequestFriend, EFriendState.SentRequestFriend].includes(infoFriend?.state),
				textStyles: {
					color: baseColor.goldenrodYellow
				}
			}
		];

		const handleAcceptFriend = () => {
			acceptFriend(infoFriend?.user?.username || '', infoFriend?.user?.id || '');
		};

		const handleIgnoreFriend = () => {
			deleteFriend(infoFriend?.user?.username || '', infoFriend?.user?.id || '');
		};
		const isChannelOwner = useMemo(() => {
			if (dmChannel?.creator_id) {
				return dmChannel?.creator_id === userProfile?.user?.id;
			}
			return currentChannel?.creator_id === userProfile?.user?.id;
		}, [currentChannel?.creator_id, dmChannel?.creator_id, userProfile?.user?.id]);

		const isShowUserContent = useMemo(() => {
			return !!userById?.user?.about_me || (showRole && userRolesClan?.length) || showAction || (isDMGroup && isChannelOwner && !isCheckOwner);
		}, [userById?.user?.about_me, showAction, showRole, userRolesClan, isDMGroup, isCheckOwner, isChannelOwner]);

		const handleTransferFunds = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			const payload = JSON.stringify({
				receiver_id: userId ? userId : user?.id,
				receiver_name: user?.user?.username || userById?.user?.username || user?.username,
				amount: 10000,
				note: t('userAction.transferFunds'),
				canEdit: true
			});
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			navigation.push(APP_SCREEN.WALLET, {
				activeScreen: 'transfer',
				formValue: payload
			});
			if (onClose && typeof onClose === 'function') {
				onClose();
			}
		};

		if (isShowPendingContent) {
			return (
				<View style={[styles.wrapper]}>
					<PendingContent targetUser={infoFriend} onClose={() => setIsShowPendingContent(false)} />
				</View>
			);
		}

		return (
			<View style={[styles.wrapper]}>
				<View style={[styles.backdrop, { backgroundColor: userById || user?.avatar_url ? color : baseColor.gray }]}>
					{!isCheckOwner && (
						<View style={{ flexDirection: 'row' }}>
							<TouchableOpacity
								onPress={iconFriend?.action}
								style={{
									position: 'absolute',
									right: size.s_10,
									top: size.s_10,
									padding: size.s_6,
									borderRadius: size.s_20,
									backgroundColor: themeValue.primary
								}}
							>
								<MezonIconCDN icon={iconFriend?.icon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => handleTransferFunds()}
								style={{
									position: 'absolute',
									right: size.s_50,
									top: size.s_10,
									padding: size.s_6,
									borderRadius: size.s_20,
									backgroundColor: themeValue.primary
								}}
							>
								<MezonIconCDN icon={IconCDN.transactionIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</TouchableOpacity>
						</View>
					)}
					<View style={[styles.userAvatar]}>
						<MezonAvatar
							width={size.s_80}
							height={size.s_80}
							avatarUrl={
								!isDM
									? (messageAvatar ??
										userById?.clan_avatar ??
										userById?.user?.avatar_url ??
										user?.user?.avatar_url ??
										user?.avatar_url)
									: (userById?.user?.avatar_url ?? user?.user?.avatar_url ?? user?.avatar_url ?? messageAvatar)
							}
							username={user?.user?.username || user?.username}
							userStatus={userStatus}
							customStatus={status}
							isBorderBoxImage={true}
							statusUserStyles={styles.statusUser}
						/>
					</View>
					{displayStatus ? (
						<>
							<View style={styles.badgeStatusTemp} />
							<View style={styles.badgeStatus}>
								<View style={styles.badgeStatusInside} />
								<Text numberOfLines={3} style={styles.customStatusText}>
									{displayStatus}
								</Text>
							</View>
						</>
					) : null}
				</View>

				<View style={[styles.container]}>
					<View style={[styles.userInfo]}>
						<Text style={[styles.username]}>
							{userById
								? !isDM
									? userById?.clan_nick ||
										userById?.user?.display_name ||
										userById?.user?.username ||
										user?.clan_nick ||
										user?.user?.display_name ||
										user?.user?.username
									: userById?.user?.display_name || userById?.user?.username
								: user?.display_name ||
									user?.user?.display_name ||
									user?.username ||
									user?.user?.username ||
									(checkAnonymous ? 'Anonymous' : message?.username)}
						</Text>
						<Text style={[styles.subUserName]}>
							{userById
								? userById?.user?.username || userById?.user?.display_name
								: user?.username ||
									user?.user?.username ||
									user?.display_name ||
									user?.user?.display_name ||
									(checkAnonymous ? 'Anonymous' : message?.username)}
						</Text>
						{isCheckOwner && <EditUserProfileBtn user={userById || (user as any)} />}
						{!isCheckOwner && (
							<View style={[styles.userAction]}>
								{actionList.map((actionItem) => {
									const { action, icon, id, isShow, text, textStyles } = actionItem;
									if (!isShow) return null;
									return (
										<TouchableOpacity key={id} onPress={() => action?.()} style={[styles.actionItem]}>
											{icon}
											<Text style={[styles.actionText, textStyles && textStyles]}>{text}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
						{EFriendState.ReceivedRequestFriend === infoFriend?.state && (
							<View style={{ marginTop: size.s_16 }}>
								<Text style={styles.receivedFriendRequestTitle}>{t('incomingFriendRequest')}</Text>
								<View style={{ flexDirection: 'row', gap: size.s_10, marginTop: size.s_10 }}>
									<TouchableOpacity
										onPress={() => handleAcceptFriend()}
										style={[styles.button, { backgroundColor: baseColor.green }]}
									>
										<Text style={styles.defaultText}>{t('accept')}</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleIgnoreFriend()}
										style={[styles.button, { backgroundColor: baseColor.bgButtonSecondary }]}
									>
										<Text style={styles.defaultText}>{t('ignore')}</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>

					{isShowUserContent && (
						<View style={[!isDMGroup && styles.roleGroup]}>
							{!isDMGroup && (userById?.user?.create_time || user?.create_time || user?.user?.create_time) && (
								<View style={styles.memberSince}>
									<Text style={styles.title}>{t('userInfoDM.mezonMemberSince')}</Text>
									<Text style={styles.subUserName}>
										{formatDate(userById?.user?.create_time || user?.create_time || user?.user?.create_time)}
									</Text>
								</View>
							)}
							{!!userById?.user?.about_me && (
								<View style={{ paddingVertical: size.s_16 }}>
									<Text style={[styles.aboutMe]}>{t('aboutMe.headerTitle')}</Text>
									<Text style={[styles.aboutMeText]}>{userById?.user?.about_me}</Text>
								</View>
							)}
							{userRolesClan?.length && showRole && !isDM ? (
								<View>
									<Text style={[styles.title]}>{t('aboutMe.roles.headerTitle')}</Text>
									<View style={[styles.roles]}>
										{userRolesClan?.map((role, index) => (
											<View style={[styles.roleItem]} key={`${role.id}_${index}`}>
												{role?.role_icon ? (
													<ImageNative
														url={role?.role_icon}
														style={{
															width: size.s_15,
															height: size.s_15,
															borderRadius: size.s_50
														}}
													/>
												) : (
													<View
														style={{
															width: size.s_15,
															height: size.s_15,
															borderRadius: size.s_50,
															backgroundColor: role?.color || DEFAULT_ROLE_COLOR
														}}
													></View>
												)}
												<Text style={[styles.textRole]}>{role?.title}</Text>
											</View>
										))}
									</View>
								</View>
							) : null}
							{isDMGroup && !isCheckOwner && isChannelOwner && (
								<View style={styles.actionGroupDM}>
									<UserInfoDm currentChannel={dmChannel || (currentChannel as ChannelsEntity)} user={userById || (user as any)} />
								</View>
							)}
							{showAction && !isKicked && <UserSettingProfile user={userById || (user as any)} />}
						</View>
					)}
				</View>
			</View>
		);
	}
);

export default UserProfile;
