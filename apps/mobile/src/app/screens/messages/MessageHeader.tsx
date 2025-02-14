import { Icons } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllFriends } from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

const FriendState = {
	PENDING: 2
};
function MessageHeader() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['dmMessage']);
	const navigation = useNavigation<any>();

	const friends = useSelector(selectAllFriends);

	const quantityPendingRequest = useMemo(() => {
		return friends?.filter((friend) => friend?.state === FriendState.PENDING)?.length || 0;
	}, [friends]);

	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	return (
		<View style={styles.headerWrapper}>
			<Text style={styles.headerTitle}>{t('dmMessage:title')}</Text>
			<Pressable style={styles.addFriendWrapper} onPress={() => navigateToAddFriendScreen()}>
				<Icons.UserPlusIcon height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
				<Text style={styles.addFriendText}>{t('dmMessage:addFriend')}</Text>
				{!!quantityPendingRequest && (
					<View
						style={{
							backgroundColor: baseColor.redStrong,
							width: size.s_20,
							height: size.s_20,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: size.s_20,
							position: 'absolute',
							right: -size.s_8,
							top: -size.s_8
						}}
					>
						<Text style={styles.textQuantityPending}>{quantityPendingRequest}</Text>
					</View>
				)}
			</Pressable>
		</View>
	);
}

export default React.memo(MessageHeader);
