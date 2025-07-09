import { useTheme } from '@mezon/mobile-ui';
import { View } from 'react-native';
import { APP_SCREEN, SettingScreenProps } from '../../../../navigation/ScreenTypes';
import { style } from './styles';

type BlockedUsersScreen = typeof APP_SCREEN.SETTINGS.BLOCKED_USERS;
export const BlockedUsers = ({ navigation }: SettingScreenProps<BlockedUsersScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	// const { t } = useTranslation(['accountSetting', 'userProfile']);

	// const renderBlockedUser = ({ item }: { item: FriendsEntity }) => (
	// 	<View style={styles.userItem}>
	// 		<View style={styles.userInfo}>
	// 			{item?.user?.avatar_url ? (
	// 				<Image source={{ uri: createImgproxyUrl(item?.user?.avatar_url) }} style={styles.avatar} />
	// 			) : (
	// 				<View style={styles.avatarPlaceholder}>
	// 					<Text style={styles.avatarText}>{(item?.user?.username?.[0] || '').toUpperCase()}</Text>
	// 				</View>
	// 			)}
	// 			<Text style={styles.username}>{item?.user?.username}</Text>
	// 		</View>

	// 		<TouchableOpacity style={styles.unblockButton}>
	// 			<Text style={styles.unblockText}>{t('pendingContent.unblock', { ns: 'userProfile' })}</Text>
	// 		</TouchableOpacity>
	// 	</View>
	// );

	return (
		<View style={styles.container}>
			{/* {blockedUsers?.length > 0 ? (
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
			)} */}
		</View>
	);
};
