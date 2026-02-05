import { useFriends } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import { selectBlockedUsers } from '@mezon/store-mobile';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import type { APP_SCREEN, SettingScreenProps } from '../../../../navigation/ScreenTypes';
import { style } from './styles';

type BlockedUsersScreen = typeof APP_SCREEN.SETTINGS.BLOCKED_USERS;
export const BlockedUsers = ({ navigation }: SettingScreenProps<BlockedUsersScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['accountSetting', 'userProfile']);
	const blockedUsers = useSelector(selectBlockedUsers);
	const { unBlockFriend } = useFriends();

	const handleUnblockFriend = useCallback(async (user: FriendsEntity) => {
		try {
			const isUnblocked = await unBlockFriend(user?.user?.username, user?.user?.id);
			if (isUnblocked) {
				Toast.show({
					type: 'success',
					text1: t('notification.unblockUser.success', { ns: 'userProfile' }),
				});
			}
		} catch (error) {
			console.error('Error unblocking friend:', error);
			Toast.show({
				type: 'error',
				text1: t('notification.unblockUser.error', { ns: 'userProfile' }),

			});
		}
	}, [t, unBlockFriend]);

	const renderBlockedUser = useCallback(({ item }: { item: FriendsEntity }) => (
		<View style={styles.userItem}>
			<View style={styles.userInfo}>
				<View style={styles.avatar}>
					<MezonClanAvatar
						image={item?.user?.avatar_url || ''}
						alt={item?.user?.username || ''}
					/>
				</View>
				<Text style={styles.username}>{item?.user?.display_name || item?.user?.username}</Text>
			</View>

			<TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblockFriend(item)}>
				<Text style={styles.unblockText}>{t('pendingContent.unblock', { ns: 'userProfile' })}</Text>
			</TouchableOpacity>
		</View>
	), [t, handleUnblockFriend]);

	return (
		<View style={styles.container}>
			{blockedUsers?.length > 0 ? (
				<FlatList
					data={blockedUsers}
					renderItem={renderBlockedUser}
					keyExtractor={(item) => item?.id}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.listContent}
					initialNumToRender={1}
					maxToRenderPerBatch={1}
					windowSize={2}
				/>
			) : (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>{t('doNotHaveBlockedUser')}</Text>
				</View>
			)}
		</View>
	);
};
