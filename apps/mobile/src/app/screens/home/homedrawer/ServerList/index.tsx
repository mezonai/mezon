import { size, useTheme } from '@mezon/mobile-ui';
import { selectLogoCustom } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import LogoMezonDark from '../../../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../../../assets/svg/logoMezonLight.svg';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import { SeparatorWithLine } from '../../../../components/Common';
import { APP_SCREEN } from '../../../../navigation/ScreenTypes';
import { ListClanPopup } from '../components/ListClanPopup';
import { UnreadDMBadgeList } from '../components/UnreadDMBadgeList';
import BadgeFriendRequest from './BadgeFriendRequest';
import { style } from './styles';

const ServerList = React.memo(() => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const logoCustom = useSelector(selectLogoCustom);

	const navigateToDM = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.HOME);
	};

	return (
		<View style={styles.wrapperServerList}>
			<TouchableOpacity style={styles.wrapperLogo} onPress={() => navigateToDM()}>
				{logoCustom ? (
					<MezonAvatar width={size.s_48} height={size.s_48} avatarUrl={logoCustom} username="" />
				) : themeBasic === 'light' ? (
					<LogoMezonLight width={size.s_48} height={size.s_48} />
				) : (
					<LogoMezonDark width={size.s_48} height={size.s_48} />
				)}
				<BadgeFriendRequest />
			</TouchableOpacity>
			<SeparatorWithLine style={styles.separatorLine} />
			<ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
				<UnreadDMBadgeList />
				<ListClanPopup />
			</ScrollView>
		</View>
	);
});

export default ServerList;
