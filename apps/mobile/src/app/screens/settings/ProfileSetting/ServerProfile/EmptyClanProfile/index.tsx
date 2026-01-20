import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import CreateClanTemplate from '../../../../home/homedrawer/components/CreateClanTemplate';
import JoinClanModal from '../../../../home/homedrawer/components/JoinClanModal';
import { style } from './styles';

const EmptyClanProfile = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['profileSetting']);

	const onCreateClanModal = useCallback(() => {
		const data = {
			children: <CreateClanTemplate isProfileSetting />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const onJoinNewClanModal = useCallback(() => {
		const data = {
			children: <JoinClanModal isProfileSetting />
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);
	return (
		<View style={styles.container}>
			<MezonIconCDN icon={IconCDN.bgEmptyIcon} useOriginalColor height={size.s_100} width={size.s_100} />
			<Text style={styles.title}>{t('emptyClanProfile.title')}</Text>
			<Text style={styles.text}>{t('emptyClanProfile.description')}</Text>
			<TouchableOpacity style={styles.buttonCreate} onPress={onCreateClanModal}>
				<Text style={styles.buttonText}>{t('emptyClanProfile.createClan')}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.buttonJoin} onPress={onJoinNewClanModal}>
				<Text style={styles.buttonText}>{t('emptyClanProfile.joinClan')}</Text>
			</TouchableOpacity>
		</View>
	);
};

export default EmptyClanProfile;
