import { useAuth } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, addUserEvent, deleteUserEvent, selectMemberClanByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EEventStatus, createImgproxyUrl, sleep } from '@mezon/utils';
import { ApiUserEventRequest } from 'mezon-js/types';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonButton from '../../../componentUI/MezonButton';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import ImageNative from '../../ImageNative';
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
	const { t } = useTranslation(['eventMenu', 'eventCreator']);
	const userCreate = useAppSelector((state) => selectMemberClanByUserId(state, event?.creatorId || ''));
	const { userId } = useAuth();
	const [isInterested, setIsInterested] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const leftTimeSeconds = useMemo(() => {
		if (!start) return 0;
		const currentTime = Date.now();
		const startTimeLocal = new Date(start).getTime();
		return Math.ceil((startTimeLocal - currentTime) / 1000);
	}, [start]);

	const calculateMinutesRemaining = useMemo(() => {
		if (!start) return 0;
		if (leftTimeSeconds > 0 && leftTimeSeconds <= 60 * 10) {
			return Math.ceil(leftTimeSeconds / 60);
		}
		return 0;
	}, [leftTimeSeconds, start]);

	const eventStatus = useMemo(() => {
		if (event?.event_status) return event.event_status;
		if (!start) return EEventStatus.CREATED;
		if (leftTimeSeconds <= 0) return EEventStatus.ONGOING;
		if (leftTimeSeconds <= 60 * 10) return EEventStatus.UPCOMING;
		return EEventStatus.CREATED;
	}, [event?.event_status, leftTimeSeconds, start]);

	function handlePress() {
		onPress && onPress();
	}

	useEffect(() => {
		if (userId && event?.userIds) {
			setIsInterested(event.userIds.includes(userId));
		}
	}, [userId, event]);

	const handleToggleUserEvent = () => {
		if (!event?.id) return;

		const request: ApiUserEventRequest = {
			clanId: event.clanId,
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
					<EventTime eventStatus={eventStatus} event={event} minutes={calculateMinutesRemaining} />
					<View style={[styles.inline, styles.infoRight]}>
						<View style={styles.avatar}>
							<FastImage
								source={{
									uri: createImgproxyUrl(userCreate?.user?.avatarUrl ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={{ width: '100%', height: '100%' }}
								resizeMode="cover"
							/>
						</View>
						<View style={styles.inline}>
							<MezonIconCDN icon={IconCDN.groupIcon} height={size.s_12} width={size.s_12} color={themeValue.text} />
							<Text style={styles.tinyText}>{event?.userIds?.length}</Text>
						</View>
					</View>
				</View>

				<View style={styles.mainArea}>
					<View style={styles.mainSec}>
						{!!event?.channelId && event.channelId !== '0' && !event?.is_private && (
							<View style={[styles.privatePanel, { backgroundColor: baseColor.orange }]}>
								<Text style={styles.privateText}>{t('eventCreator:eventDetail.channelEvent')}</Text>
							</View>
						)}

						{event?.is_private && (
							<View style={styles.privatePanel}>
								<Text style={styles.privateText}>{t('eventCreator:eventDetail.privateEvent')}</Text>
							</View>
						)}

						{!event?.is_private && !event?.channelId && (
							<View style={[styles.privatePanel, { backgroundColor: baseColor.blurple }]}>
								<Text style={styles.privateText}>{t('eventCreator:eventDetail.clanEvent')}</Text>
							</View>
						)}
						<Text style={{ color: themeValue.textStrong }}>{event.title}</Text>
						{event.description && <Text style={styles.description}>{event.description}</Text>}
						<EventLocation event={event} />
					</View>
					{event?.logo && (
						<View style={styles.eventLogo}>
							<ImageNative url={event?.logo} style={styles.eventLogoImage} />
						</View>
					)}
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
							title={isInterested ? t('item.uninterested') : t('item.interested')}
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
				{!!event.channelId && event.channelId !== '0' && <EventChannelDetail event={event} />}
			</View>
		</Pressable>
	);
}
