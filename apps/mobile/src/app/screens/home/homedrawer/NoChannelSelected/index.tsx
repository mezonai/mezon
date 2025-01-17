import { Block, size, useTheme } from '@mezon/mobile-ui';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity } from 'react-native';
import Images from '../../../../../assets/Images';
import { style } from './styles';

const NoChannelSelected = () => {
	const navigation = useNavigation<any>();
	const { t } = useTranslation('userEmptyClan');
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<Block style={styles.wrapper}>
			<Image style={styles.imageBg} source={Images.CHAT_PANA} />
			<Block>
				<Text style={styles.title}>NO TEXT CHANNEL</Text>
				<Text style={styles.description}>{t('emptyClans.findChannel')}</Text>
			</Block>
			<Block marginTop={size.s_20}>
				<TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.joinClan}>
					<Text style={styles.textJoinClan}>{t('emptyClans.joinChannel')}</Text>
				</TouchableOpacity>
			</Block>
		</Block>
	);
};

export default NoChannelSelected;
