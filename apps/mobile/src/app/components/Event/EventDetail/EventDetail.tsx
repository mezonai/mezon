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
import type { ApiUserEventRequest } from 'mezon-js/api.gen';
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
	const userCreate = useAppSelector((state) => selectMemberClanByUserId(state, event?.creator_id || ''));
	const clans = useSelector(selectClanById(event?.clan_id || ''));
	const { userId, userProfile } = useAuth();
	const [isInterested, setIsInterested] = useState<boolean>(false);
	const [eventInterested, setEventInterested] = useState<number>(event?.user_ids?.length || 0);
	const [isClanOwner, hasClanPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.manageClan,
		EPermission.administrator
	]);
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);

	const userDisplaynameToShow = useMemo(() => {
		return userCreate?.clan_nick || userCreate?.user?.display_name || userCreate?.user?.username;
	}, [userCreate?.clan_nick, userCreate?.user?.display_name, userCreate?.user?.username]);

	const userAvatarToShow = useMemo(() => {
		return userCreate?.clan_avatar || userCreate?.user?.avatar_url;
	}, [userCreate?.clan_avatar, userCreate?.user?.avatar_url]);

	const canModifyEvent = useMemo(() => {
		if (isClanOwner || hasClanPermission || hasAdminPermission) {
			return true;
		}
		const isEventICreated = event?.creator_id === userProfile?.user?.id;
		if (isEventICreated) {
			return true;
		}

		return Number(userMaxPermissionLevel) > Number(event?.max_permission);
	}, [event?.creator_id, event?.max_permission, hasAdminPermission, hasClanPermission, isClanOwner, userMaxPermissionLevel, userProfile?.user?.id]);
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
			{!!event?.channel_id && event.channel_id !== '0' && !event?.is_private && (
				<View style={styles.privateArea}>
					<View style={[styles.privatePanel, { backgroundColor: baseColor.orange }]}>
						<Text style={styles.privateText}>{t('eventCreator:eventDetail.channelEvent')}</Text>
					</View>
				</View>
			)}

			{event?.is_private && (
				<View style={styles.privateArea}>
					<View style={styles.privatePanel}>
						<Text style={styles.privateText}>{t('eventCreator:eventDetail.privateEvent')}</Text>
					</View>
				</View>
			)}

			{!event?.is_private && !event?.channel_id && (
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
						<MezonAvatar avatarUrl={clans?.logo} username={clans?.clan_name} height={20} width={20} />
						<Text style={styles.smallText}>{clans?.clan_name}</Text>
					</View>

					<EventLocation event={event} />

					<View style={styles.inline}>
						<MezonIconCDN icon={IconCDN.bellIcon} height={16} width={16} color={themeValue.text} />
						<Text style={styles.smallText}>
							{eventInterested === 0
								? t('detail.noOneInterested')
								: eventInterested === 1
									? t('detail.onePersonInterested')
									: t('detail.personInterested', { count: eventInterested })}
						</Text>
					</View>

					<View style={styles.inline}>
						<MezonAvatar avatarUrl={userAvatarToShow} username={userDisplaynameToShow} height={20} width={20} />
						<Text style={styles.smallText}>
							{t('detail.createdBy')}
							<Text style={styles.highlight}>{userDisplaynameToShow}</Text>
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

			{!!event?.channel_id && event.channel_id !== '0' && <EventChannelDetail event={event} />}
		</View>
	);
}
