import { useEscapeKeyClose, useMarkAsRead, useOnClickOutside, usePermissionChecker, UserRestrictionZone } from '@mezon/core';
import {
	categoriesActions,
	defaultNotificationCategoryActions,
	selectCurrentClan,
	selectDefaultNotificationCategory,
	SetDefaultNotificationPayload,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu } from '@mezon/ui';
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
	ICategoryChannel,
	MUTE
} from '@mezon/utils';
import { format } from 'date-fns';
import { NotificationType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coords } from '../ChannelLink';
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
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const [canManageCategory] = usePermissionChecker([EPermission.manageClan]);
	const dispatch = useAppDispatch();
	const defaultCategoryNotificationSetting = useAppSelector((state) => selectDefaultNotificationCategory(state, category?.id as string));
	const currentClan = useAppSelector(selectCurrentClan);
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
			clan_id: currentClan?.clan_id || ''
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
				clan_id: currentClan?.clan_id || ''
			};
			dispatch(defaultNotificationCategoryActions.setDefaultNotificationCategory(payload));
		} else {
			const payload: SetDefaultNotificationPayload = {
				category_id: category?.id,
				notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
				clan_id: currentClan?.clan_id || '',
				active: 0
			};
			dispatch(defaultNotificationCategoryActions.setMuteCategory(payload));
		}
	};

	const handleMuteCategory = (active: number) => {
		const payload: SetDefaultNotificationPayload = {
			category_id: category?.id,
			notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
			clan_id: currentClan?.clan_id || '',
			active: active
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
				setMuteUntil(`Muted until ${formattedTimeDifference}`);
				setTimeout(() => {
					const payload: SetDefaultNotificationPayload = {
						category_id: category?.id,
						notification_type: defaultCategoryNotificationSetting?.notification_setting_type ?? NotificationType.ALL_MESSAGE,
						clan_id: currentClan?.clan_id || '',
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
			<ItemPanel children="For 15 Minutes" onClick={() => handleScheduleMute(FOR_15_MINUTES)} />,
			<ItemPanel children="For 1 Hour" onClick={() => handleScheduleMute(FOR_1_HOUR)} />,
			<ItemPanel children="For 3 Hour" onClick={() => handleScheduleMute(FOR_3_HOURS)} />,
			<ItemPanel children="For 8 Hour" onClick={() => handleScheduleMute(FOR_8_HOURS)} />,
			<ItemPanel children="For 24 Hour" onClick={() => handleScheduleMute(FOR_24_HOURS)} />,
			<ItemPanel children="Until I turn it back on" onClick={() => handleScheduleMute(Infinity)} />
		];
		return <>{menuItems}</>;
	}, []);

	const menuNoti = useMemo(() => {
		const menuItems = [
			<ItemPanel
				children="Use Clan Default"
				type="radio"
				name="NotificationSetting"
				defaultNotifi={true}
				onClick={() => handleChangeSettingType(ENotificationTypes.DEFAULT)}
				checked={
					defaultCategoryNotificationSetting?.notification_setting_type === ENotificationTypes.DEFAULT ||
					defaultCategoryNotificationSetting?.notification_setting_type === undefined
				}
			/>
		];

		notificationTypesList.map((notification) =>
			menuItems.push(
				<ItemPanel
					children={notification.label}
					notificationId={notification.value}
					type="radio"
					name="NotificationSetting"
					key={notification.value}
					onClick={() => handleChangeSettingType(notification.value)}
					checked={defaultCategoryNotificationSetting?.notification_setting_type === notification.value}
				/>
			)
		);

		return <>{menuItems}</>;
	}, [notificationTypesList]);

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
					{statusMarkAsReadCategory === 'pending' ? 'Processing...' : 'Mark As Read'}
				</ItemPanel>
			</GroupPanels>
			<GroupPanels>
				<ItemPanel children="Collapse Category" type={'checkbox'} checked={collapseCategory} onClick={toggleCollapseCategory} />
				<ItemPanel children="Collapse All Categories" onClick={collapseAllCategory} />
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
							<ItemPanel children={'Mute Category'} dropdown="change here" onClick={() => handleMuteCategory(MUTE)} />
						</div>
					</Menu>
				) : (
					<ItemPanel children={'Unmute Category'} onClick={() => handleMuteCategory(ACTIVE)} subText={muteUntil} />
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
						<ItemPanel children="Notification Settings" dropdown="change here" />
					</div>
				</Menu>
			</GroupPanels>

			<UserRestrictionZone policy={canManageCategory}>
				<GroupPanels>
					<ItemPanel children={'Edit Category'} onClick={openEditCategory} />
					{!category?.channels?.length && <ItemPanel children={'Delete Category'} onClick={handleDeleteCategory} danger />}
				</GroupPanels>
			</UserRestrictionZone>
		</div>
	);
};

export default PanelCategory;
