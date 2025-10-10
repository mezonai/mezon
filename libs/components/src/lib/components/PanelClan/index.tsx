import {
	useChannelMembersActions,
	useEscapeKeyClose,
	useIsClanOwner,
	useMarkAsRead,
	useOnClickOutside,
	usePermissionChecker,
	UserRestrictionZone,
	useSettingFooter
} from '@mezon/core';
import {
	clansActions,
	defaultNotificationActions,
	selectDefaultNotificationClan,
	selectDefaultNotificationClanByClanId,
	useAppDispatch
} from '@mezon/store';
import { Menu } from '@mezon/ui';
import type { IClan } from '@mezon/utils';
import { EPermission, EUserSettings } from '@mezon/utils';
import type { ApiAccount } from 'mezon-js/dist/api.gen';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Coords } from '../ChannelLink';
import ModalConfirm from '../ModalConfirm';
import { createNotificationTypesListTranslated } from '../PanelChannel';
import GroupPanels from '../PanelChannel/GroupPanels';
import ItemPanel from '../PanelChannel/ItemPanel';
import { EActiveType } from '../SettingProfile/SettingRightProfile';

interface IPanelClanProps {
	coords: Coords;
	clan?: IClan;
	onDeleteCategory?: () => void;
	setShowClanListMenuContext?: () => void;
	userProfile?: ApiAccount;
}

