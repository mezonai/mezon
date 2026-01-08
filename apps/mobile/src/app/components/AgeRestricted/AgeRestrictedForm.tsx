import { useTheme } from '@mezon/mobile-ui';
import { clansActions, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonDateTimePicker from '../../componentUI/MezonDateTimePicker';
import { style } from './styles';

const AgeRestrictedForm = ({ onClose }: { onClose: () => void }) => {
	const { themeValue } = useTheme();
	const [date, setDate] = useState<Date>();
	const dispatch = useAppDispatch();
	const styles = style(themeValue);
	const { t } = useTranslation('ageRestricted');
	const userProfile = useSelector(selectAllAccount);

	const handleDatePicked = (value) => {
		setDate(value);
	};
	const handleSubmit = async () => {
		if (!date) return;
		dispatch(
			clansActions.updateUser({
				avatarUrl: userProfile?.user?.avatarUrl || '',
				displayName: userProfile?.user?.displayName || '',
				aboutMe: userProfile?.user?.aboutMe || '',
				dob: date as any,
				noCache: false,
				logo: userProfile?.logo || ''
			})
		);
		onClose();
	};
	return (
		<View style={styles.formContainer}>
			<View>
				<Text style={styles.title}>{t('ageRestrictedForm.title')}</Text>
				<Text style={styles.description}>{t('ageRestrictedForm.description')}</Text>
			</View>
			<MezonDateTimePicker value={date} onChange={handleDatePicked} containerStyle={styles.datePicker} display={'inline'} />
			<View>
				<TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit}>
					<Text style={styles.btnText}>{t('ageRestrictedForm.submit')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default React.memo(AgeRestrictedForm);
