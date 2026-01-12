import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import { selectAllTextChannel, selectCurrentClanId, selectCurrentUserId, selectEventsByClanId, useAppSelector } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { EventItem } from './EventItem';
import { EventTab } from './EventTime/EventTab';
import { style } from './styles';

export function EventViewer({ handlePressEventCreate }: { handlePressEventCreate: () => void }) {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventMenu']);

	const currentClanId = useSelector(selectCurrentClanId);
	const allEventManagement = useAppSelector((state) => selectEventsByClanId(state, currentClanId as string));
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel?.channelId);
	const userId = useSelector(selectCurrentUserId);

	const listEventToShow = useMemo(() => {
		return allEventManagement?.filter(
			(event) =>
				(!event?.isPrivate || event?.creatorId === userId) &&
				(!event?.channelId || event?.channelId === '0' || allThreadChannelPrivateIds?.includes(event?.channelId))
		);
	}, [allEventManagement, allThreadChannelPrivateIds, userId]);

	const handlePress = (event: EventManagementEntity) => {
		const data = {
			heightFitContent: true,
			children: <EventTab event={event} t={t} isBottomSheet={isTabletLandscape} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const countEventToShow = useMemo(() => {
		return listEventToShow?.length > 0 ? listEventToShow.length : '';
	}, [listEventToShow]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={[styles.section, styles.sectionRight]}></View>
				<Text style={[styles.section, styles.sectionTitle]}>{`${countEventToShow} ${t('dashboard.title')}`}</Text>
				<View style={[styles.section, styles.sectionRight]}>
					<TouchableOpacity onPress={handlePressEventCreate}>
						<Text style={[styles.emptyText, { color: baseColor.blurple, fontWeight: 'bold' }]}>{t('dashboard.createButton')}</Text>
					</TouchableOpacity>
				</View>
			</View>
			{listEventToShow?.length > 0 ? (
				listEventToShow?.map((event, index) => (
					<EventItem event={event} start={event?.startTimeSeconds} key={index.toString()} onPress={() => handlePress(event)} />
				))
			) : (
				<View style={styles.emptyView}>
					<View style={styles.iconWrapper}>
						<MezonIconCDN icon={IconCDN.calendarIcon} height={48} width={48} color={themeValue.text} />
					</View>
					<Text style={styles.emptyText}>{t('dashboard.noEvent')}</Text>
					<Text style={styles.emptyTextDescription}>{t('dashboard.noEventDescription')}</Text>
				</View>
			)}
		</View>
	);
}
