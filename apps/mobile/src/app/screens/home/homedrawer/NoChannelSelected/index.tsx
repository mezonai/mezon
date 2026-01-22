import { STORAGE_IS_DISABLE_LOAD_BACKGROUND, load } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, InteractionManager, Text, View } from 'react-native';
import Images from '../../../../../assets/Images';
import { style } from './styles';

const NoChannelSelected = () => {
	const { t } = useTranslation('userEmptyClan');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isShow, setIsShow] = useState<boolean>(false);

	useEffect(() => {
		initLoader();
	}, []);

	const initLoader = async () => {
		try {
			InteractionManager.runAfterInteractions(() => {
				setTimeout(() => {
					const isDisableLoad = load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
					const isFromFCM = isDisableLoad?.toString() === 'true';
					setIsShow(!isFromFCM);
				}, 100);
			});
		} catch (error) {
			console.error('Error in tasks:', error);
		}
	};

	if (!isShow) {
		return null;
	}

	return (
		<View style={styles.wrapper}>
			<Image style={styles.imageBg} source={Images.CHAT_PANA} />
			<Text style={styles.title}>NO TEXT CHANNEL</Text>
			<Text style={styles.description}>{t('emptyClans.findChannel')}</Text>
		</View>
	);
};

export default NoChannelSelected;