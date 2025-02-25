/* eslint-disable react/jsx-no-useless-fragment */
import { useEscapeKeyClose, useMarkAsRead, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import {
	SetMuteNotificationPayload,
	SetNotificationPayload,
	channelsActions,
	clansActions,
	hasGrandchildModal,
	listChannelRenderAction,
	notificationSettingActions,
	selectAllChannelsFavorite,
	selectCategoryById,
	selectChannelById,
	selectCurrentChannelId,
	selectCurrentClan,
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
import {
	ENotificationTypes,
	EOverriddenPermission,
	EPermission,
	FOR_15_MINUTES,
	FOR_1_HOUR,
	FOR_24_HOURS,
	FOR_3_HOURS,
	FOR_8_HOURS,
	IChannel,
	copyChannelLink
} from '@mezon/utils';
import { format } from 'date-fns';
import { Dropdown } from 'flowbite-react';
import { ChannelType, NotificationType } from 'mezon-js';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Coords } from '../ChannelLink';
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
	voice: ChannelType.CHANNEL_TYPE_GMEET_VOICE
};
export const notiLabels: Record<number, string> = {
	[NotificationType.ALL_MESSAGE]: 'All',
	[NotificationType.MENTION_MESSAGE]: 'Only @mention',
	[NotificationType.NOTHING_MESSAGE]: 'Nothing'
};

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

export const getNotificationLabel = (value: NotificationType) => {
	const notificationType = notificationTypesList.find((type) => type.value === value);
	return notificationType ? notificationType.label : null;
};

