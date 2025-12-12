import { ETypeSearch } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllFriends } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
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
			<Text style={styles.headerTitle}>{t('dmMessage:title')}</Text>

			<View style={styles.headerOptionWrapper}>
				<TouchableOpacity style={styles.btnSearchWrapper} onPress={() => navigateToSearchPage()}>
					<View style={styles.btnSearch}>
						<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.btnAddFriendWrapper} onPress={() => navigateToAddFriendScreen()}>
					<View style={styles.addFriend}>
						<View style={styles.btnAddFriend}>
							<MezonIconCDN icon={IconCDN.userPlusIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
							<Text style={styles.addFriendText}>{t('dmMessage:addFriend')}</Text>
						</View>
						{!!quantityPendingRequest && (
							<View style={styles.quantityPendingContainer}>
								<Text style={styles.textQuantityPending}>{quantityPendingRequest}</Text>
							</View>
						)}
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default memo(MessageHeader);
