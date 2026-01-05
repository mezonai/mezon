import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import type { MuteChannelPayload } from '@mezon/store';
import {
	notificationSettingActions,
	selectCurrentChannelCategoryId,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectNotifiSettingsEntitiesById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu } from '@mezon/ui';
import { EMuteState, ENotificationTypes, FOR_15_MINUTES_SEC, FOR_1_HOUR_SEC, FOR_24_HOURS_SEC, FOR_3_HOURS_SEC, FOR_8_HOURS_SEC } from '@mezon/utils';
import { format } from 'date-fns';
import type { ReactElement, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { createNotificationTypesListTranslated } from '../../../PanelChannel';
import ItemPanel from '../../../PanelChannel/ItemPanel';

const NotificationSetting = ({ onClose, rootRef }: { onClose: () => void; rootRef?: RefObject<HTMLElement> }) => {
	const { t } = useTranslation('channelTopbar');
	const tChannelMenu = useTranslation('channelMenu').t;
	const notificationTypesList = createNotificationTypesListTranslated(tChannelMenu);
	const currentChannelObjectId = useSelector(selectCurrentChannelId);
	const currentChannelCategoryId = useSelector(selectCurrentChannelCategoryId);
	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, currentChannelObjectId || ''));
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);
	const [nameChildren, setNameChildren] = useState('');
	const [mutedUntil, setmutedUntil] = useState('');
	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, currentChannelCategoryId as string));

	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);

	useEffect(() => {
		if (getNotificationChannelSelected?.active === 1) {
			setNameChildren(t('notificationSetting.muteChannel'));
		} else {
			setNameChildren(t('notificationSetting.unmuteChannel'));
			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setmutedUntil(t('notificationSetting.mutedUntil', { date: formattedDate }));
				}
			}
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

	const handleScheduleMute = (duration: number) => {
		const body: MuteChannelPayload = {
			channelId: currentChannelId || '',
			mute_time: duration !== Infinity ? duration : 0,
			active: 0,
			clanId: currentClanId || ''
		};
		dispatch(notificationSettingActions.setMuteChannel(body));
	};

	const muteOrUnMuteChannel = (active: number) => {
		const body = {
			channelId: currentChannelId || '',
			clanId: currentClanId || '',
			active,
			mute_time: 0
		};
		dispatch(notificationSettingActions.setMuteChannel(body));
	};

	const setNotification = (notificationType: number) => {
		if (notificationType) {
			const body = {
				channelId: currentChannelId || '',
				notification_type: notificationType || 0,
				clanId: currentClanId || ''
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			dispatch(notificationSettingActions.deleteNotiChannelSetting({ channelId: currentChannelId || '', clanId: currentClanId || '' }));
		}
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(
		modalRef,
		() => {
			if (!checkMenuOpen.current) {
				onClose();
			}
		},
		rootRef
	);
	const checkMenuOpen = useRef<boolean>(false);

	const menu = useMemo(() => {
		const listItem: { key: number; label: string }[] = [
			{ key: FOR_15_MINUTES_SEC, label: t('notificationSetting.muteOptions.for15Minutes') },
			{ key: FOR_1_HOUR_SEC, label: t('notificationSetting.muteOptions.for1Hour') },
			{
				key: FOR_3_HOURS_SEC,
				label: t('notificationSetting.muteOptions.for3Hours')
			},
			{
				key: FOR_8_HOURS_SEC,
				label: t('notificationSetting.muteOptions.for8Hours')
			},
			{
				key: FOR_24_HOURS_SEC,
				label: t('notificationSetting.muteOptions.for24Hours')
			},
			{
				key: Infinity,
				label: t('notificationSetting.muteOptions.untilTurnedBackOn')
			}
		];
		const menuItems: ReactElement[] = [];
		listItem.map((item) =>
			menuItems.push(
				<Menu.Item
					key={item.key}
					children={item.label}
					onClick={() => {
						checkMenuOpen.current = false;
						handleScheduleMute(item.key);
					}}
					className="cursor-pointer bg-item-hover"
				/>
			)
		);
		return <>{menuItems}</>;
	}, []);
	const onVisibleChange = useCallback((visible: boolean) => {
		checkMenuOpen.current = visible;
	}, []);
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 shadow-2xl shadow-black/20 rounded-lg z-[99999999] bg-theme-setting-primary  border-theme-primary "
		>
			<div className="flex flex-col rounded-[4px] w-[202px] shadow-sm overflow-hidden py-[6px] px-[8px]">
				<div className="flex flex-col pb-1 mb-1 border-b-theme-primary last:border-b-0 last:mb-0 last:pb-0 ">
					{getNotificationChannelSelected?.active === 1 ? (
						<Menu
							trigger="hover"
							menu={menu}
							onVisibleChange={onVisibleChange}
							className="bg-theme-contexify text-theme-primary border-none ml-[3px] py-[6px] px-[8px] w-[200px] "
						>
							<div>
								<ItemPanel
									children={nameChildren}
									subText={mutedUntil}
									dropdown="change here"
									onClick={() => muteOrUnMuteChannel(EMuteState.MUTED)}
								/>
							</div>
						</Menu>
					) : (
						<ItemPanel children={nameChildren} subText={mutedUntil} onClick={() => muteOrUnMuteChannel(EMuteState.UN_MUTE)} />
					)}
				</div>
				<ItemPanel
					children={t('notificationSetting.useCategoryDefault')}
					type="radio"
					name="NotificationSetting"
					defaultNotifi={true}
					checked={
						getNotificationChannelSelected?.notification_setting_type === ENotificationTypes.DEFAULT ||
						getNotificationChannelSelected?.notification_setting_type === undefined
					}
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
			</div>
		</div>
	);
};

export default NotificationSetting;
