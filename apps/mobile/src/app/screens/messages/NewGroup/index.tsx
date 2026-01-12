import { size, useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import {
	appActions,
	channelUsersActions,
	directActions,
	selectAllAccount,
	selectAllFriends,
	selectDirectById,
	selectRawDataUserGroup,
	useAppDispatch
} from '@mezon/store-mobile';
import { GROUP_CHAT_MAXIMUM_MEMBERS } from '@mezon/utils';
import type { User } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import type { ApiCreateChannelDescRequest } from 'mezon-js/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { EFriendItemAction } from '../../../components/FriendItem';
import { FriendListByAlphabet } from '../../../components/FriendListByAlphabet';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { UserInformationBottomSheet } from '../../../components/UserInformationBottomSheet';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';
import { checkNotificationPermissionAndNavigate } from '../../../utils/notificationPermissionHelper';
import { style } from './styles';

export const NewGroupScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { directMessageId, fromUser = false } = route?.params || {};
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation(['common', 'friends']);
	const [friendIdSelectedList, setFriendIdSelectedList] = useState<string[]>([]);
	const allUser = useSelector(selectAllFriends);
	const dispatch = useAppDispatch();
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [selectedFriendDefault, setSelectedFriendDefault] = useState<string[]>([]);
	const directMessageIdRef = useRef<string>('');
	const memoizedDirectMessageId = useMemo(() => {
		return directMessageId || directMessageIdRef.current || '';
	}, [directMessageId]);
	const currentDirectMessage = useSelector((state) => selectDirectById(state, memoizedDirectMessageId));
	const allUserGroupDM = useSelector((state) => selectRawDataUserGroup(state, memoizedDirectMessageId));
	const currentUser = useSelector(selectAllAccount);

	const isFriendListEmpty = useMemo(() => {
		return friendIdSelectedList?.length === 0;
	}, [friendIdSelectedList]);

	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user?.state === 0);
	}, [allUser]);

	const filteredFriendList = useMemo(() => {
		return friendList.filter(
			(friend) =>
				normalizeString(friend?.user?.username).includes(normalizeString(searchText)) ||
				normalizeString(friend?.user?.displayName).includes(normalizeString(searchText))
		);
	}, [friendList, searchText]);

	const handleFriendAction = useCallback((friend: FriendsEntity, action: EFriendItemAction) => {
		switch (action) {
			case EFriendItemAction.ShowInformation:
				setSelectedUser(friend?.user);
				break;
			default:
				break;
		}
	}, []);

	useEffect(() => {
		if (currentDirectMessage?.id) {
			setSelectedFriendDefault(allUserGroupDM?.userIds || []);
			setFriendIdSelectedList([]);
		}
	}, [currentDirectMessage?.id, allUserGroupDM?.userIds]);

	const onSelectedChange = useCallback(
		(friendIdSelected: string[]) => {
			if (currentDirectMessage?.type === ChannelType.CHANNEL_TYPE_GROUP) {
				const newMembers = friendIdSelected?.filter((userId) => !selectedFriendDefault?.includes(userId));
				setFriendIdSelectedList(newMembers);
			} else {
				const newMembers = friendIdSelected?.filter((userId) => userId !== currentUser?.user?.id);
				setFriendIdSelectedList(newMembers);
			}
		},
		[currentDirectMessage?.type, selectedFriendDefault, currentUser?.user?.id]
	);

	const handleMenuThreadBack = () => {
		navigation.replace(APP_SCREEN.MENU_THREAD.STACK, {
			screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET,
			params: { directMessage: currentDirectMessage }
		});
	};

	const handleAddMemberToGroupChat = async (listAdd: ApiCreateChannelDescRequest) => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const listMembersAdd = listAdd?.userIds?.filter((userId) => !currentDirectMessage?.userIds?.includes(userId)) ?? [];
			await dispatch(
				channelUsersActions.addChannelUsers({
					channelId: currentDirectMessage?.channelId as string,
					clanId: currentDirectMessage?.clanId as string,
					userIds: listMembersAdd,
					channelType: currentDirectMessage?.type
				})
			);
			handleMenuThreadBack();
		} catch (error) {
			console.error('Error adding member to group chat:', error);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const createNewGroup = async () => {
		if (isFriendListEmpty) return;
		const bodyCreateDmGroup: ApiCreateChannelDescRequest = {
			type: friendIdSelectedList?.length > 1 ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM,
			channelPrivate: 1,
			userIds: friendIdSelectedList,
			clanId: '0'
		};

		if (currentDirectMessage?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			handleAddMemberToGroupChat(bodyCreateDmGroup);
			return;
		}

		const userNameGroup: string[] = [];
		const avatarGroup: string[] = [];

		friendIdSelectedList?.forEach((friendId) => {
			const friend = friendList?.find((item) => item?.id === friendId);
			if (friend?.user) {
				userNameGroup.push(friend.user?.displayName || friend.user?.username || '');
				avatarGroup.push(friend.user?.avatarUrl || '');
			}
		});

		if (currentUser?.user) {
			userNameGroup.push(currentUser.user?.displayName || currentUser.user?.username || '');
			avatarGroup.push(currentUser.user?.avatarUrl || '');
		}

		const response = await dispatch(
			directActions.createNewDirectMessage({ body: bodyCreateDmGroup, username: userNameGroup, avatar: avatarGroup })
		);
		const resPayload = response.payload as ApiCreateChannelDescRequest;
		if (resPayload.channelId) {
			await checkNotificationPermissionAndNavigate(() => {
				if (isTabletLandscape) {
					dispatch(directActions.setDmGroupCurrentId(resPayload?.channelId || ''));
					navigation.navigate(APP_SCREEN.MESSAGES.HOME);
				} else {
					directMessageIdRef.current = resPayload?.channelId || '';
					if (fromUser) {
						navigation.popToTop();
						navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
							directMessageId: resPayload.channelId,
							from: APP_SCREEN.MESSAGES.NEW_GROUP
						});
					} else {
						navigation.replace(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
							directMessageId: resPayload.channelId,
							from: APP_SCREEN.MESSAGES.NEW_GROUP
						});
					}
				}
			});
		}
	};

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const typingSearchDebounce = useThrottledCallback((text) => setSearchText(text), 500);
	return (
		<View style={styles.newGroupContainer}>
			<StatusBarHeight />
			<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<View style={styles.wrapper}>
					<View style={styles.headerWrapper}>
						<Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
							<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={20} width={20} color={themeValue.text} />
						</Pressable>
						<View style={styles.screenTitleWrapper}>
							<Text style={styles.screenTitle}>
								{currentDirectMessage?.type === ChannelType.CHANNEL_TYPE_GROUP
									? t('screen:headerTitle.addMembers')
									: t('screen:headerTitle.newGroup')}
							</Text>
							<Text>
								{t('groupMembers', {
									members: selectedFriendDefault?.length + friendIdSelectedList?.length,
									total: GROUP_CHAT_MAXIMUM_MEMBERS
								})}
							</Text>
						</View>
						<View style={styles.actions}>
							<Pressable disabled={isFriendListEmpty} onPress={() => createNewGroup()}>
								<Text style={[styles.actionText, isFriendListEmpty && styles.actionTextDisabled]}>
									{currentDirectMessage?.type === ChannelType.CHANNEL_TYPE_GROUP
										? t('message:newMessage.add')
										: t('message:newMessage.create')}
								</Text>
							</Pressable>
						</View>
					</View>

					<View style={styles.contentWrapper}>
						<View style={styles.searchFriend}>
							<Feather size={size.s_18} name="search" color={themeValue.text} />
							<TextInput
								placeholder={t('common:searchPlaceHolder')}
								placeholderTextColor={themeValue.textDisabled}
								style={styles.searchInput}
								onChangeText={(text) => typingSearchDebounce(text)}
							/>
						</View>

						<View style={styles.friendListWrapper}>
							<FriendListByAlphabet
								isSearching={Boolean(searchText?.trim()?.length)}
								friendList={filteredFriendList}
								handleFriendAction={handleFriendAction}
								selectMode={true}
								onSelectedChange={onSelectedChange}
								selectedFriendDefault={selectedFriendDefault}
								fromDM={directMessageId && fromUser}
							/>
						</View>
					</View>

					<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};
