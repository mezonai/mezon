import { useFriends } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { FriendsEntity } from '@mezon/store-mobile';
import { User } from 'mezon-js';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SeparatorWithLine } from '../../../components/Common';
import { EFriendItemAction, FriendItem } from '../../../components/FriendItem';
import { UserInformationBottomSheet } from '../../../components/UserInformationBottomSheet';
import { EmptyFriendRequest } from './EmptyFriendRequest';
import { style } from './styles';

export enum EFriendRequest {
	Received,
	Sent
}

export const RequestFriendScreen = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [selectedTab, setSelectedTab] = useState(EFriendRequest.Received);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const { friends, acceptFriend, deleteFriend } = useFriends();
	const { t } = useTranslation('friends');
	const friendRequestTabs = [
		{
			title: t('friendRequest.received'),
			type: EFriendRequest.Received
		},
		{
			title: t('friendRequest.sent'),
			type: EFriendRequest.Sent
		}
	];

	const handleFriendAction = useCallback(
		(friend: FriendsEntity, action: EFriendItemAction) => {
			switch (action) {
				case EFriendItemAction.Delete:
					deleteFriend(friend?.user?.username, friend?.user?.id);
					break;
				case EFriendItemAction.Approve:
					acceptFriend(friend?.user?.username, friend?.user?.id);
					break;
				case EFriendItemAction.ShowInformation:
					setSelectedUser(friend?.user);
					break;
				default:
					break;
			}
		},
		[acceptFriend, deleteFriend]
	);

	const receivedFriendRequestList = useMemo(() => {
		return friends.filter((friend) => friend.state === 2);
	}, [friends]);

	const sentFriendRequestList = useMemo(() => {
		return friends.filter((friend) => friend.state === 1);
	}, [friends]);

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const renderEmptyComponent = useCallback(() => {
		return <EmptyFriendRequest type={selectedTab} />;
	}, [selectedTab]);

	return (
		<View style={styles.requestFriendContainer}>
			<View style={styles.toggleWrapper}>
				{friendRequestTabs.map((tab) => {
					return (
						<Pressable
							key={tab.type}
							onPress={() => setSelectedTab(tab.type)}
							style={[styles.tab, selectedTab === tab.type && styles.activeTab]}
						>
							<Text style={[styles.tabTitle, selectedTab === tab.type && styles.activeTabTitle]}>{tab.title}</Text>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.groupWrapper}>
				<FlatList
					data={selectedTab === EFriendRequest.Received ? receivedFriendRequestList : sentFriendRequestList}
					ItemSeparatorComponent={SeparatorWithLine}
					keyExtractor={(friend) => friend.id.toString()}
					renderItem={({ item }) => <FriendItem friend={item} handleFriendAction={handleFriendAction} />}
					ListEmptyComponent={renderEmptyComponent}
					initialNumToRender={1}
					maxToRenderPerBatch={1}
					windowSize={2}
				/>
			</View>

			<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
		</View>
	);
};
