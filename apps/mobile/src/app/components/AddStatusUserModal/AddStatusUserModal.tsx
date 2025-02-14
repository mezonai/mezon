import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { IMezonOptionData, MezonInput, MezonModal, MezonOption } from '../../componentUI';
import { ETypeCustomUserStatus } from '../../screens/profile/ProfileScreen';
import { styles } from './AddStatusUserModal.styles';

export interface IAddStatusUserModalProps {
	isVisible: boolean;
	setIsVisible: (value: boolean) => void;
	userCustomStatus: string;
	handleCustomUserStatus?: (customStatus: string, type: ETypeCustomUserStatus, duration: number, noClearStatus: boolean) => void;
}

export const AddStatusUserModal = ({ isVisible, setIsVisible, userCustomStatus, handleCustomUserStatus }: IAddStatusUserModalProps) => {
	const [lineStatus, setLineStatus] = useState<string>('');
	const { t } = useTranslation(['customUserStatus']);
	const [statusDuration, setStatusDuration] = useState<number>(-1);
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
		[]
	);

	useEffect(() => {
		setLineStatus(userCustomStatus);
	}, [userCustomStatus]);

	function handleTimeOptionChange(value: number) {
		setStatusDuration(value);
	}

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
		handleCustomUserStatus(lineStatus, ETypeCustomUserStatus.Save, minutes, noClear);
	};

	return (
		<MezonModal
			visible={isVisible}
			title={t('editStatus')}
			visibleChange={setIsVisible}
			headerStyles={styles.headerModal}
			titleStyle={styles.titleModal}
			rightBtnText={lineStatus ? t('save') : ''}
			onClickRightBtn={handleSaveCustomStatus}
		>
			<View>
				<MezonInput value={lineStatus} onTextChange={setLineStatus} placeHolder={t('placeholder')} textarea={true} maxCharacter={128} />

				<MezonOption title={t('statusDuration.label')} value={statusDuration} data={timeOptions} onChange={handleTimeOptionChange} />
			</View>
		</MezonModal>
	);
};
