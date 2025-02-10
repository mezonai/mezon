import { useFriends } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { DirectEntity, FriendsEntity, channelUsersActions, directActions, useAppDispatch } from '@mezon/store-mobile';
import { ChannelType, User } from 'mezon-js';
import { ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useThrottledCallback } from 'use-debounce';
import { EFriendItemAction } from '../../../components/FriendItem';
import { FriendListByAlphabet } from '../../../components/FriendListByAlphabet';
import { UserInformationBottomSheet } from '../../../components/UserInformationBottomSheet';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';
import { style } from './styles';

export const NewGroupScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const directMessage = route?.params?.directMessage as DirectEntity;
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation(['common', 'friends']);
	const [friendIdSelectedList, setFriendIdSelectedList] = useState<string[]>([]);
	const { friends: allUser } = useFriends();
	const dispatch = useAppDispatch();
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [selectedFriendDefault, setSelectedFriendDefault] = useState<string[]>([]);

	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user.state === 0);
	}, [allUser]);

	const filteredFriendList = useMemo(() => {
		return friendList.filter(
			(friend) =>
				normalizeString(friend?.user?.username).includes(normalizeString(searchText)) ||
				normalizeString(friend?.user?.display_name).includes(normalizeString(searchText))
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
		if (directMessage?.id) {
			setSelectedFriendDefault(directMessage?.user_id || []);
		}
	}, [directMessage]);

	const onSelectedChange = useCallback((friendIdSelected: string[]) => {
		setFriendIdSelectedList(friendIdSelected);
	}, []);

	const handleMenuThreadBack = () => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET, params: { directMessage } });
	};

	const handleAddMemberToGroupChat = async (listAdd: ApiCreateChannelDescRequest) => {
		await dispatch(
			channelUsersActions.addChannelUsers({
				channelId: directMessage?.channel_id as string,
				clanId: directMessage?.clan_id as string,
				userIds: listAdd.user_ids ?? [],
				channelType: directMessage?.type
			})
		);
		handleMenuThreadBack();
	};

	const createNewGroup = async () => {
		if (friendIdSelectedList?.length === 0) return;
		const bodyCreateDmGroup: ApiCreateChannelDescRequest = {
			type: friendIdSelectedList?.length > 1 ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM,
			channel_private: 1,
			user_ids: friendIdSelectedList,
			clan_id: '0'
		};

		if (directMessage?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			handleAddMemberToGroupChat(bodyCreateDmGroup);
			return;
		}

		const response = await dispatch(directActions.createNewDirectMessage(bodyCreateDmGroup));
		const resPayload = response.payload as ApiCreateChannelDescRequest;
		if (resPayload.channel_id) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: resPayload.channel_id, from: APP_SCREEN.MESSAGES.NEW_GROUP });
		}
	};

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const typingSearchDebounce = useThrottledCallback((text) => setSearchText(text), 500);
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: themeValue.primary }}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<View style={styles.newGroupContainer}>
					<View style={styles.headerWrapper}>
						<Pressable onPress={() => navigation.goBack()}>
							<Icons.ArrowLargeLeftIcon height={20} width={20} color={themeValue.text} />
						</Pressable>
						<View style={styles.screenTitleWrapper}>
							<Text style={styles.screenTitle}>
								{directMessage?.type === ChannelType.CHANNEL_TYPE_GROUP
									? t('screen:headerTitle.addMembers')
									: t('screen:headerTitle.newGroup')}
							</Text>
						</View>
						<View style={styles.actions}>
							<Pressable onPress={() => createNewGroup()}>
								<Text style={styles.actionText}>
									{directMessage?.type === ChannelType.CHANNEL_TYPE_GROUP
										? t('message:newMessage.add')
										: t('message:newMessage.create')}
								</Text>
							</Pressable>
						</View>
					</View>

					<View style={styles.contentWrapper}>
						{/* TODO: update later - autocomplete input */}
						<View style={styles.searchFriend}>
							<Feather size={18} name="search" style={{ color: themeValue.text }} />
							<TextInput
								placeholder={t('common:searchPlaceHolder')}
								placeholderTextColor={themeValue.text}
								style={styles.searchInput}
								onChangeText={(text) => typingSearchDebounce(text)}
							/>
						</View>

						<FriendListByAlphabet
							isSearching={Boolean(searchText?.trim()?.length)}
							friendList={filteredFriendList}
							handleFriendAction={handleFriendAction}
							selectMode={true}
							onSelectedChange={onSelectedChange}
							selectedFriendDefault={selectedFriendDefault}
						/>
					</View>

					<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
				</View>
			</TouchableWithoutFeedback>
		</SafeAreaView>
	);
};
