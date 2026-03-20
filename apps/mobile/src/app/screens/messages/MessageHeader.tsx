import { ETypeSearch } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllFriends } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Icons } from '../../componentUI/MobileIcons';
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

	const navigateToSearchPage = async () => {
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
			params: {
				typeSearch: ETypeSearch.SearchAll
			}
		});
	};
	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	return (
		<View style={styles.headerWrapper}>
			<View style={styles.headerComponent}>
				<Icons.IconMessagesIcon color={themeValue.textStrong} width={size.s_36} height={size.s_36} />
				<Text style={styles.headerTitle}>{t('dmMessage:title')}</Text>
			</View>

			<View style={styles.headerOptionWrapper}>
				<TouchableOpacity style={styles.btnAddFriendWrapper} onPress={() => navigateToAddFriendScreen()}>
					<View style={styles.addFriend}>
						<View style={styles.btnAddFriend}>
							<Icons.AddFriendIcon
								color={themeValue.textStrong}
								primary={themeValue.textDisabled}
								width={size.s_14}
								height={size.s_14}
							/>
							<Text style={styles.addFriendText}>{t('dmMessage:addFriend')}</Text>
						</View>
						{!!quantityPendingRequest && (
							<View style={styles.quantityPendingContainer}>
								<Text style={styles.textQuantityPending}>{quantityPendingRequest}</Text>
							</View>
						)}
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.btnSearchWrapper} onPress={() => navigateToSearchPage()}>
					<View style={styles.btnSearch}>
						<Icons.SearchIcon color={themeValue.textDisabled} width={size.s_20} height={size.s_20} />
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default memo(MessageHeader);