const PanelClan: React.FC<IPanelClanProps> = ({ coords, clan, setShowClanListMenuContext, userProfile }) => {
	const { t } = useTranslation('contextMenu');
	const tChannelMenu = useTranslation('channelMenu').t;
	const notificationTypesList = createNotificationTypesListTranslated(tChannelMenu);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const isOwnerOfContextClan = useIsClanOwner(clan?.clan_id || clan?.id || '');
	const [_, canManageClan] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan], '', clan?.clan_id ?? '');
	const dispatch = useAppDispatch();

	const defaultNotificationClan = useSelector((state) =>
		clan?.clan_id ? selectDefaultNotificationClanByClanId(state as any, clan.clan_id) : selectDefaultNotificationClan(state as any)
	);
	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);
	const handClosePannel = useCallback(() => {
		setShowClanListMenuContext?.();
	}, []);

	useEscapeKeyClose(panelRef, handClosePannel);
	useOnClickOutside(panelRef, () => {
		if (!checkMenuOpen.current) {
			handClosePannel();
		}
	});
	const { handleMarkAsReadClan, statusMarkAsReadClan } = useMarkAsRead();
	useEffect(() => {
		if (statusMarkAsReadClan === 'success') {
			const clanId = clan?.id ?? clan?.clan_id;
			if (clanId) {
				dispatch(clansActions.setHasUnreadMessage({ clanId, hasUnread: false }));
			}
			handClosePannel();
		} else if (statusMarkAsReadClan === 'error') {
			handClosePannel();
		}
	}, [statusMarkAsReadClan, handClosePannel, dispatch, clan]);

	const handleChangeSettingType = (notificationType: number) => {
		const targetClanId = clan?.clan_id ?? clan?.id;
		checkMenuOpen.current = false;
		dispatch(
			defaultNotificationActions.setDefaultNotificationClan({
				clan_id: targetClanId,
				notification_type: notificationType
			})
		);
		handClosePannel();
	};

	const notificationLabel = useMemo(() => {
		const notificationType = notificationTypesList.find((type) => type.value === defaultNotificationClan?.notification_setting_type);
		return notificationType ? notificationType.label : null;
	}, [defaultNotificationClan?.notification_setting_type]);

	const { setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile, setIsShowSettingProfileInitTab, setClanIdSettingProfile } =
		useSettingFooter();
	const handleOpenClanProfileSetting = () => {
		setIsUserProfile(false);
		setIsShowSettingFooterInitTab(EUserSettings.PROFILES);
		setIsShowSettingProfileInitTab(EActiveType.CLAN_SETTING);
		setClanIdSettingProfile(clan?.clan_id || '');
		setIsShowSettingFooterStatus(true);
		if (setShowClanListMenuContext) {
			setShowClanListMenuContext();
		}
	};

	const handleRemoveLogo = () => {
		dispatch(
			clansActions.updateUser({
				user_name: userProfile?.user?.username || '',
				avatar_url: userProfile?.user?.avatar_url || '',
				display_name: userProfile?.user?.display_name || '',
				about_me: userProfile?.user?.about_me || '',
				dob: userProfile?.user?.dob || '',
				logo: ''
			})
		);
		handClosePannel();
	};

	const [isShowLeaveClanPopup, setIsShowLeaveClanPopup] = useState(false);
	const navigate = useNavigate();
	const toggleLeaveClanPopup = () => {
		setIsShowLeaveClanPopup(!isShowLeaveClanPopup);
	};
	const { removeMemberClan } = useChannelMembersActions();
	const handleLeaveClan = async () => {
		const currentClanId = await removeMemberClan({ channelId: '', clanId: clan?.clan_id as string, userIds: [] });
		toggleLeaveClanPopup();
		if (currentClanId === clan?.clan_id) {
			navigate('/chat/direct/friends');
		}
	};

	const checkMenuOpen = useRef(false);
	const menuNoti = useMemo(() => {
		const menuItems: ReactElement[] = [];
		notificationTypesList.map((notification) =>
			menuItems.push(
				<ItemPanel
					children={notification.label}
					notificationId={notification.value}
					type="radio"
					name="NotificationSetting"
					key={notification.value}
					onClick={() => handleChangeSettingType(notification.value)}
					checked={defaultNotificationClan?.notification_setting_type === notification.value}
				/>
			)
		);
		return <>{menuItems}</>;
	}, [notificationTypesList, tChannelMenu]);

	const handleCheckMenu = useCallback((visible: boolean) => {
		checkMenuOpen.current = visible;
	}, []);
	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			role={'button'}
			style={{ left: coords.mouseX, bottom: positionTop ? '12px' : 'auto', top: positionTop ? 'auto' : coords.mouseY }}
			className="outline-none fixed top-full  rounded-sm z-50 w-[200px] py-[10px] px-[10px] shadow-md bg-theme-contexify"
		>
			{userProfile ? (
				<GroupPanels>
					<ItemPanel children={t('removeLogo')} onClick={handleRemoveLogo}></ItemPanel>
				</GroupPanels>
			) : (
				<>
					<GroupPanels>
						<ItemPanel
							onClick={statusMarkAsReadClan === 'pending' ? undefined : () => handleMarkAsReadClan(clan?.id as string)}
							disabled={statusMarkAsReadClan === 'pending'}
						>
							{statusMarkAsReadClan === 'pending' ? t('processing') : t('markAsRead')}
						</ItemPanel>
					</GroupPanels>
					<GroupPanels>
						<Menu
							menu={menuNoti}
							trigger="hover"
							align={{
								offset: [-10, -20],
								points: ['tr']
							}}
							className=" bg-theme-contexify text-theme-primary border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
							onVisibleChange={handleCheckMenu}
						>
							<div>
								<ItemPanel children={t('notificationSettings')} subText={notificationLabel as string} dropdown={t('changeHere')} />
							</div>
						</Menu>
					</GroupPanels>
					<GroupPanels>
						<ItemPanel children={t('editClanProfile')} onClick={handleOpenClanProfileSetting} />
					</GroupPanels>

					<UserRestrictionZone policy={!(isOwnerOfContextClan || canManageClan)}>
						<GroupPanels>
							<ItemPanel children={t('leaveClan')} danger onClick={toggleLeaveClanPopup} />
						</GroupPanels>
					</UserRestrictionZone>
				</>
			)}
			{isShowLeaveClanPopup && (
				<ModalConfirm
					handleCancel={toggleLeaveClanPopup}
					handleConfirm={handleLeaveClan}
					modalName={clan?.clan_name}
					title="leave"
					buttonName={t('leaveClan')}
				/>
			)}
		</div>
	);
};

export default PanelClan;
