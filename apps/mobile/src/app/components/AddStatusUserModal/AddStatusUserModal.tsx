import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberCustomStatusById } from '@mezon/store';
import { useAppSelector } from '@mezon/store-mobile';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, ScrollView, Text, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import type { IMezonOptionData } from '../../componentUI/MezonOption';
import MezonOption from '../../componentUI/MezonOption';
import { IconCDN } from '../../constants/icon_cdn';
import StatusBarHeight from '../StatusBarHeight/StatusBarHeight';
import { styles } from './AddStatusUserModal.styles';

export interface IAddStatusUserModalProps {
	userCustomStatus: string;
	handleCustomUserStatus: (customStatus: string, duration: number, noClearStatus: boolean) => void;
	userId: string;
}

const STATUS_DURATION_MINUTES = [240, 60, 30, 0];

export const AddStatusUserModal = ({ userCustomStatus, handleCustomUserStatus, userId }: IAddStatusUserModalProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['customUserStatus']);
	const userMemberStatus = useAppSelector((state) => selectMemberCustomStatusById(state, userId || ''));
	const timeResetStatus = userMemberStatus?.timeReset;
	const [lineStatus, setLineStatus] = useState<string>(userCustomStatus);
	const [statusDuration, setStatusDuration] = useState<number>(STATUS_DURATION_MINUTES.includes(timeResetStatus) ? timeResetStatus : -1);
	const timeOptions = useMemo(
		() =>
			[
				{
					title: t('statusDuration.today'),
					value: -1
				},
				{
					title: t('statusDuration.fourHours'),
					value: 240
				},
				{
					title: t('statusDuration.oneHour'),
					value: 60
				},
				{
					title: t('statusDuration.thirtyMinutes'),
					value: 30
				},
				{
					title: t('statusDuration.dontClear'),
					value: 0
				}
			] as IMezonOptionData,
		[t]
	);

	const handleTimeOptionChange = (value: number) => {
		setStatusDuration(value);
	};

	const handleSaveCustomStatus = () => {
		let minutes = statusDuration;
		let noClear = false;
		if (statusDuration === -1) {
			const now = new Date();
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
			const timeDifference = endOfDay.getTime() - now.getTime();
			minutes = Math.floor(timeDifference / (1000 * 60));
		}
		if (statusDuration === 0) {
			noClear = true;
		}
		handleCustomUserStatus(lineStatus?.trim(), minutes, noClear);
	};

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={[styles.container, { backgroundColor: themeValue.primary }]}>
			<StatusBarHeight />
			<View style={styles.headerModal}>
				<Pressable style={styles.btnClose} onPress={() => onClose()}>
					<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_28} height={size.s_28} color={themeValue.white} />
				</Pressable>
				<Text style={[styles.titleHeader, { color: themeValue.text }]}>{t('editStatus')}</Text>
				<Pressable style={styles.btnSave} onPress={() => handleSaveCustomStatus()}>
					<Text style={[styles.buttonSave]}>{t('save')}</Text>
				</Pressable>
			</View>
			<ScrollView bounces={false} keyboardShouldPersistTaps={'handled'} style={styles.from}>
				<MezonInput value={lineStatus} onTextChange={setLineStatus} placeHolder={t('placeholder')} textarea={true} maxCharacter={128} />
				<MezonOption title={t('statusDuration.label')} value={statusDuration} data={timeOptions} onChange={handleTimeOptionChange} />
			</ScrollView>
		</View>
	);
};
