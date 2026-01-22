import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllFriends } from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import React, { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../navigation/ScreenTypes';
import { useDiscoverMobile } from '../Discover/DiscoverMobileContext';
import { style } from './styles';

const FriendState = {
	PENDING: 2
};

const HeaderUserEmptyClan = () => {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const styles = style(themeValue);
	const { setSearchTerm } = useDiscoverMobile();

	const { t } = useTranslation('discover');
	const friends = useSelector(selectAllFriends);
	const quantityPendingRequest = useMemo(() => {
		return friends?.filter((friend) => friend?.state === FriendState.PENDING)?.length || 0;
	}, [friends]);

	const debouncedSearch = useRef(
		debounce((text: string) => {
			setSearchTerm(text);
		}, 300)
	).current;

	React.useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	const navigateToScanQRScreen = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
			screen: APP_SCREEN.SETTINGS.QR_SCANNER
		});
	};

	return (
		<View style={styles.containerHeader}>
			<Text style={[styles.headerTextEmpty]}>{t('communityOnMezon')}</Text>
			<View style={styles.navigationBar}>
				<View style={styles.wrapperSearch}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
					<TextInput
						autoFocus={false}
						style={styles.inputSearch}
						placeholder={t('exploreCommunities')}
						onChangeText={debouncedSearch}
						placeholderTextColor={themeValue.textDisabled}
					/>
				</View>
				<TouchableOpacity onPressIn={navigateToScanQRScreen} style={styles.iconWrapper}>
					<MezonIconCDN icon={IconCDN.myQRcodeIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
				<TouchableOpacity onPressIn={navigateToAddFriendScreen} style={styles.iconWrapper}>
					<MezonIconCDN icon={IconCDN.userPlusIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
					{quantityPendingRequest > 0 && (
						<View style={styles.badgeItemTabType}>
							<Text style={[styles.textBadgeItemTabType, { fontSize: size.s_10 }]}>
								{quantityPendingRequest > 99 ? '99+' : quantityPendingRequest}
							</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default memo(HeaderUserEmptyClan);
