import { useFriends } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import type { ApiUser } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { SeparatorWithLine } from '../../../components/Common';
import { EFriendItemAction, FriendItem } from '../../../components/FriendItem';
import { UserInformationBottomSheet } from '../../../components/UserInformationBottomSheet';
import { IconCDN } from '../../../constants/icon_cdn';
import { EFriendRequest } from '../RequestFriend';
import { EmptyFriendRequest } from '../RequestFriend/EmptyFriendRequest';
import { AddFriendModal } from './components/AddFriendModal';
import { style } from './styles';

export const AddFriendScreen = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { friends, acceptFriend, deleteFriend } = useFriends();
	const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
	const { t } = useTranslation('friends');
	const receivedFriendRequestList = useMemo(() => {
		return friends.filter((friend) => friend.state === 2);
	}, [friends]);

	const handleFriendAction = useCallback(
		(friend: FriendsEntity, action: EFriendItemAction) => {
			switch (action) {
				case EFriendItemAction.Delete:
					deleteFriend(friend?.user?.username, friend?.user?.id);
					break;
				case EFriendItemAction.Approve:
					acceptFriend(friend?.user?.username, friend?.user?.id, true);
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

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const renderEmptyFriendRequest = useCallback(() => {
		return <EmptyFriendRequest type={EFriendRequest.Received} />;
	}, []);

	const onOpenAddFriendModal = useCallback(() => {
		const data = {
			children: <AddFriendModal />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	return (
		<View style={styles.addFriendContainer}>
			<View style={styles.groupWrapper}>
				<TouchableOpacity onPress={onOpenAddFriendModal} style={styles.addFriendItem}>
					<Text style={styles.addFriendText}>{t('addFriend.addByUserName')}</Text>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
				</TouchableOpacity>
			</View>
			{receivedFriendRequestList?.length > 0 && <Text style={styles.whiteText}>{t('addFriend.incomingFriendRequest')}</Text>}
			<FlatList
				style={{ flex: 1 }}
				data={receivedFriendRequestList}
				ItemSeparatorComponent={SeparatorWithLine}
				keyExtractor={(friend) => friend.id.toString()}
				renderItem={({ item }) => <FriendItem friend={item} handleFriendAction={handleFriendAction} />}
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={2}
				ListEmptyComponent={renderEmptyFriendRequest}
			/>

			<UserInformationBottomSheet user={selectedUser} onClose={onClose} showAction={false} showRole={false} />
		</View>
	);
};
