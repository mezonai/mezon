import { size, useTheme } from '@mezon/mobile-ui';
import { selectLogoCustom } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { SeparatorWithLine } from '../../../../components/Common';
import { IconCDN } from '../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../navigation/ScreenTypes';
import { ListClanPopup } from '../components/ListClanPopup';
import { UnreadDMBadgeList } from '../components/UnreadDMBadgeList';
import BadgeFriendRequest from './BadgeFriendRequest';
import { style } from './styles';

const ServerList = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const logoCustom = useSelector(selectLogoCustom);
	const [readyRender, setReadyRender] = useState(false);

	const navigateToDM = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.HOME);
	};

	useEffect(() => {
		const splashTask = requestAnimationFrame(() => {
			setReadyRender(true);
		});
		return () => cancelAnimationFrame(splashTask);
	}, []);

	if (!readyRender) return null;

	return (
		<View style={styles.wrapperServerList}>
			<TouchableOpacity style={styles.wrapperLogo} onPress={() => navigateToDM()}>
				{logoCustom ? (
					<MezonAvatar width={size.s_42} height={size.s_42} avatarUrl={logoCustom} username="" />
				) : (
					<MezonIconCDN icon={IconCDN.logoMezon} width={size.s_42} height={size.s_42} useOriginalColor={true} />
				)}
				<BadgeFriendRequest />
			</TouchableOpacity>
			<SeparatorWithLine style={styles.separatorLine} />
			<NestableScrollContainer removeClippedSubviews={true} contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
				<UnreadDMBadgeList />
				<ListClanPopup />
			</NestableScrollContainer>
		</View>
	);
});

export default ServerList;
