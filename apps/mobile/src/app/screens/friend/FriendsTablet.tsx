import { useDirect, useFriends } from '@mezon/core';
import { ChevronIcon, PaperPlaneIcon } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { FriendsEntity, directActions, getStore, selectDirectsOpenlist, useAppDispatch } from '@mezon/store-mobile';
import { User } from 'mezon-js';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import { useThrottledCallback } from 'use-debounce';
import { EFriendItemAction } from '../../components/FriendItem';
import { FriendListByAlphabet } from '../../components/FriendListByAlphabet';
import { UserInformationBottomSheet } from '../../components/UserInformationBottomSheet';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { normalizeString } from '../../utils/helpers';
import { style } from './styles';

export const FriendsTablet = React.memo(({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation(['common', 'friends']);
	const { friends: allUser } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const store = getStore();
	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user.state === 0);
	}, [allUser]);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	const navigateToRequestFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.REQUEST_FRIEND });
	};

	const filteredFriendList = useMemo(() => {
		return friendList.filter((friend) => normalizeString(friend?.user?.username || '').includes(normalizeString(searchText)));
	}, [friendList, searchText]);

	const friendRequestCount = useMemo(() => {
		return {
			sent: allUser.filter((user) => user.state === 1)?.length,
			received: allUser.filter((user) => user.state === 2)?.length
		};
	}, [allUser]);

	const directMessageWithUser = useCallback(
		async (user: FriendsEntity) => {
			const listDM = selectDirectsOpenlist(store.getState() as any);
			const directMessage = listDM.find((dm) => {
				const userIds = dm?.user_id;
				return Array.isArray(userIds) && userIds.length === 1 && userIds[0] === user?.user?.id;
			});
			dispatch(directActions.setDmGroupCurrentId(directMessage?.id));

			if (directMessage?.id) {
				return;
			}
			const response = await createDirectMessageWithUser(
				user?.user?.id || '',
				user?.user?.display_name,
				user?.user?.username,
				user?.user?.avatar_url
			);
			dispatch(directActions.setDmGroupCurrentId(response?.channel_id));
		},
		[createDirectMessageWithUser, navigation]
	);

	const handleFriendAction = useCallback(
		(friend: FriendsEntity, action: EFriendItemAction) => {
			switch (action) {
				case EFriendItemAction.Call:
					Toast.show({ type: 'info', text1: 'Updating...' });
					break;
				case EFriendItemAction.MessageDetail:
					directMessageWithUser(friend);
					break;
				case EFriendItemAction.ShowInformation:
					setSelectedUser(friend?.user || null);
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
		<View style={styles.friendContainer}>
			<View style={styles.searchFriend}>
				<Feather size={18} name="search" style={{ color: themeValue.text }} />
				<TextInput
					placeholder={t('common:searchPlaceHolder')}
					placeholderTextColor={themeValue.textDisabled}
					style={styles.searchInput}
					onChangeText={(text) => typingSearchDebounce(text)}
				/>
			</View>

			{filteredFriendList?.length === 0 ? (
				<View>
					<Text style={styles.defaultText}>{t('friends:noFriendsResultsFound')}</Text>
				</View>
			) : null}

			{!searchText?.trim()?.length || filteredFriendList?.length === 0 ? (
				<Pressable style={styles.requestFriendWrapper} onPress={() => navigateToRequestFriendScreen()}>
					<PaperPlaneIcon width={25} color={themeValue.text} />
					<View style={styles.fill}>
						<Text style={styles.defaultText}>{t('friends:friendRequest.title')}</Text>
						<View style={styles.requestContentWrapper}>
							<Text style={styles.defaultText}>
								{friendRequestCount.received} {t('friends:friendRequest.received')}
							</Text>
							<Text style={styles.defaultText}>•</Text>
							<Text style={styles.defaultText}>
								{friendRequestCount.sent} {t('friends:friendRequest.sent')}
							</Text>
						</View>
					</View>
					<ChevronIcon width={25} color={themeValue.text} />
				</Pressable>
			) : null}
			<FriendListByAlphabet
				isSearching={Boolean(searchText?.trim()?.length)}
				friendList={filteredFriendList}
				handleFriendAction={handleFriendAction}
				showAction={true}
			/>

			<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
		</View>
	);
});
