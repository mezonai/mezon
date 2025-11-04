import { useDirect, useMemberStatus } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity, RolesClanEntity, RootState } from '@mezon/store-mobile';
import {
	DMCallActions,
	EStateFriend,
	directActions,
	friendsActions,
	getStore,
	selectAllAccount,
	selectAllRolesClan,
	selectDirectsOpenlist,
	selectFriendById,
	selectMemberClanByUserId,
	selectStatusSentMobile,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR, EUserStatus } from '@mezon/utils';
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
import { checkNotificationPermissionAndNavigate } from '../../../../../utils/notificationPermissionHelper';
import { DirectMessageCallMain } from '../../../../messages/DirectMessageCall';
import { style } from './UserProfile.styles';
import EditUserProfileBtn from './component/EditUserProfileBtn';
import { PendingContent } from './component/PendingContent';
import UserInfoDm from './component/UserInfoDm';
import UserSettingProfile from './component/UserSettingProfile';
import { UserVoiceInfo } from './component/UserVoiceInfo';

export type IManageVoiceUser = {
	isHavePermission: boolean;
	isShowMute: boolean;
};

export enum IActionVoiceUser {
	MUTE = 'mute',
	KICK = 'kick'
}

interface userProfileProps {
	userId?: string;
	user?: any;
	messageAvatar?: string;
	checkAnonymous?: boolean;
	onClose?: () => void;
	onActionVoice?: (action: IActionVoiceUser) => void;
	showAction?: boolean;
	showRole?: boolean;
	currentChannel?: ChannelsEntity;
	directId?: string;
	manageVoiceUser?: IManageVoiceUser;
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
	({
		userId,
		user,
		onClose,
		onActionVoice,
		checkAnonymous,
		messageAvatar,
		showAction = true,
		showRole = true,
		currentChannel,
		directId,
		manageVoiceUser
	}: userProfileProps) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue, isTabletLandscape);
		const userProfile = useSelector(selectAllAccount);
		const { t } = useTranslation(['userProfile', 'friends']);
		const userById = useAppSelector((state) => selectMemberClanByUserId(state, userId || user?.id));
		const rolesClan: RolesClanEntity[] = useSelector(selectAllRolesClan);
		const { color } = useMixImageColor(
			messageAvatar || userById?.clan_avatar || userById?.user?.avatar_url || userProfile?.user?.avatar_url || ''
		);
		const navigation = useNavigation<any>();
		const { createDirectMessageWithUser } = useDirect();
		const listDM = useSelector(selectDirectsOpenlist);
		const getStatus = useMemberStatus(userById?.id || '');
		const [isShowPendingContent, setIsShowPendingContent] = useState(false);
		const dispatch = useAppDispatch();
		const dmChannel = useMemo(() => {
			return listDM?.find((dm) => dm?.id === directId);
		}, [directId, listDM]);

		const isDMGroup = useMemo(() => {
			const channelType = dmChannel?.type || currentChannel?.type;
			return channelType === ChannelType.CHANNEL_TYPE_GROUP;
		}, [currentChannel?.type, dmChannel?.type]);

		const status = useMemo(() => {
			const userIdInfo = userId || user?.id;
			if (userIdInfo !== userProfile?.user?.id) {
				return getStatus;
			}
			return {
				status: userProfile?.user?.status || EUserStatus.ONLINE,
				user_status: userProfile?.user?.user_status
			};
		}, [getStatus, user?.id, userId, userProfile?.user?.id, userProfile?.user?.status, userProfile?.user?.user_status]);

		const isDM = useMemo(() => {
			return currentChannel?.type === ChannelType.CHANNEL_TYPE_DM || currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP;
		}, [currentChannel?.type]);
		const infoFriend = useAppSelector((state) => selectFriendById(state, userId || user?.id));
		const isBlocked = useMemo(() => {
			return infoFriend?.state === EStateFriend.BLOCK;
		}, [infoFriend?.state]);

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
				await dispatch(
					friendsActions.sendRequestAddFriend({
						usernames: [],
						ids: [userIdToAddFriend]
					})
				);

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
			const userId = userById?.user?.id;
			const id = userProfile?.user?.id;
			return userId === id;
		}, [userById, userProfile]);

		const directMessageWithUser = useCallback(
			async (userId: string) => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false
				});
				if (!isCheckOwner) {
					const directMessage = listDM?.find?.((dm) => {
						const userIds = dm?.user_ids;
						const isDM = dm.type === ChannelType.CHANNEL_TYPE_DM;
						return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === userId && isDM;
					});
					if (directMessage?.id) {
						if (isTabletLandscape) {
							dispatch(directActions.setDmGroupCurrentId(directMessage?.id));
							navigation.navigate(APP_SCREEN.MESSAGES.HOME);
						} else {
							navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: directMessage?.id });
						}
						return;
					}
				}
				const response = await createDirectMessageWithUser(
					userId,
					user?.user?.display_name || user?.display_name || userById?.user?.display_name,
					user?.user?.username || user?.username || userById?.user?.username,
					user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url
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
				} else {
					Toast.show({
						type: 'error',
						props: {
							text2: t('friends:toast.somethingWentWrong'),
							leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
						}
					});
				}
			},
			[
				createDirectMessageWithUser,
				dispatch,
				isCheckOwner,
				isTabletLandscape,
				listDM,
				navigation,
				t,
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
					const userIds = dm?.user_ids;
					return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === userId;
				});
				if (directMessage?.id) {
					const params = {
						receiverId: userId,
						receiverAvatar: user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url,
						receiverName: user?.user?.display_name || user?.display_name || userById?.user?.display_name,
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
					user?.user?.display_name || user?.display_name || userById?.user?.display_name,
					user?.user?.username || user?.username || userById?.user?.username,
					user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url
				);
				if (response?.channel_id) {
					dispatch(DMCallActions.removeAll());
					const params = {
						receiverId: userId,
						receiverAvatar: user?.avatar_url || user?.user?.avatar_url || userById?.user?.avatar_url,
						receiverName: user?.user?.display_name || user?.display_name || userById?.user?.display_name,
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
				dispatch,
				listDM,
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
				isShow: !isBlocked
			},
			{
				id: 2,
				text: t('userAction.voiceCall'),
				icon: <MezonIconCDN icon={IconCDN.phoneCallIcon} color={themeValue.text} />,
				action: () => handleCallUser(userId || user?.id),
				isShow: !isBlocked
			},
			{
				id: 4,
				text: t('userAction.addFriend'),
				icon: <MezonIconCDN icon={IconCDN.userPlusIcon} color={baseColor.green} />,
				action: handleAddFriend,
				isShow: !infoFriend && !isBlocked,
				textStyleName: 'actionTextGreen'
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
				textStyleName: 'actionTextYellow'
			}
		];

		const handleAcceptFriend = () => {
			const body = infoFriend?.user?.id
				? {
						ids: [infoFriend?.user?.id || ''],
						isAcceptingRequest: true
					}
				: { usernames: [infoFriend?.user?.username || ''], isAcceptingRequest: true };
			dispatch(friendsActions.sendRequestAddFriend(body));
		};

		const handleIgnoreFriend = () => {
			const body = {
				usernames: [infoFriend?.user?.username || ''],
				ids: [infoFriend?.user?.id || '']
			};
			dispatch(friendsActions.sendRequestDeleteFriend(body));
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
				<View style={styles.wrapper}>
					<PendingContent
						targetUser={infoFriend}
						userName={user?.user?.username || user?.username || userById?.user?.username}
						onClose={() => setIsShowPendingContent(false)}
					/>
				</View>
			);
		}

		return (
			<View style={styles.wrapper}>
				<View style={[styles.backdrop, { backgroundColor: userById || user?.avatar_url ? color : baseColor.gray }]}>
					{!isCheckOwner && (
						<View style={styles.rowContainer}>
							<TouchableOpacity onPress={iconFriend?.action} style={styles.topActionButton}>
								<MezonIconCDN icon={iconFriend?.icon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</TouchableOpacity>
							<TouchableOpacity onPress={() => handleTransferFunds()} style={styles.transferFundsButton}>
								<MezonIconCDN icon={IconCDN.transactionIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</TouchableOpacity>
						</View>
					)}
					<View style={styles.userAvatar}>
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
							userStatus={status}
							customStatus={status?.status}
							isBorderBoxImage={true}
							statusUserStyles={styles.statusUser}
						/>
					</View>
					{status?.user_status ? (
						<>
							<View style={styles.badgeStatusTemp} />
							<View style={styles.badgeStatus}>
								<View style={styles.badgeStatusInside} />
								<Text numberOfLines={3} style={styles.customStatusText}>
									{status?.user_status}
								</Text>
							</View>
						</>
					) : null}
				</View>

				<View style={[styles.container]}>
					{manageVoiceUser?.isHavePermission && (
						<View style={[styles.userInfo, styles.userInfoGap]}>
							<Text style={[styles.title, styles.mediumFontSize]}>{t('channelVoiceSettings')}</Text>
							<View style={styles.wrapManageVoice}>
								{manageVoiceUser?.isShowMute && (
									<TouchableOpacity
										onPress={() => onActionVoice?.(IActionVoiceUser.MUTE)}
										style={[styles.actionItem, styles.actionItemRow]}
									>
										<MezonIconCDN
											icon={IconCDN.microphoneSlashIcon}
											color={themeValue.text}
											width={size.s_18}
											height={size.s_18}
										/>
										<Text style={[styles.actionText]}>{t('muteVoice')}</Text>
									</TouchableOpacity>
								)}

								<TouchableOpacity
									onPress={() => onActionVoice?.(IActionVoiceUser.KICK)}
									style={[styles.actionItem, styles.actionItemRow]}
								>
									<MezonIconCDN icon={IconCDN.removeFriend} color={themeValue.text} width={size.s_18} height={size.s_18} />
									<Text style={[styles.actionText]}>{t('kickVoice')}</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}
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
									(checkAnonymous ? 'Anonymous' : '')}
						</Text>
						<Text style={[styles.subUserName]}>
							{userById
								? userById?.user?.username || userById?.user?.display_name
								: user?.username ||
									user?.user?.username ||
									user?.display_name ||
									user?.user?.display_name ||
									(checkAnonymous ? 'Anonymous' : '')}
						</Text>
						{isCheckOwner && <EditUserProfileBtn user={userById || (user as any)} />}
						{!isCheckOwner && !manageVoiceUser && (
							<View style={styles.userAction}>
								{actionList.map((actionItem) => {
									const { action, icon, id, isShow, text, textStyleName } = actionItem;
									if (!isShow) return null;
									return (
										<TouchableOpacity key={id} onPress={() => action?.()} style={styles.actionItem}>
											{icon}
											<Text style={[styles.actionText, textStyleName && styles[textStyleName]]}>{text}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
						{isCheckOwner && (
							<View style={[styles.userAction]}>
								<TouchableOpacity onPress={navigateToMessageDetail} style={[styles.actionItem]}>
									<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.text} />
									<Text style={[styles.actionText]}>{t('userAction.sendMessage')}</Text>
								</TouchableOpacity>
							</View>
						)}
						{EFriendState.ReceivedRequestFriend === infoFriend?.state && (
							<View style={styles.friendRequestContainer}>
								<Text style={styles.receivedFriendRequestTitle}>{t('incomingFriendRequest')}</Text>
								<View style={styles.friendRequestActions}>
									<TouchableOpacity onPress={() => handleAcceptFriend()} style={[styles.button, styles.acceptButton]}>
										<Text style={styles.defaultText}>{t('accept')}</Text>
									</TouchableOpacity>
									<TouchableOpacity onPress={() => handleIgnoreFriend()} style={[styles.button, styles.ignoreButton]}>
										<Text style={styles.defaultText}>{t('ignore')}</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>

					{showAction && <UserVoiceInfo userId={userId || user?.id || ''} />}

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
								<View style={styles.aboutMeContainer}>
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
													<ImageNative url={role?.role_icon} style={styles.roleIcon} />
												) : (
													<View
														style={[styles.roleColorDot, { backgroundColor: role?.color || DEFAULT_ROLE_COLOR }]}
													></View>
												)}
												<Text style={[styles.textRole]} numberOfLines={1} ellipsizeMode="tail">
													{role?.title}
												</Text>
											</View>
										))}
									</View>
								</View>
							) : null}
							{isDMGroup && !isCheckOwner && isChannelOwner && (
								<View style={styles.actionGroupDM}>
									<UserInfoDm
										currentChannel={dmChannel || (currentChannel as ChannelsEntity)}
										user={userById || (user as any)}
										isShowRemoveGroup={dmChannel?.creator_id !== (userId || user?.id)}
									/>
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
