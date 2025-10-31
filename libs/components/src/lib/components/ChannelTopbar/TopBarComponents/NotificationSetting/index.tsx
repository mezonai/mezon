import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
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
import { ENotificationTypes, FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
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
		if (getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0') {
			setNameChildren(t('notificationSetting.muteChannel'));
			setmutedUntil('');
		} else {
			setNameChildren(t('notificationSetting.unmuteChannel'));
			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setmutedUntil(t('notificationSetting.mutedUntil', { date: formattedDate }));

					setTimeout(() => {
						const body = {
							channel_id: currentChannelId || '',
							notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
							clan_id: currentClanId || '',
							active: 1
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
					}, timeDifference);
				}
			}
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

	const handleScheduleMute = (duration: number) => {
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body = {
				channel_id: currentChannelId || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				time_mute: unmuteTimeISO
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body = {
				channel_id: currentChannelId || '',
				notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				active: 0
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		}
	};

	const muteOrUnMuteChannel = (active: number) => {
		const body = {
			channel_id: currentChannelId || '',
			notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
			clan_id: currentClanId || '',
			active
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
	};

	const setNotification = (notificationType: number) => {
		if (notificationType) {
			const body = {
				channel_id: currentChannelId || '',
				notification_type: notificationType || 0,
				clan_id: currentClanId || ''
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			dispatch(notificationSettingActions.deleteNotiChannelSetting({ channel_id: currentChannelId || '', clan_id: currentClanId || '' }));
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
			{ key: FOR_15_MINUTES, label: t('notificationSetting.muteOptions.for15Minutes') },
			{ key: FOR_1_HOUR, label: t('notificationSetting.muteOptions.for1Hour') },
			{
				key: FOR_3_HOURS,
				label: t('notificationSetting.muteOptions.for3Hours')
			},
			{
				key: FOR_8_HOURS,
				label: t('notificationSetting.muteOptions.for8Hours')
			},
			{
				key: FOR_24_HOURS,
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
					{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
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
									onClick={() => muteOrUnMuteChannel(0)}
								/>
							</div>
						</Menu>
					) : (
						<ItemPanel children={nameChildren} subText={mutedUntil} onClick={() => muteOrUnMuteChannel(1)} />
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
