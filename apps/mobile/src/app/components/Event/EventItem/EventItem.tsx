import { useAuth } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, addUserEvent, deleteUserEvent, selectMemberClanByUserId2, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EEventStatus, createImgproxyUrl, sleep } from '@mezon/utils';
import { ApiUserEventRequest } from 'mezon-js/api.gen';
import React, { useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonButton from '../../../componentUI/MezonButton2';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { EventChannelDetail } from '../EventChannelTitle';
import { EventLocation } from '../EventLocation';
import { ShareEventModal } from '../EventShare';
import { EventTime } from '../EventTime';
import { style } from './styles';

interface IEventItemProps {
	event: EventManagementEntity;
	onPress?: () => void;
	showActions?: boolean;
	start: string;
}

export function EventItem({ event, onPress, showActions = true, start }: IEventItemProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userCreate = useAppSelector((state) => selectMemberClanByUserId2(state, event?.creator_id || ''));
	const { userId } = useAuth();
	const [isInterested, setIsInterested] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const eventStatus = useMemo(() => {
		if (event?.event_status) {
			return event.event_status;
		}
		if (start) {
			const currentTime = Date.now();
			const startTimeLocal = new Date(start);
			const startTimeUTC = startTimeLocal.getTime() - startTimeLocal.getTimezoneOffset() * 60000;
			const leftTime = startTimeUTC - currentTime;

			if (leftTime > 0 && leftTime <= 1000 * 60 * 10) {
				return EEventStatus.UPCOMING;
			}

			if (leftTime <= 0) {
				return EEventStatus.ONGOING;
			}
		}

		return EEventStatus.CREATED;
	}, [start, event?.event_status]);

	function handlePress() {
		onPress && onPress();
	}

	useEffect(() => {
		if (userId && event?.user_ids) {
			setIsInterested(event.user_ids.includes(userId));
		}
	}, [userId, event]);

	const handleToggleUserEvent = () => {
		if (!event?.id) return;

		const request: ApiUserEventRequest = {
			clan_id: event.clan_id,
			event_id: event.id
		};

		if (isInterested) {
			dispatch(deleteUserEvent(request));
		} else {
			dispatch(addUserEvent(request));
		}

		setIsInterested(!isInterested);
	};

	const handleShareEvent = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			children: <ShareEventModal event={event} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<Pressable onPress={handlePress}>
			<View style={styles.container}>
				<View style={styles.infoSection}>
					<EventTime eventStatus={eventStatus} event={event} />
					<View style={[styles.inline, styles.infoRight]}>
						<View style={styles.avatar}>
							<FastImage
								source={{
									uri: createImgproxyUrl(userCreate?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={{ width: '100%', height: '100%' }}
								resizeMode="cover"
							/>
						</View>
						<View style={styles.inline}>
							<MezonIconCDN icon={IconCDN.groupIcon} height={size.s_10} width={size.s_10} color={themeValue.text} />
							<Text style={styles.tinyText}>{event?.user_ids?.length}</Text>
						</View>
					</View>
				</View>

				{!!event?.channel_id && event.channel_id !== '0' && !event?.isPrivate && (
					<View style={styles.privateArea}>
						<View style={[styles.privatePanel, { backgroundColor: baseColor.orange }]}>
							<Text style={styles.privateText}>Non Public Event</Text>
						</View>
					</View>
				)}

				{event?.isPrivate && (
					<View style={styles.privateArea}>
						<View style={styles.privatePanel}>
							<Text style={styles.privateText}>Private Event</Text>
						</View>
					</View>
				)}

				<View style={styles.mainSec}>
					<Text style={{ color: themeValue.textStrong }}>{event.title}</Text>
					{event.description && <Text style={styles.description}>{event.description}</Text>}
					<EventLocation event={event} />
				</View>

				{showActions && (
					<View style={styles.inline}>
						<MezonButton
							icon={
								isInterested ? (
									<MezonIconCDN icon={IconCDN.bellSlashIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
								) : (
									<MezonIconCDN icon={IconCDN.bellIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
								)
							}
							title={isInterested ? 'UnInterested' : 'Interested'}
							fluid
							border
							onPress={handleToggleUserEvent}
						/>
						{!event?.address && (
							<MezonButton
								icon={<MezonIconCDN icon={IconCDN.shareIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />}
								onPress={handleShareEvent}
							/>
						)}
					</View>
				)}
				{!!event.channel_id && event.channel_id !== '0' && <EventChannelDetail event={event} />}
			</View>
		</Pressable>
	);
}
