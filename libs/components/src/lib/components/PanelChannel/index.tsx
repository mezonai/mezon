/* eslint-disable react/jsx-no-useless-fragment */
import { useEscapeKeyClose, useMarkAsRead, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import type { SetMuteNotificationPayload, SetNotificationPayload } from '@mezon/store';
import {
	FAVORITE_CATEGORY_ID,
	channelsActions,
	clansActions,
	hasGrandchildModal,
	listChannelRenderAction,
	notificationSettingActions,
	selectAllChannelsFavorite,
	selectCategoryById,
	selectChannelById,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentUserId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectNotifiSettingsEntitiesById,
	selectWelcomeChannelByClanId,
	stickerSettingActions,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import {
	ENotificationTypes,
	EOverriddenPermission,
	EPermission,
	FOR_15_MINUTES,
	FOR_1_HOUR,
	FOR_24_HOURS,
	FOR_3_HOURS,
	FOR_8_HOURS,
	copyChannelLink
} from '@mezon/utils';
import { format } from 'date-fns';
import { ChannelType, NotificationType } from 'mezon-js';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Coords } from '../ChannelLink';
import ModalConfirm from '../ModalConfirm';
import GroupPanels from './GroupPanels';
import ItemPanel from './ItemPanel';

type PanelChannel = {
	coords: Coords;
	channel: IChannel;
	onDeleteChannel: () => void;
	selectedChannel?: string;
	openSetting: () => void;
	setIsShowPanelChannel: React.Dispatch<React.SetStateAction<boolean>>;
	rootRef?: RefObject<HTMLElement>;
	isUnread?: boolean;
};

const typeChannel = {
	text: ChannelType.CHANNEL_TYPE_CHANNEL,
	thread: ChannelType.CHANNEL_TYPE_THREAD,
	voice: ChannelType.CHANNEL_TYPE_MEZON_VOICE
};
// Legacy constants - use translated versions in components
// TODO: Deprecated - use createNotiLabelsTranslated instead
export const notiLabels: Record<number, string> = {
	[NotificationType.ALL_MESSAGE]: 'All',
	[NotificationType.MENTION_MESSAGE]: 'Only @mention',
	[NotificationType.NOTHING_MESSAGE]: 'Nothing'
};

// TODO: Deprecated - use createNotificationTypesListTranslated instead
export const notificationTypesList = [
	{
		label: 'All',
		value: NotificationType.ALL_MESSAGE
	},
	{
		label: 'Only @mention',
		value: NotificationType.MENTION_MESSAGE
	},
	{
		label: 'Nothing',
		value: NotificationType.NOTHING_MESSAGE
	}
];

// Factory functions for translated versions
export const createNotiLabelsTranslated = (t: (key: string) => string): Record<number, string> => ({
	[NotificationType.ALL_MESSAGE]: t('menu.notification.all'),
	[NotificationType.MENTION_MESSAGE]: t('menu.notification.onlyMention'),
	[NotificationType.NOTHING_MESSAGE]: t('menu.notification.nothing')
});

export const createNotificationTypesListTranslated = (t: (key: string) => string) => [
	{
		label: t('menu.notification.all'),
		value: NotificationType.ALL_MESSAGE
	},
	{
		label: t('menu.notification.onlyMention'),
		value: NotificationType.MENTION_MESSAGE
	},
	{
		label: t('menu.notification.nothing'),
		value: NotificationType.NOTHING_MESSAGE
	}
];

export const getNotificationLabel = (value: NotificationType, t?: (key: string) => string) => {
	if (t) {
		const notificationType = createNotificationTypesListTranslated(t).find((type) => type.value === value);
		return notificationType ? notificationType.label : null;
	}
	const notificationType = notificationTypesList.find((type) => type.value === value);
	return notificationType ? notificationType.label : null;
};

const PanelChannel = ({ coords, channel, openSetting, setIsShowPanelChannel, onDeleteChannel, rootRef, selectedChannel, isUnread }: PanelChannel) => {
	const { t } = useTranslation('channelMenu');

	const notiLabelsTranslated = createNotiLabelsTranslated(t);
	const notificationTypesListTranslated = createNotificationTypesListTranslated(t);

	const currentChannel = useAppSelector((state) => selectChannelById(state, selectedChannel ?? '')) || {};

	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, channel?.id || ''));
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);
	const welcomeChannelId = useSelector((state) => selectWelcomeChannelByClanId(state, currentClanId as string));
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const [nameChildren, setNameChildren] = useState('');
	const [mutedUntil, setmutedUntil] = useState('');
	const [defaultNotifiName, setDefaultNotifiName] = useState('');

	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, channel?.category_id as string));

	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const isThread = !!channel?.parent_id && channel?.parent_id !== '0';

	const currentUserId = useSelector(selectCurrentUserId);
	const currentCategory = useAppSelector((state) => selectCategoryById(state, channel?.category_id as string));
	const hasModalInChild = useSelector(hasGrandchildModal);
	const favoriteChannel = useSelector(selectAllChannelsFavorite);
	const [isFavorite, setIsFavorite] = useState<boolean>(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (favoriteChannel && favoriteChannel.length > 0) {
			const isFav = favoriteChannel.some((channelId) => channelId === channel.id);

			setIsFavorite(isFav);
		}
	}, [favoriteChannel, channel.id]);

	const maskFavoriteChannel = () => {
		dispatch(channelsActions.addFavoriteChannel({ channel_id: channel.id, clan_id: currentClanId as string }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel.id, clanId: currentClanId as string, mark: true }));
		setIsShowPanelChannel(false);
	};

	const removeFavoriteChannel = () => {
		dispatch(channelsActions.removeFavoriteChannel({ channelId: channel.id, clanId: currentClanId || '' }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel.id, clanId: currentClanId as string, mark: false }));
		setIsShowPanelChannel(false);
	};

	const handleEditChannel = () => {
		openSetting();
		setIsShowPanelChannel(false);
	};

	const handleDeleteChannel = () => {
		onDeleteChannel();
	};

	const handleLeaveChannel = () => {
		dispatch(
			threadsActions.leaveThread({
				clanId: currentClanId || '',
				threadId: selectedChannel || '',
				channelId: currentChannel.parent_id || '',
				isPrivate: currentChannel.channel_private || 0
			})
		);
		if (channel.count_mess_unread) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentClanId || '', count: -channel.count_mess_unread }));
		}

		handleCloseModalConfirm();
		navigate(`/chat/clans/${currentClanId}/channels/${currentChannel.parent_id}`);
	};

	const [openModelConfirm, closeModelConfirm] = useModal(() => (
		<ModalConfirm
			handleCancel={handleCloseModalConfirm}
			handleConfirm={handleLeaveChannel}
			title={t('modalConFirmLeaveThread.title')}
			buttonName={t('modalConFirmLeaveThread.yesButton')}
			message={t('modalConFirmLeaveThread.textConfirm')}
		/>
	));

	const handleOpenModalConfirm = () => {
		dispatch(stickerSettingActions.openModalInChild());
		openModelConfirm();
	};

	const handleCloseModalConfirm = () => {
		dispatch(stickerSettingActions.closeModalInChild());
		closeModelConfirm();
		handClosePannel();
	};

	const handleScheduleMute = (duration: number) => {
		menuOpenMute.current = false;
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body: SetNotificationPayload = {
				channel_id: channel.channel_id || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				time_mute: unmuteTimeISO,
				is_current_channel: channel.channel_id === currentChannelId
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body: SetMuteNotificationPayload = {
				channel_id: channel.channel_id || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				active: 0,
				is_current_channel: channel.channel_id === currentChannelId
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		}
	};

	const muteOrUnMuteChannel = (active: number) => {
		const body = {
			channel_id: channel.channel_id || '',
			notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
			clan_id: currentClanId || '',
			active,
			is_current_channel: channel.channel_id === currentChannelId
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
	};

	const setNotification = (notificationType: number | 0) => {
		menuOpenNoti.current = false;
		if (notificationType) {
			const body = {
				channel_id: channel.channel_id || '',
				notification_type: notificationType || 0,
				clan_id: currentClanId || '',
				is_current_channel: channel.channel_id === currentChannelId
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			dispatch(
				notificationSettingActions.deleteNotiChannelSetting({
					channel_id: channel.channel_id || '',
					clan_id: currentClanId || '',
					is_current_channel: channel.channel_id === currentChannelId
				})
			);
		}
		handClosePannel();
	};

	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);

	useEffect(() => {
		if (getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0') {
			if (channel.parent_id === '0' || !channel.parent_id) {
				setNameChildren(t('menu.notification.muteChannelStatus'));
			} else {
				setNameChildren(t('menu.notification.muteThreadStatus'));
			}
			setmutedUntil('');
		} else {
			if (channel.parent_id === '0' || !channel.parent_id) {
				setNameChildren(t('menu.notification.unmuteChannelStatus'));
			} else {
				setNameChildren(t('menu.notification.unmuteThreadStatus'));
			}
			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setmutedUntil(`${t('menu.notification.mutedUntil')} ${formattedDate}`);

					setTimeout(() => {
						const body = {
							channel_id: currentChannelId || '',
							notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
							clan_id: currentClanId || '',
							active: 1,
							is_current_channel: channel.channel_id === currentChannelId
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
					}, timeDifference);
				}
			}
		}
		if (defaultNotificationCategory?.notification_setting_type) {
			setDefaultNotifiName(notiLabelsTranslated[defaultNotificationCategory?.notification_setting_type]);
		} else if (defaultNotificationClan?.notification_setting_type) {
			setDefaultNotifiName(notiLabelsTranslated[defaultNotificationClan.notification_setting_type]);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan, notiLabelsTranslated]);
	const [hasClanOwnerPermission, hasAdminPermission, canManageThread, canManageChannel] = usePermissionChecker(
		[EPermission.clanOwner, EPermission.administrator, EOverriddenPermission.manageThread, EPermission.manageChannel],
		channel?.channel_id ?? ''
	);

	const hasManageThreadPermission = (canManageThread && channel.creator_id === currentUserId) || hasClanOwnerPermission || hasAdminPermission;
	const handClosePannel = useCallback(() => {
		setIsShowPanelChannel(false);
	}, []);

	useEscapeKeyClose(panelRef, handClosePannel);
	useOnClickOutside(
		panelRef,
		() => {
			if (!hasModalInChild && !menuOpenMute.current && !menuOpenNoti.current) {
				handClosePannel();
			}
		},
		rootRef
	);

	const handleOpenCreateChannelModal = () => {
		dispatch(
			channelsActions.setCurrentCategory({
				clanId: currentClanId || '',
				category: currentCategory
			})
		);
		dispatch(channelsActions.openCreateNewModalChannel({ isOpen: true, clanId: currentClanId as string }));
	};

	const { handleMarkAsReadChannel, statusMarkAsReadChannel } = useMarkAsRead();
	useEffect(() => {
		if (statusMarkAsReadChannel === 'success' || statusMarkAsReadChannel === 'error') {
			setIsShowPanelChannel(false);
		}
	}, [statusMarkAsReadChannel, t]);

	const shouldShowNotificationSettings =
		channel &&
		channel.type !== undefined &&
		(channel.type === typeChannel.text || channel.type === typeChannel.thread || (isThread && channel.parent_id && channel.parent_id !== '0'));

	const menuOpenMute = useRef(false);
	const menuOpenNoti = useRef(false);

	const menuMute = useMemo(() => {
		const menuItems = [
			<ItemPanel children={t('menu.notification.for15Minutes')} onClick={() => handleScheduleMute(FOR_15_MINUTES)} />,
			<ItemPanel children={t('menu.notification.for1Hour')} onClick={() => handleScheduleMute(FOR_1_HOUR)} />,
			<ItemPanel children={t('menu.notification.for3Hours')} onClick={() => handleScheduleMute(FOR_3_HOURS)} />,
			<ItemPanel children={t('menu.notification.for8Hours')} onClick={() => handleScheduleMute(FOR_8_HOURS)} />,
			<ItemPanel children={t('menu.notification.for24Hours')} onClick={() => handleScheduleMute(FOR_24_HOURS)} />,
			<ItemPanel children={t('menu.notification.untilTurnedBackOn')} onClick={() => handleScheduleMute(Infinity)} />
		];
		return <>{menuItems}</>;
	}, [t]);

	const menuNoti = useMemo(() => {
		const menuItems = [
			<ItemPanel
				children={t('menu.notification.useCategoryDefault')}
				type="radio"
				name="NotificationSetting"
				defaultNotifi={true}
				checked={
					getNotificationChannelSelected?.notification_setting_type === ENotificationTypes.DEFAULT ||
					getNotificationChannelSelected?.notification_setting_type === undefined
				}
				subText={defaultNotifiName}
				onClick={() => setNotification(ENotificationTypes.DEFAULT)}
			/>
		];

		notificationTypesListTranslated.map((notification) =>
			menuItems.push(
				<ItemPanel
					children={notification.label}
					notificationId={notification.value}
					type="radio"
					name="NotificationSetting"
					key={notification.value}
					checked={getNotificationChannelSelected?.notification_setting_type === notification.value}
					onClick={() => setNotification(notification.value)}
				/>
			)
		);

		return <>{menuItems}</>;
	}, [notificationTypesListTranslated, t]);

	const handleOpenMenuMute = useCallback((visible: boolean) => {
		menuOpenMute.current = visible;
	}, []);
	const handleOpenMenuNoti = useCallback((visible: boolean) => {
		menuOpenNoti.current = visible;
	}, []);

	const onToggleMenuMute = useCallback(() => {
		muteOrUnMuteChannel(getNotificationChannelSelected?.active === 1 ? 0 : 1);
		menuOpenMute.current = false;
	}, []);

	const isFavoriteCategory = channel?.category_id === FAVORITE_CATEGORY_ID;

	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			style={{ left: coords.mouseX, bottom: positionTop ? '12px' : 'auto', top: positionTop ? 'auto' : coords.mouseY }}
			className="outline-none fixed top-full bg-theme-contexify border-theme-primary rounded-lg shadow z-30 w-[200px] py-[10px] px-[10px]"
		>
			{!isFavoriteCategory && (
				<GroupPanels>
					<ItemPanel
						onClick={statusMarkAsReadChannel === 'pending' ? undefined : () => handleMarkAsReadChannel(channel)}
						disabled={statusMarkAsReadChannel === 'pending'}
					>
						{statusMarkAsReadChannel === 'pending' ? t('menu.notification.processing') : t('menu.watchMenu.markAsRead')}
					</ItemPanel>
				</GroupPanels>
			)}
			<GroupPanels>
				<ItemPanel
					children={t('menu.inviteMenu.copyLink')}
					onClick={() => {
						copyChannelLink(currentClanId as string, channel.id);
						handClosePannel();
					}}
				/>
			</GroupPanels>
			{channel.parent_id === '0' || !channel.parent_id ? (
				<>
					<GroupPanels>
						{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
							<Menu
								trigger="hover"
								menu={menuMute}
								align={{
									points: ['bl', 'br']
								}}
								className="bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
								onVisibleChange={handleOpenMenuMute}
							>
								<div>
									<ItemPanel children={nameChildren} dropdown="change here" onClick={onToggleMenuMute} />
								</div>
							</Menu>
						) : (
							<ItemPanel children={nameChildren} onClick={() => muteOrUnMuteChannel(1)} subText={mutedUntil} />
						)}

						{shouldShowNotificationSettings && (
							<Menu
								menu={menuNoti}
								trigger="hover"
								align={{
									points: ['bl', 'br']
								}}
								onVisibleChange={handleOpenMenuNoti}
								className="bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<div>
									<ItemPanel
										children={t('menu.notification.notification')}
										dropdown="change here"
										subText={
											getNotificationChannelSelected?.notification_setting_type === ENotificationTypes.DEFAULT ||
											getNotificationChannelSelected?.notification_setting_type === undefined
												? defaultNotifiName
												: notiLabelsTranslated[getNotificationChannelSelected?.notification_setting_type || 0]
										}
									/>
								</div>
							</Menu>
						)}
						{isFavorite ? (
							<ItemPanel children={t('menu.inviteMenu.unMarkFavorite')} onClick={removeFavoriteChannel} />
						) : (
							<ItemPanel children={t('menu.inviteMenu.markFavorite')} onClick={maskFavoriteChannel} />
						)}
					</GroupPanels>

					{canManageChannel && (
						<GroupPanels>
							<ItemPanel onClick={handleEditChannel} children={t('menu.organizationMenu.edit')} />
							{channel.type === typeChannel.text && (
								<ItemPanel children={t('menu.organizationMenu.createTextChannel')} onClick={handleOpenCreateChannelModal} />
							)}
							{channel.type === typeChannel.voice && (
								<ItemPanel children={t('menu.organizationMenu.createVoiceChannel')} onClick={handleOpenCreateChannelModal} />
							)}
							{welcomeChannelId !== channel.id && (
								<ItemPanel onClick={handleDeleteChannel} children={t('menu.organizationMenu.deleteChannel')} danger />
							)}
						</GroupPanels>
					)}
				</>
			) : (
				<>
					<GroupPanels>
						{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
							<Menu
								trigger="hover"
								menu={menuMute}
								align={{
									points: ['bl', 'br']
								}}
								className="bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
								onVisibleChange={handleOpenMenuMute}
							>
								<div>
									<ItemPanel children={nameChildren} dropdown="change here" />
								</div>
							</Menu>
						) : (
							<ItemPanel children={nameChildren} onClick={() => muteOrUnMuteChannel(1)} subText={mutedUntil} />
						)}

						{shouldShowNotificationSettings && (
							<Menu
								menu={menuNoti}
								trigger="hover"
								align={{
									points: ['bl', 'br']
								}}
								onVisibleChange={handleOpenMenuNoti}
								className="bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<div>
									<ItemPanel
										children={t('menu.notification.notification')}
										dropdown="change here"
										subText={
											getNotificationChannelSelected?.notification_setting_type === ENotificationTypes.DEFAULT ||
											getNotificationChannelSelected?.notification_setting_type === undefined
												? defaultNotifiName
												: notiLabelsTranslated[getNotificationChannelSelected?.notification_setting_type || 0]
										}
									/>
								</div>
							</Menu>
						)}
						{currentChannel?.creator_id !== currentUserId && (
							<ItemPanel onClick={handleOpenModalConfirm} children={t('menu.manageThreadMenu.leaveThread')} danger />
						)}
					</GroupPanels>

					{hasManageThreadPermission && (
						<GroupPanels>
							<ItemPanel onClick={handleEditChannel} children={t('menu.manageThreadMenu.editThread')} />
							{!isThread && <ItemPanel children={t('menu.organizationMenu.createThread')} />}
							<ItemPanel onClick={handleDeleteChannel} children={t('menu.manageThreadMenu.deleteThread')} danger />
						</GroupPanels>
					)}
				</>
			)}
		</div>
	);
};

export default PanelChannel;
