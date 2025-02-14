import { size } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './UserEmptyMessage.styles';

const UserEmptyMessage = ({ onPress }: { onPress: () => void }) => {
	const { t } = useTranslation(['userEmptyClan']);
	return (
		<View style={styles.wrapper}>
			<View style={{ marginTop: size.s_20 }}>
				<Text style={styles.title}>{t('emptyMessage.dMsWith')}</Text>
				<Text style={styles.description}>{t('emptyMessage.inviteYourFriends')}</Text>
			</View>
			<View style={{ marginTop: size.s_40 }}>
				<TouchableOpacity
					style={styles.addFriendsBtn}
					onPress={() => {
						onPress();
					}}
				>
					<Text style={styles.textAddFriends}>{t('emptyMessage.addFriend')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default UserEmptyMessage;
