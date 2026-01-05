import { useAuth, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import {
	addUserEvent,
	deleteUserEvent,
	selectClanById,
	selectMemberClanByUserId,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { EEventStatus, EPermission, sleep } from '@mezon/utils';
import type { ApiUserEventRequest } from 'mezon-js/types';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonButton from '../../../componentUI/MezonButton';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import ImageNative from '../../ImageNative';
import { EventChannelDetail } from '../EventChannelTitle';
import { EventLocation } from '../EventLocation';
import { EventMenu } from '../EventMenu';
import { ShareEventModal } from '../EventShare';
import { EventTime } from '../EventTime';
import { style } from './styles';

interface IEventDetailProps {
	event: EventManagementEntity;
}

export function EventDetail({ event }: IEventDetailProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventMenu', 'eventCreator']);
	const userCreate = useAppSelector((state) => selectMemberClanByUserId(state, event?.creatorId || ''));
	const clans = useSelector(selectClanById(event?.clanId || ''));
	const { userId, userProfile } = useAuth();
	const [isInterested, setIsInterested] = useState<boolean>(false);
	const [eventInterested, setEventInterested] = useState<number>(event?.userIds?.length || 0);
	const [isClanOwner, hasClanPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.manageClan,
		EPermission.administrator
	]);
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);

	const canModifyEvent = useMemo(() => {
		if (isClanOwner || hasClanPermission || hasAdminPermission) {
			return true;
		}
		const isEventICreated = event?.creatorId === userProfile?.user?.id;
		if (isEventICreated) {
			return true;
		}

		return Number(userMaxPermissionLevel) > Number(event?.maxPermission);
	}, [event?.creatorId, event?.maxPermission, hasAdminPermission, hasClanPermission, isClanOwner, userMaxPermissionLevel, userProfile?.user?.id]);
	const dispatch = useAppDispatch();

	function handlePress() {
		const data = {
			heightFitContent: true,
			children: <EventMenu event={event} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}

	const handleShareEvent = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			children: <ShareEventModal event={event} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	useEffect(() => {
		if (userId && event?.userIds) {
			setIsInterested(event.userIds.includes(userId));
		}
	}, [userId, event]);

	const handleToggleUserEvent = () => {
		if (!event?.id) return;

		const request: ApiUserEventRequest = {
			clanId: event.clanId,
			eventId: event.id
		};

		if (isInterested) {
			dispatch(deleteUserEvent(request));
			setEventInterested(eventInterested - 1);
		} else {
			dispatch(addUserEvent(request));
			setEventInterested(eventInterested + 1);
		}

		setIsInterested(!isInterested);
	};

	return (
		<View style={styles.container}>
			{!!event?.logo && <ImageNative url={event?.logo} style={styles.cover} resizeMode="cover" />}
			<EventTime event={event} eventStatus={EEventStatus.CREATED} />
			{!!event?.channelId && event.channelId !== '0' && !event?.isPrivate && (
				<View style={styles.privateArea}>
					<View style={[styles.privatePanel, { backgroundColor: baseColor.orange }]}>
						<Text style={styles.privateText}>{t('eventCreator:eventDetail.channelEvent')}</Text>
					</View>
				</View>
			)}

			{event?.isPrivate && (
				<View style={styles.privateArea}>
					<View style={styles.privatePanel}>
						<Text style={styles.privateText}>{t('eventCreator:eventDetail.privateEvent')}</Text>
					</View>
				</View>
			)}

			{!event?.isPrivate && !event?.channelId && (
				<View style={styles.privateArea}>
					<View style={[styles.privatePanel, { backgroundColor: baseColor.blurple }]}>
						<Text style={styles.privateText}>{t('eventCreator:eventDetail.clanEvent')}</Text>
					</View>
				</View>
			)}
			<Text style={styles.title}>{event?.title}</Text>

			<View>
				<View style={styles.mainSection}>
					<View style={styles.inline}>
						<MezonAvatar avatarUrl={clans?.logo} username={clans?.clanName} height={20} width={20} />
						<Text style={styles.smallText}>{clans?.clanName}</Text>
					</View>

					<EventLocation event={event} />

					<View style={styles.inline}>
						<MezonIconCDN icon={IconCDN.bellIcon} height={16} width={16} color={themeValue.text} />
						<Text style={styles.smallText}>{t('detail.personInterested', { count: eventInterested })}</Text>
					</View>

					<View style={styles.inline}>
						<MezonAvatar avatarUrl={userCreate?.user?.avatarUrl} username={userCreate?.user?.username} height={20} width={20} />
						<Text style={styles.smallText}>
							{t('detail.createdBy')}
							<Text style={styles.highlight}>{userCreate?.user?.username}</Text>
						</Text>
					</View>
				</View>
			</View>

			{event.description && <Text style={styles.description}>{event.description}</Text>}

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
						onPress={handleShareEvent}
						icon={<MezonIconCDN icon={IconCDN.shareIcon} height={20} width={20} color={themeValue.text} />}
					/>
				)}
				{canModifyEvent && (
					<MezonButton
						icon={<MezonIconCDN icon={IconCDN.moreVerticalIcon} height={20} width={20} color={themeValue.text} />}
						onPress={handlePress}
					/>
				)}
			</View>

			{!!event?.channelId && event.channelId !== '0' && <EventChannelDetail event={event} />}
		</View>
	);
}
