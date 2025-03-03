import { usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, selectAllTextChannel, selectCurrentClanId, selectEventsByClanId, useAppSelector } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import React, { useMemo } from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonTab } from '../../componentUI';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { EventDetail } from './EventDetail';
import { EventItem } from './EventItem';
import { EventMember } from './EventMember';
import { style } from './styles';

export function EventViewer({ handlePressEventCreate }: { handlePressEventCreate: () => void }) {
	// const { dismiss } = useBottomSheetModal()
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const currentClanId = useSelector(selectCurrentClanId);
	const allEventManagement = useAppSelector((state) => selectEventsByClanId(state, currentClanId as string));
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channel_id);

	const listEventToShow = useMemo(() => {
		return (
			allEventManagement?.filter(
				(event) => !event?.channel_id || event?.channel_id === '0' || allThreadChannelPrivateIds?.includes(event?.channel_id)
			) || []
		);
	}, [allEventManagement, allThreadChannelPrivateIds]);

	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);

	const isCanManageEvent = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner]);

	function handlePress(event: EventManagementEntity) {
		const data = {
			heightFitContent: true,
			children: (
				<MezonTab
					views={[<EventDetail event={event} />, <EventMember event={event} />]}
					titles={['Event Info', 'Interested']}
					isBottomSheet={isTabletLandscape}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={[styles.section, styles.sectionRight]}></View>
				<Text style={[styles.section, styles.sectionTitle]}>{`${listEventToShow?.length} Events`}</Text>
				<View style={[styles.section, styles.sectionRight]}>
					{isCanManageEvent && (
						<TouchableOpacity onPress={handlePressEventCreate}>
							<Text style={[styles.emptyText, { color: baseColor.blurple, fontWeight: 'bold' }]}>Create</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
			{listEventToShow?.length > 0 ? (
				listEventToShow?.map((event, index) => (
					<EventItem event={event} start={event?.start_time} key={index.toString()} onPress={() => handlePress(event)} />
				))
			) : (
				<View style={styles.emptyView}>
					<View style={styles.iconWrapper}>
						<Icons.CalendarIcon height={48} width={48} color={themeValue.text} />
					</View>
					<Text style={styles.emptyText}>There are no upcoming events.</Text>
					<Text style={styles.emptyTextDescription}>
						{
							'Schedule an event for any planned activity in your server. You can give other people permission to create event in Server Settings > Roles '
						}
					</Text>
				</View>
			)}
		</View>
	);
}
