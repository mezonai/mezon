import { useDirect, useFriends } from '@mezon/core';
import { ChevronIcon, UserGroupIcon, UserIcon } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { FriendsEntity, selectDirectsOpenlist } from '@mezon/store-mobile';
import { User } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { SeparatorWithLine } from '../../../components/Common';
import { EFriendItemAction } from '../../../components/FriendItem';
import { FriendListByAlphabet } from '../../../components/FriendListByAlphabet';
import { UserInformationBottomSheet } from '../../../components/UserInformationBottomSheet';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';
import { style } from './styles';

export const NewMessageScreen = ({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [searchText, setSearchText] = useState<string>('');
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const { t } = useTranslation(['']);
	const { friends: allUser } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const listDM = useSelector(selectDirectsOpenlist);
	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user.state === 0);
	}, [allUser]);

	const inputRef = useRef(null);

	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	const navigateToNewGroupScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_GROUP });
	};

	const filteredFriendList = useMemo(() => {
		return friendList.filter(
			(friend) =>
				normalizeString(friend?.user?.username).includes(normalizeString(searchText)) ||
				normalizeString(friend?.user?.display_name).includes(normalizeString(searchText))
		);
	}, [friendList, searchText]);

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

	const handleFriendAction = useCallback(
		(friend: FriendsEntity, action: EFriendItemAction) => {
			switch (action) {
				case EFriendItemAction.Call:
					Toast.show({ type: 'info', text1: 'Updating...' });
					break;
				case EFriendItemAction.MessageDetail:
					directMessageWithUser(friend?.user?.id);
					break;
				case EFriendItemAction.ShowInformation:
					setSelectedUser(friend?.user);
					break;
				default:
					break;
			}
		},
		[directMessageWithUser]
	);

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const typingSearchDebounce = useThrottledCallback((text) => setSearchText(text), 500);

	return (
		<View style={styles.newMessageContainer}>
			<View style={styles.searchFriend}>
				<Text style={styles.defaultText}>{t('message:newMessage.to')}: </Text>
				<TextInput
					ref={inputRef}
					placeholder={t('common:searchPlaceHolder')}
					placeholderTextColor={themeValue.textDisabled}
					style={styles.searchInput}
					onChangeText={(text) => typingSearchDebounce(text)}
					autoFocus
				/>
			</View>

			<View style={styles.actionsWrapper}>
				<TouchableOpacity onPress={() => navigateToNewGroupScreen()} style={styles.actionItem}>
					<View style={[styles.actionIconWrapper, styles.bgNewGroupIcon]}>
						<UserGroupIcon />
					</View>
					<Text style={styles.actionTitle}>{t('message:newMessage.newGroup')}</Text>
					<ChevronIcon height={15} width={15} color={themeValue.text} />
				</TouchableOpacity>
				<SeparatorWithLine />
				<TouchableOpacity onPress={() => navigateToAddFriendScreen()} style={styles.actionItem}>
					<View style={[styles.actionIconWrapper, styles.bgAddFriendIcon]}>
						<UserIcon />
					</View>
					<Text style={styles.actionTitle}>{t('message:newMessage.addFriend')}</Text>
					<ChevronIcon height={15} width={15} color={themeValue.text} />
				</TouchableOpacity>
			</View>

			<FriendListByAlphabet
				isSearching={Boolean(searchText?.trim()?.length)}
				friendList={filteredFriendList}
				handleFriendAction={handleFriendAction}
				showAction={false}
			/>

			<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
		</View>
	);
};
