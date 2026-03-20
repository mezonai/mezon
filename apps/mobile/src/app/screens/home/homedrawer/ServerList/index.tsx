import { size, useTheme } from '@mezon/mobile-ui';
import { selectLogoCustom } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import { SeparatorWithLine } from '../../../../components/Common';
import { APP_SCREEN } from '../../../../navigation/ScreenTypes';
import { ListClanPopup } from '../components/ListClanPopup';
import { UnreadDMBadgeList } from '../components/UnreadDMBadgeList';
import BadgeFriendRequest from './BadgeFriendRequest';
import { style } from './styles';

const DEFAULT_LOGO_DM = 'https://cdn.mezon.ai/landing-page-mezon/logodefault.webp';

const ServerList = React.memo(({ hideActive = false }: { hideActive?: boolean }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const logoCustom = useSelector(selectLogoCustom);

	const navigateToDM = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.HOME);
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.wrapperLogo} onPress={() => navigateToDM()}>
				<MezonAvatar
					width={size.s_42}
					height={size.s_42}
					avatarUrl={logoCustom || DEFAULT_LOGO_DM}
					username=""
					customImageStyle={styles.logoBorderRadius}
				/>
				{hideActive && <View style={styles.focusDirectMessage}></View>}
				<BadgeFriendRequest />
			</TouchableOpacity>
			<SeparatorWithLine style={styles.separatorLine} />
			<NestableScrollContainer removeClippedSubviews={true} contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
				<UnreadDMBadgeList />
				<ListClanPopup hideActive={hideActive} />
			</NestableScrollContainer>
		</View>
	);
});

export default ServerList;
