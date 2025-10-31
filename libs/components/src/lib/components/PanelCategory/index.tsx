import { useEscapeKeyClose, useMarkAsRead, useOnClickOutside, usePermissionChecker, UserRestrictionZone } from '@mezon/core';
import type { SetDefaultNotificationPayload } from '@mezon/store';
import {
	categoriesActions,
	defaultNotificationCategoryActions,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu } from '@mezon/ui';
import type { ICategoryChannel } from '@mezon/utils';
import {
	ACTIVE,
	DEFAULT_ID,
	ENotificationTypes,
	EPermission,
	FOR_15_MINUTES,
	FOR_1_HOUR,
	FOR_24_HOURS,
	FOR_3_HOURS,
	FOR_8_HOURS,
	generateE2eId,
	MUTE
} from '@mezon/utils';
import { format } from 'date-fns';
import { NotificationType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Coords } from '../ChannelLink';
import { notificationTypesList } from '../PanelChannel';
import GroupPanels from '../PanelChannel/GroupPanels';
import ItemPanel from '../PanelChannel/ItemPanel';

interface IPanelCategoryProps {
	coords: Coords;
	category?: ICategoryChannel;
	onDeleteCategory?: () => void;
	setIsShowPanelChannel: () => void;
	openEditCategory: () => void;
	toggleCollapseCategory?: () => void;
	collapseCategory?: boolean;
}

