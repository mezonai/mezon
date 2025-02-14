import { Icons, load, save, STORAGE_AGE_RESTRICTED_CHANNEL_IDS } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannelId } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './styles';

const AgeRestricted = ({ onClose }: { onClose: () => void }) => {
	const { themeValue } = useTheme();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const navigation = useNavigation<any>();
	const { t } = useTranslation('ageRestricted');

	const styles = style(themeValue);
	const handleSaveChannel = () => {
		const storedData = load(STORAGE_AGE_RESTRICTED_CHANNEL_IDS) || '[]';
		const channelIds = JSON.parse(storedData);

		if (currentChannelId && !channelIds.includes(currentChannelId)) {
			channelIds.push(currentChannelId);
			save(STORAGE_AGE_RESTRICTED_CHANNEL_IDS, JSON.stringify(channelIds));
		}

		onClose();
	};

	const handleNode = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={{ backgroundColor: themeValue.secondary, borderRadius: size.s_10, padding: size.s_20 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
				<Icons.AgeRestrictedWarningIcon width={size.s_100} height={size.s_100} />
			</View>
			<View>
				<Text style={styles.title}>{t('title')}</Text>
				<Text style={styles.description}>{t('des')}</Text>
			</View>
			<View style={{ marginTop: size.s_20, flexDirection: 'row', justifyContent: 'center', gap: size.s_30 }}>
				<TouchableOpacity style={styles.buttonNope} onPress={handleNode}>
					<Text style={styles.btnText}>{t('nope')}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.buttonContinue} onPress={handleSaveChannel}>
					<Text style={styles.btnText}>{t('continue')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default React.memo(AgeRestricted);
