import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuth, useDirect, useFriends, useMemberCustomStatus, useMemberStatus } from '@mezon/core';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	RolesClanEntity,
	selectAccountCustomStatus,
	selectAllRolesClan,
	selectDirectsOpenlist,
	selectMemberClanByUserId2,
	useAppSelector
} from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR, IMessageWithUser } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useMixImageColor } from '../../../../../../app/hooks/useMixImageColor';
import { APP_SCREEN } from '../../../../../../app/navigation/ScreenTypes';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import { getUserStatusByMetadata } from '../../../../../utils/helpers';
import { style } from './UserProfile.styles';
import ActivityAppComponent from './component/ActivityAppComponent';
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
	({ userId, user, onClose, checkAnonymous, message, showAction = true, showRole = true, currentChannel }: userProfileProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { userProfile } = useAuth();
		const { t } = useTranslation(['userProfile']);
		const userById = useAppSelector((state) => selectMemberClanByUserId2(state, userId || user?.id));
		const userStatus = useMemberStatus(userId || user?.id);
		const rolesClan: RolesClanEntity[] = useSelector(selectAllRolesClan);
		const messageAvatar = useMemo(() => {
			return message?.clan_avatar || message?.avatar;
		}, [message?.clan_avatar, message?.avatar]);
		const { color } = useMixImageColor(messageAvatar || userById?.clan_avatar || userById?.user?.avatar_url || userProfile?.user?.avatar_url);
		const navigation = useNavigation<any>();
		const { createDirectMessageWithUser } = useDirect();
		const listDM = useSelector(selectDirectsOpenlist);
		const userCustomStatus = useMemberCustomStatus(userId || user?.id || '');
		const { friends: allUser = [], acceptFriend, deleteFriend, addFriend } = useFriends();
		const [isShowPendingContent, setIsShowPendingContent] = useState(false);
		const isDMGroup = useMemo(() => [ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type), [currentChannel?.type]);
		const { dismiss } = useBottomSheetModal();
		const currentUserCustomStatus = useSelector(selectAccountCustomStatus);

		const isDM = useMemo(() => {
			return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
		}, [currentChannel]);

		const status = getUserStatusByMetadata(user?.user?.metadata);

		const isKicked = useMemo(() => {
			return !userById;
		}, [userById]);

		const targetUser = useMemo(() => {
			return allUser?.find?.((targetUser) => [user?.id, userId].includes(targetUser?.user?.id));
		}, [user?.id, userId, allUser]);

		const userRolesClan = useMemo(() => {
			return userById?.role_id ? rolesClan?.filter?.((role) => userById?.role_id?.includes(role.id)) : [];
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
				const directMessage = listDM?.find?.((dm) => dm?.user_id?.length === 1 && dm?.user_id[0] === userId);
				if (directMessage?.id) {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: directMessage?.id });
					return;
				}
				const response = await createDirectMessageWithUser(userId);
				if (response?.channel_id) {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: response?.channel_id });
				}
			},
			[createDirectMessageWithUser, listDM, navigation]
		);

		const navigateToMessageDetail = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			if (onClose && typeof onClose === 'function') {
				onClose();
			}
			directMessageWithUser(userId || user?.id);
			dismiss();
		};

		const actionList = [
			{
				id: 1,
				text: t('userAction.sendMessage'),
				icon: <Icons.ChatIcon color={themeValue.text} />,
				action: navigateToMessageDetail,
				isShow: true
			},
			// {
			// 	id: 2,
			// 	text: t('userAction.voiceCall'),
			// 	icon: <Icons.PhoneCallIcon color={themeValue.text} />,
			// 	action: () => {
			// 		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			// 			screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
			// 			params: {
			// 				receiverId: userById?.user?.id,
			// 				receiverAvatar: userById?.user?.avatar_url
			// 			}
			// 		});
			// 	},
			// 	isShow: !!targetUser && ![EFriendState.ReceivedRequestFriend, EFriendState.SentRequestFriend].includes(targetUser?.state)
			// },
			// {
			// 	id: 3,
			// 	text: t('userAction.videoCall'),
			// 	icon: <Icons.VideoIcon color={themeValue.text} />,
			// 	action: () => {
			// 		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			// 			screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
			// 			params: {
			// 				receiverId: userById?.user?.id,
			// 				receiverAvatar: userById?.user?.avatar_url,
			// 				isVideoCall: true
			// 			}
			// 		});
			// 	},
			// 	isShow: !!targetUser && ![EFriendState.ReceivedRequestFriend, EFriendState.SentRequestFriend].includes(targetUser?.state)
			// },
			{
				id: 4,
				text: t('userAction.addFriend'),
				icon: <Icons.UserPlusIcon color={Colors.green} />,
				action: () => {
					const userIdToAddFriend = userId || user?.id;
					if (userIdToAddFriend) {
						addFriend({
							usernames: [],
							ids: [userIdToAddFriend]
						});
					}
				},
				isShow: !targetUser,
				textStyles: {
					color: Colors.green
				}
			},
			{
				id: 5,
				text: t('userAction.pending'),
				icon: <Icons.ClockIcon color={Colors.goldenrodYellow} />,
				action: () => {
					setIsShowPendingContent(true);
				},
				isShow: !!targetUser && [EFriendState.ReceivedRequestFriend, EFriendState.SentRequestFriend].includes(targetUser?.state),
				textStyles: {
					color: Colors.goldenrodYellow
				}
			}
		];

		const handleAcceptFriend = () => {
			acceptFriend(targetUser?.user?.username, targetUser?.user?.id);
		};

		const handleIgnoreFriend = () => {
			deleteFriend(targetUser?.user?.username, targetUser?.user?.id);
		};
		const isChannelOwner = useMemo(() => {
			return currentChannel?.creator_id === userProfile?.user?.id;
		}, [currentChannel?.creator_id, userProfile?.user?.id]);

		const isShowUserContent = useMemo(() => {
			return !!userById?.user?.about_me || (showRole && userRolesClan?.length) || showAction || (isDMGroup && isChannelOwner && !isCheckOwner);
		}, [userById?.user?.about_me, showAction, showRole, userRolesClan, isDMGroup, isCheckOwner, isChannelOwner]);

		if (isShowPendingContent) {
			return (
				<View style={[styles.wrapper]}>
					<PendingContent targetUser={targetUser} onClose={() => setIsShowPendingContent(false)} />
				</View>
			);
		}

		return (
			<View style={[styles.wrapper]}>
				<View style={[styles.backdrop, { backgroundColor: userById || user?.avatar_url ? color : Colors.titleReset }]}>
					<View style={[styles.userAvatar]}>
						<MezonAvatar
							width={size.s_80}
							height={size.s_80}
							avatarUrl={
								!isDM
									? messageAvatar || userById?.clan_avatar || userById?.user?.avatar_url
									: userById?.user?.avatar_url || user?.user?.avatar_url || user?.avatar_url || messageAvatar
							}
							username={user?.user?.username}
							userStatus={userStatus}
							customStatus={status}
							isBorderBoxImage={true}
							statusUserStyles={styles.statusUser}
						/>
					</View>
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
									user?.username ||
									user?.user?.display_name ||
									(checkAnonymous ? 'Anonymous' : message?.username)}
						</Text>
						<Text style={[styles.subUserName]}>
							{userById
								? userById?.user?.username
								: user?.username || user?.user?.display_name || (checkAnonymous ? 'Anonymous' : message?.username)}
						</Text>
						{displayStatus ? <Text style={styles.customStatusText}>{displayStatus}</Text> : null}
						{isCheckOwner && <EditUserProfileBtn user={userById || (user as any)} />}
						{!isCheckOwner && (
							<View style={[styles.userAction]}>
								{actionList.map((actionItem) => {
									const { action, icon, id, isShow, text, textStyles } = actionItem;
									if (!isShow) return null;
									return (
										<TouchableOpacity key={id} onPress={() => action()} style={[styles.actionItem]}>
											{icon}
											<Text style={[styles.actionText, textStyles && textStyles]}>{text}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
						{EFriendState.ReceivedRequestFriend === targetUser?.state && (
							<View style={{ marginTop: size.s_16 }}>
								<Text style={styles.receivedFriendRequestTitle}>{t('incomingFriendRequest')}</Text>
								<View style={{ flexDirection: 'row', gap: size.s_10, marginTop: size.s_10 }}>
									<TouchableOpacity onPress={() => handleAcceptFriend()} style={[styles.button, { backgroundColor: Colors.green }]}>
										<Text style={styles.defaultText}>{t('accept')}</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleIgnoreFriend()}
										style={[styles.button, { backgroundColor: Colors.bgGrayDark }]}
									>
										<Text style={styles.defaultText}>{t('ignore')}</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>

					{isShowUserContent && (
						<View style={[styles.roleGroup]}>
							{!isDMGroup && (userById?.user?.create_time || user?.create_time || user?.user?.create_time) && (
								<View style={styles.memberSince}>
									<Text style={styles.title}>{t('userInfoDM.mezonMemberSince')}</Text>
									<Text style={styles.subUserName}>
										{formatDate(userById?.user?.create_time || user?.create_time || user?.user?.create_time)}
									</Text>
								</View>
							)}
							{!!userById?.user?.about_me && (
								<View style={{ padding: size.s_16 }}>
									<Text style={[styles.aboutMe]}>{t('aboutMe.headerTitle')}</Text>
									<Text style={[styles.aboutMeText]}>{userById?.user?.about_me}</Text>
								</View>
							)}
							<ActivityAppComponent userId={userId || user?.id || ''} />
							{userRolesClan?.length && showRole && !isDM ? (
								<View>
									<Text style={[styles.title]}>{t('aboutMe.roles.headerTitle')}</Text>
									<View style={[styles.roles]}>
										{userRolesClan?.map((role, index) => (
											<View style={[styles.roleItem]} key={`${role.id}_${index}`}>
												<View
													style={{
														width: size.s_15,
														height: size.s_15,
														borderRadius: size.s_50,
														backgroundColor: role?.color || DEFAULT_ROLE_COLOR
													}}
												></View>
												<Text style={[styles.textRole]}>{role?.title}</Text>
											</View>
										))}
									</View>
								</View>
							) : null}
							{isDMGroup && !isCheckOwner && isChannelOwner && (
								<UserInfoDm currentChannel={currentChannel} user={userById || (user as any)} />
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