const PanelCategory: React.FC<IPanelCategoryProps> = ({
	coords,
	category,
	onDeleteCategory,
	setIsShowPanelChannel,
	openEditCategory,
	toggleCollapseCategory,
	collapseCategory
}) => {
	const { t } = useTranslation('contextMenu');
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const [canManageCategory] = usePermissionChecker([EPermission.manageClan]);
	const dispatch = useAppDispatch();
	const defaultCategoryNotificationSetting = useAppSelector((state) => selectDefaultNotificationCategory(state, category?.id as string));
	const currentClanId = useAppSelector(selectCurrentClanId);
	const [muteUntil, setMuteUntil] = useState('');

	const handleDeleteCategory = () => {
		onDeleteCategory?.();
	};

	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);

	const handleChangeSettingType = (notificationType: number) => {
		const payload: SetDefaultNotificationPayload = {
			category_id: category?.id,
			notification_type: notificationType,
			clan_id: currentClanId || ''
		};
		dispatch(defaultNotificationCategoryActions.setDefaultNotificationCategory(payload));
		handClosePannel();
	};

	const handleScheduleMute = (duration: number) => {
		if (duration !== Infinity) {
			const now = new Date();
			const muteTime = new Date(now.getTime() + duration);
			const muteTimeISO = muteTime.toISOString();
			const payload: SetDefaultNotificationPayload = {
				category_id: category?.id,
				notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
				time_mute: muteTimeISO,
				clan_id: currentClanId || ''
			};
			dispatch(defaultNotificationCategoryActions.setDefaultNotificationCategory(payload));
		} else {
			const payload: SetDefaultNotificationPayload = {
				category_id: category?.id,
				notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
				clan_id: currentClanId || '',
				active: 0
			};
			dispatch(defaultNotificationCategoryActions.setMuteCategory(payload));
		}
	};

	const handleMuteCategory = (active: number) => {
		const payload: SetDefaultNotificationPayload = {
			category_id: category?.id,
			notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
			clan_id: currentClanId || '',
			active
		};
		dispatch(defaultNotificationCategoryActions.setMuteCategory(payload));
	};

	useEffect(() => {
		if (defaultCategoryNotificationSetting?.active) {
			setMuteUntil('');
		} else if (defaultCategoryNotificationSetting?.time_mute) {
			const muteTime = new Date(defaultCategoryNotificationSetting.time_mute);
			const now = new Date();
			if (muteTime > now) {
				const timeDifference = muteTime.getTime() - now.getTime();
				const formattedTimeDifference = format(muteTime, 'dd/MM, HH:mm');
				setMuteUntil(t('mutedUntil', { time: formattedTimeDifference }));
				setTimeout(() => {
					const payload: SetDefaultNotificationPayload = {
						category_id: category?.id,
						notification_type: defaultCategoryNotificationSetting?.notification_setting_type ?? NotificationType.ALL_MESSAGE,
						clan_id: currentClanId || '',
						active: 1
					};
					dispatch(defaultNotificationCategoryActions.setMuteCategory(payload));
				}, timeDifference);
			}
		}
	}, [defaultCategoryNotificationSetting]);

	const handClosePannel = useCallback(() => {
		setIsShowPanelChannel();
	}, []);

	useEscapeKeyClose(panelRef, handClosePannel);
	useOnClickOutside(panelRef, () => {
		if (!menuOpenMute.current && !menuOpenNoti.current) {
			handClosePannel();
		}
	});

	const { handleMarkAsReadCategory, statusMarkAsReadCategory } = useMarkAsRead();
	useEffect(() => {
		if (statusMarkAsReadCategory === 'success' || statusMarkAsReadCategory === 'error') {
			setIsShowPanelChannel();
		}
	}, [statusMarkAsReadCategory]);

	const collapseAllCategory = () => {
		dispatch(categoriesActions.setCollapseAllCategory({ clanId: category?.clan_id as string }));
	};

	const menuOpenMute = useRef(false);
	const menuOpenNoti = useRef(false);

	const menuMute = useMemo(() => {
		const menuItems = [
			<ItemPanel onClick={() => handleScheduleMute(FOR_15_MINUTES)}>{t('muteFor15Minutes')}</ItemPanel>,
			<ItemPanel onClick={() => handleScheduleMute(FOR_1_HOUR)}>{t('muteFor1Hour')}</ItemPanel>,
			<ItemPanel onClick={() => handleScheduleMute(FOR_3_HOURS)}>{t('muteFor3Hours')}</ItemPanel>,
			<ItemPanel onClick={() => handleScheduleMute(FOR_8_HOURS)}>{t('muteFor8Hours')}</ItemPanel>,
			<ItemPanel onClick={() => handleScheduleMute(FOR_24_HOURS)}>{t('muteFor24Hours')}</ItemPanel>,
			<ItemPanel onClick={() => handleScheduleMute(Infinity)}>{t('muteUntilTurnedBack')}</ItemPanel>
		];
		return <>{menuItems}</>;
	}, [t]);

	const menuNoti = useMemo(() => {
		const menuItems = [
			<ItemPanel
				type="radio"
				name="NotificationSetting"
				defaultNotifi={true}
				onClick={() => handleChangeSettingType(ENotificationTypes.DEFAULT)}
				checked={
					defaultCategoryNotificationSetting?.notification_setting_type === ENotificationTypes.DEFAULT ||
					defaultCategoryNotificationSetting?.notification_setting_type === undefined
				}
			>
				{t('useClanDefault')}
			</ItemPanel>
		];

		notificationTypesList.map((notification) =>
			menuItems.push(
				<ItemPanel
					notificationId={notification.value}
					type="radio"
					name="NotificationSetting"
					key={notification.value}
					onClick={() => handleChangeSettingType(notification.value)}
					checked={defaultCategoryNotificationSetting?.notification_setting_type === notification.value}
				>
					{notification.label}
				</ItemPanel>
			)
		);

		return <>{menuItems}</>;
	}, [notificationTypesList, defaultCategoryNotificationSetting?.notification_setting_type, t]);

	const handleOpenMenuMute = useCallback((visible: boolean) => {
		menuOpenMute.current = visible;
	}, []);
	const handleOpenMenuNoti = useCallback((visible: boolean) => {
		menuOpenNoti.current = visible;
	}, []);
	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			role={'button'}
			style={{ left: coords.mouseX, bottom: positionTop ? '12px' : 'auto', top: positionTop ? 'auto' : coords.mouseY }}
			className="outline-none fixed top-full rounded-lg z-30 w-[200px] py-[10px] px-[10px] shadow-md bg-theme-contexify"
			data-e2e={generateE2eId('clan_page.side_bar.panel.category_panel')}
		>
			<GroupPanels>
				<ItemPanel
					onClick={statusMarkAsReadCategory === 'pending' ? undefined : () => handleMarkAsReadCategory(category as ICategoryChannel)}
					disabled={statusMarkAsReadCategory === 'pending'}
				>
					{statusMarkAsReadCategory === 'pending' ? t('processing') : t('markAsRead')}
				</ItemPanel>
			</GroupPanels>
			<GroupPanels>
				<ItemPanel type={'checkbox'} checked={collapseCategory} onClick={toggleCollapseCategory}>
					{t('collapseCategory')}
				</ItemPanel>
				<ItemPanel onClick={collapseAllCategory}>{t('collapseAllCategories')}</ItemPanel>
			</GroupPanels>
			<GroupPanels>
				{defaultCategoryNotificationSetting?.active === ACTIVE || defaultCategoryNotificationSetting?.id === DEFAULT_ID ? (
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
							<ItemPanel dropdown="change here" onClick={() => handleMuteCategory(MUTE)}>
								{t('muteCategory')}
							</ItemPanel>
						</div>
					</Menu>
				) : (
					<ItemPanel onClick={() => handleMuteCategory(ACTIVE)} subText={muteUntil}>
						{t('unmuteCategory')}
					</ItemPanel>
				)}

				<Menu
					menu={menuNoti}
					trigger="hover"
					align={{
						points: ['bl', 'br']
					}}
					onVisibleChange={handleOpenMenuNoti}
					className=" bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
				>
					<div>
						<ItemPanel
							dropdown="change here"
							subText={
								defaultCategoryNotificationSetting?.notification_setting_type === ENotificationTypes.DEFAULT ||
								defaultCategoryNotificationSetting?.notification_setting_type === undefined
									? t('useClanDefault')
									: notificationTypesList.find(
											(type) => type.value === defaultCategoryNotificationSetting?.notification_setting_type
										)?.label || ''
							}
						>
							{t('notificationSettings')}
						</ItemPanel>
					</div>
				</Menu>
			</GroupPanels>

			<UserRestrictionZone policy={canManageCategory}>
				<GroupPanels>
					<ItemPanel onClick={openEditCategory}>{t('editCategory')}</ItemPanel>
					{!category?.channels?.length && (
						<ItemPanel onClick={handleDeleteCategory} danger>
							{t('deleteCategory')}
						</ItemPanel>
					)}
				</GroupPanels>
			</UserRestrictionZone>
		</div>
	);
};

export default PanelCategory;
