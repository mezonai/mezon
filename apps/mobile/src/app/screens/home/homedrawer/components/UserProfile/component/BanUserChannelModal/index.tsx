import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { ChannelMembersEntity } from '@mezon/store-mobile';
import { channelMembersActions, useAppDispatch } from '@mezon/store-mobile';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import type { IMezonOptionData } from '../../../../../../../componentUI/MezonOption';
import MezonOption from '../../../../../../../componentUI/MezonOption';
import { style } from './styles';

interface IBuzzMessageModalProps {
	clanId: string;
	channelId: string;
	user: ChannelMembersEntity;
}

const BANTIME_10_MINUTES = 600;
const BANTIME_30_MINUTES = 1800;
const BANTIME_1_HOUR = 3600;
const BANTIME_6_HOURS = 21600;
const BANTIME_12_HOURS = 43200;
const BANTIME_1_DAY = 86400;
const BANTIME_3_DAYS = 259200;

export const BanUserChannelModal = memo((props: IBuzzMessageModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { user, clanId, channelId } = props;
	const [timeOption, setTimeOption] = useState(BANTIME_10_MINUTES);
	const { t } = useTranslation('userProfile');
	const dispatch = useAppDispatch();

	const timeOptions = useMemo(
		() =>
			[
				{
					title: t('ban.time.tenMinutes'),
					value: BANTIME_10_MINUTES
				},
				{
					title: t('ban.time.thirtyMinutes'),
					value: BANTIME_30_MINUTES
				},
				{
					title: t('ban.time.oneHour'),
					value: BANTIME_1_HOUR
				},
				{
					title: t('ban.time.sixHours'),
					value: BANTIME_6_HOURS
				},
				{
					title: t('ban.time.twelveHours'),
					value: BANTIME_12_HOURS
				},
				{
					title: t('ban.time.oneDay'),
					value: BANTIME_1_DAY
				},
				{
					title: t('ban.time.threeDays'),
					value: BANTIME_3_DAYS
				}
			] as IMezonOptionData,
		[t]
	);

	const onConfirm = useCallback(async () => {
		dispatch(channelMembersActions.banUserChannel({ clanId, channelId, userIds: [user?.id], banTime: timeOption }));
		onClose();
	}, [channelId, clanId, dispatch, timeOption, user?.id]);

	const handleTimeOptionChange = (value: number) => {
		setTimeOption(value);
	};

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	return (
		<View style={styles.main}>
			<View style={[styles.container]}>
				<Text style={styles.modalTitle}>{`${t('ban.title')} ${user?.clanNick || user?.user?.displayName || user?.user?.username}`}</Text>
				<MezonOption title={t('ban.time.title')} value={timeOption} data={timeOptions} onChange={handleTimeOptionChange} />
				<TouchableOpacity onPress={onConfirm} style={styles.yesButton}>
					<Text style={styles.buttonText}>{t('ban.banButton')}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={onClose} />
		</View>
	);
});
