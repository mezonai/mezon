import { BellIcon } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { style } from './EmptyNotification.styles';

const EmptyNotification = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['notification']);

	return (
		<View style={{ position: 'relative', width: '100%', height: '100%' }}>
			<View
				style={{
					position: 'absolute',
					left: size.s_10,
					right: size.s_10,
					top: '20%',
					flexDirection: 'column',
					alignItems: 'center',
					gap: size.s_10
				}}
			>
				<BellIcon width={size.s_100} height={size.s_100} color={themeValue.text} />
				<Text style={styles.title}>{t('nothingHere')}</Text>
				<Text style={styles.description}>{t('comeBackNotify')}</Text>
			</View>
		</View>
	);
};

export default EmptyNotification;