const PanelChannel = ({ coords, channel, openSetting, setIsShowPanelChannel, onDeleteChannel, rootRef, selectedChannel, isUnread }: PanelChannel) => {
	const getNotificationChannelSelected = useSelector(selectNotifiSettingsEntitiesById(channel.id));
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClan = useSelector(selectCurrentClan);
	const welcomeChannelId = useSelector((state) => selectWelcomeChannelByClanId(state, currentClan?.clan_id as string));
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const [nameChildren, setNameChildren] = useState('');
	const [mutedUntil, setmutedUntil] = useState('');
	const [defaultNotifiName, setDefaultNotifiName] = useState('');
	const defaultNotificationCategory = useSelector(selectDefaultNotificationCategory);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const isThread = !!channel?.parrent_id && channel?.parrent_id !== '0';

	const currentChannel = useAppSelector((state) => selectChannelById(state, selectedChannel ?? '')) || {};

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
		dispatch(channelsActions.addFavoriteChannel({ channel_id: channel.id, clan_id: currentClan?.id }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel.id, clanId: currentClan?.id as string, mark: true }));
		setIsShowPanelChannel(false);
	};

	const removeFavoriteChannel = () => {
		dispatch(channelsActions.removeFavoriteChannel({ channelId: channel.id, clanId: currentClan?.id || '' }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel.id, clanId: currentClan?.id as string, mark: false }));
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
				clanId: currentClan?.id || '',
				threadId: selectedChannel || '',
				channelId: currentChannel.parrent_id || '',
				isPrivate: currentChannel.channel_private || 0
			})
		);
		if (channel.count_mess_unread) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentClan?.id || '', count: -channel.count_mess_unread }));
		}

		handleCloseModalConfirm();
		navigate(`/chat/clans/${currentClan?.id}/channels/${currentChannel.parrent_id}`);
	};

	const [openModelConfirm, closeModelConfirm] = useModal(() => (
		<ModalConfirm
			handleCancel={handleCloseModalConfirm}
			handleConfirm={handleLeaveChannel}
			title="Leave Thread"
			buttonName="Leave thread"
			message={`You can't receive message from thread when leave this thread`}
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
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body: SetNotificationPayload = {
				channel_id: channel.channel_id || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClan?.clan_id || '',
				time_mute: unmuteTimeISO,
				is_current_channel: channel.channel_id === currentChannelId
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body: SetMuteNotificationPayload = {
				channel_id: channel.channel_id || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClan?.clan_id || '',
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
			clan_id: currentClan?.clan_id || '',
			active: active,
			is_current_channel: channel.channel_id === currentChannelId
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
	};

	const setNotification = (notificationType: number | 0) => {
		if (notificationType) {
			const body = {
				channel_id: channel.channel_id || '',
				notification_type: notificationType || 0,
				clan_id: currentClan?.clan_id || '',
				is_current_channel: channel.channel_id === currentChannelId
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			dispatch(
				notificationSettingActions.deleteNotiChannelSetting({
					channel_id: channel.channel_id || '',
					clan_id: currentClan?.clan_id || '',
					is_current_channel: channel.channel_id === currentChannelId
				})
			);
		}
	};

	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);

	useEffect(() => {
		if (getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0') {
			if (channel.parrent_id === '0' || !channel.parrent_id) {
				setNameChildren('Mute Channel');
			} else {
				setNameChildren('Mute Thread');
			}
			setmutedUntil('');
		} else {
			if (channel.parrent_id === '0' || !channel.parrent_id) {
				setNameChildren('Unmute Channel');
			} else {
				setNameChildren('Unmute Thread');
			}
			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setmutedUntil(`Muted until ${formattedDate}`);

					setTimeout(() => {
						const body = {
							channel_id: currentChannelId || '',
							notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
							clan_id: currentClan?.clan_id || '',
							active: 1,
							is_current_channel: channel.channel_id === currentChannelId
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
					}, timeDifference);
				}
			}
		}
		if (defaultNotificationCategory?.notification_setting_type) {
			setDefaultNotifiName(notiLabels[defaultNotificationCategory?.notification_setting_type]);
		} else if (defaultNotificationClan?.notification_setting_type) {
			setDefaultNotifiName(notiLabels[defaultNotificationClan.notification_setting_type]);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

	const [canManageThread, canManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		channel?.channel_id ?? ''
	);

	const handClosePannel = useCallback(() => {
		setIsShowPanelChannel(false);
	}, []);

	useEscapeKeyClose(panelRef, handClosePannel);
	useOnClickOutside(
		panelRef,
		() => {
			if (!hasModalInChild) {
				handClosePannel();
			}
		},
		rootRef
	);

	const handleOpenCreateChannelModal = () => {
		dispatch(
			channelsActions.setCurrentCategory({
				clanId: currentClan?.id || '',
				category: currentCategory
			})
		);
		dispatch(channelsActions.openCreateNewModalChannel({ isOpen: true, clanId: currentClan?.id as string }));
	};

	const { handleMarkAsReadChannel, statusMarkAsReadChannel } = useMarkAsRead();
	useEffect(() => {
		if (statusMarkAsReadChannel === 'success' || statusMarkAsReadChannel === 'error') {
			setIsShowPanelChannel(false);
		}
	}, [statusMarkAsReadChannel]);
	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			style={{ left: coords.mouseX, bottom: positionTop ? '12px' : 'auto', top: positionTop ? 'auto' : coords.mouseY }}
			className="outline-none fixed top-full dark:bg-bgProfileBody bg-white rounded-sm shadow z-20 w-[200px] py-[10px] px-[10px]"
		>
			<GroupPanels>
				<ItemPanel
					onClick={statusMarkAsReadChannel === 'pending' ? undefined : () => handleMarkAsReadChannel(channel)}
					disabled={statusMarkAsReadChannel === 'pending'}
				>
					{statusMarkAsReadChannel === 'pending' ? 'Processing...' : 'Mark As Read'}
				</ItemPanel>
			</GroupPanels>
			<GroupPanels>
				<ItemPanel
					children="Invite People"
					onClick={() => {
						dispatch(clansActions.toggleInvitePeople({ status: true, channelId: channel.id }));
						handClosePannel();
					}}
				/>
				<ItemPanel
					children="Copy link"
					onClick={() => {
						copyChannelLink(currentClan?.id as string, channel.id);
						handClosePannel();
					}}
				/>
			</GroupPanels>
			{channel.type === typeChannel.voice && (
				<GroupPanels>
					<ItemPanel children="Open Chat" />
					<ItemPanel children="Hide Names" type="checkbox" />
				</GroupPanels>
			)}
			{channel.parrent_id === '0' || !channel.parrent_id ? (
				<>
					<GroupPanels>
						{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
							<Dropdown
								trigger="hover"
								dismissOnClick={false}
								renderTrigger={() => (
									<div>
										<ItemPanel children={nameChildren} dropdown="change here" onClick={() => muteOrUnMuteChannel(0)} />
									</div>
								)}
								label=""
								placement="right-start"
								className="dark:!bg-bgProfileBody bg-gray-100 border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<ItemPanel children="For 15 Minutes" onClick={() => handleScheduleMute(FOR_15_MINUTES)} />
								<ItemPanel children="For 1 Hour" onClick={() => handleScheduleMute(FOR_1_HOUR)} />
								<ItemPanel children="For 3 Hour" onClick={() => handleScheduleMute(FOR_3_HOURS)} />
								<ItemPanel children="For 8 Hour" onClick={() => handleScheduleMute(FOR_8_HOURS)} />
								<ItemPanel children="For 24 Hour" onClick={() => handleScheduleMute(FOR_24_HOURS)} />
								<ItemPanel children="Until I turn it back on" onClick={() => handleScheduleMute(Infinity)} />
							</Dropdown>
						) : (
							<ItemPanel children={nameChildren} onClick={() => muteOrUnMuteChannel(1)} subText={mutedUntil} />
						)}

						{channel?.type === typeChannel.text && (
							<Dropdown
								trigger="hover"
								dismissOnClick={false}
								renderTrigger={() => (
									<div>
										<ItemPanel children="Notification Settings" dropdown="change here" />
									</div>
								)}
								label=""
								placement="right-start"
								className="dark:!bg-bgProfileBody bg-gray-100 border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<ItemPanel
									children="Use Category Default"
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
								{notificationTypesList.map((notification) => (
									<ItemPanel
										children={notification.label}
										notificationId={notification.value}
										type="radio"
										name="NotificationSetting"
										key={notification.value}
										checked={getNotificationChannelSelected?.notification_setting_type === notification.value}
										onClick={() => setNotification(notification.value)}
									/>
								))}
							</Dropdown>
						)}
						{isFavorite ? (
							<ItemPanel children="Unmark Favorite" onClick={removeFavoriteChannel} />
						) : (
							<ItemPanel children="Mark Favorite" onClick={maskFavoriteChannel} />
						)}
					</GroupPanels>

					{canManageChannel && (
						<GroupPanels>
							<ItemPanel onClick={handleEditChannel} children="Edit Channel" />
							{channel.type === typeChannel.text && <ItemPanel children="Create Text Channel" onClick={handleOpenCreateChannelModal} />}
							{channel.type === typeChannel.voice && (
								<ItemPanel children="Create Voice Channel" onClick={handleOpenCreateChannelModal} />
							)}
							{welcomeChannelId !== channel.id && <ItemPanel onClick={handleDeleteChannel} children="Delete Channel" danger />}
						</GroupPanels>
					)}
				</>
			) : (
				<>
					<GroupPanels>
						{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
							<Dropdown
								trigger="hover"
								dismissOnClick={false}
								renderTrigger={() => (
									<div>
										<ItemPanel children={nameChildren} dropdown="change here" onClick={() => muteOrUnMuteChannel(0)} />
									</div>
								)}
								label=""
								placement="right-start"
								className="dark:!bg-bgProfileBody bg-gray-100 border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<ItemPanel children="For 15 Minutes" onClick={() => handleScheduleMute(FOR_15_MINUTES)} />
								<ItemPanel children="For 1 Hour" onClick={() => handleScheduleMute(FOR_1_HOUR)} />
								<ItemPanel children="For 3 Hour" onClick={() => handleScheduleMute(FOR_3_HOURS)} />
								<ItemPanel children="For 8 Hour" onClick={() => handleScheduleMute(FOR_8_HOURS)} />
								<ItemPanel children="For 24 Hour" onClick={() => handleScheduleMute(FOR_24_HOURS)} />
								<ItemPanel children="Until I turn it back on" onClick={() => handleScheduleMute(Infinity)} />
							</Dropdown>
						) : (
							<ItemPanel children={nameChildren} onClick={() => muteOrUnMuteChannel(1)} subText={mutedUntil} />
						)}
						{(channel.type === typeChannel.text || channel.type === typeChannel.thread) && (
							<Dropdown
								trigger="hover"
								dismissOnClick={false}
								renderTrigger={() => (
									<div>
										<ItemPanel children="Notification Settings" dropdown="change here" />
									</div>
								)}
								label=""
								placement="right-start"
								className="dark:bg-[#323232] bg-gray-100 border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<ItemPanel
									children="Use Category Default"
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
								{notificationTypesList.map((notification) => (
									<ItemPanel
										children={notification.label}
										notificationId={notification.value}
										type="radio"
										name="NotificationSetting"
										key={notification.value}
										checked={getNotificationChannelSelected?.notification_setting_type === notification.value}
										onClick={() => setNotification(notification.value)}
									/>
								))}
							</Dropdown>
						)}
						{currentChannel?.creator_id !== currentUserId && (
							<ItemPanel onClick={handleOpenModalConfirm} children="Leave Thread" danger />
						)}
					</GroupPanels>

					{canManageThread && (
						<GroupPanels>
							<ItemPanel onClick={handleEditChannel} children="Edit Thread" />
							{!isThread && <ItemPanel children="Create Thread" />}
							<ItemPanel onClick={handleDeleteChannel} children="Delete Thread" danger />
						</GroupPanels>
					)}
				</>
			)}
		</div>
	);
};

export default PanelChannel;
