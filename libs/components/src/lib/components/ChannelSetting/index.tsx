import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { fetchUserChannels, selectChannelById, selectCloseMenu, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import QuickMenuAccessManager from '../ClanSettings/SettingChannel/QuickMenuAccessManager';
import SettingCategoryChannel from './Component/CategoryChannel';
import IntegrationsChannel from './Component/IntegrationsChannel';
import InvitesChannel from './Component/InvitesChannel';
import OverviewChannel from './Component/OverviewChannel';
import PermissionsChannel from './Component/PermissionsChannel';
import StreamThumbnailChannel from './Component/StreamThumbnail';
import ChannelSettingItem from './channelSettingItem';
import ExitSetting from './exitSetting';

export type ModalSettingProps = {
	onClose: () => void;
	channel: IChannel;
};
export enum EChannelSettingTab {
	OVERVIEW = 'Overview',
	PREMISSIONS = 'Permissions',
	INVITES = 'Invites',
	INTEGRATIONS = 'Integrations',
	CATEGORY = 'Category',
	QUICK_MENU = 'Quick Menu',
	STREAM_THUMBNAIL = 'Stream Thumbnail'
}
const SettingChannel = (props: ModalSettingProps) => {
	const { onClose, channel } = props;
	const { t } = useTranslation('channelSetting');
	const channelId = (channel?.channelId || (channel as any)?.id || '') as string;
	const channelFromStore = useAppSelector((state) => selectChannelById(state, channelId));
	const currentChannel = (channelFromStore || channel) as IChannel;

	const [currentSetting, setCurrentSetting] = useState<string>(EChannelSettingTab.OVERVIEW);
	const [menu, setMenu] = useState(true);
	const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
	const [displayChannelLabel, setDisplayChannelLabel] = useState<string>(currentChannel?.channelLabel || '');

	const closeMenu = useSelector(selectCloseMenu);
	const dispatch = useAppDispatch();

	const getTabTranslation = useCallback(
		(tabKey: string) => {
			const translations: Record<string, string> = {
				[EChannelSettingTab.OVERVIEW]: t('tabs.overview'),
				[EChannelSettingTab.PREMISSIONS]: t('tabs.permissions'),
				[EChannelSettingTab.INVITES]: t('tabs.invites'),
				[EChannelSettingTab.INTEGRATIONS]: t('tabs.integrations'),
				[EChannelSettingTab.CATEGORY]: t('tabs.category'),
				[EChannelSettingTab.QUICK_MENU]: t('tabs.quickMenu'),
				[EChannelSettingTab.STREAM_THUMBNAIL]: t('streamThumbnail:title')
			};
			return translations[tabKey] || tabKey;
		},
		[t]
	);

	const handleSettingItemClick = (settingName: string) => {
		setCurrentSetting(settingName);
		if (closeMenu) {
			setMenu(false);
		}
		if (window.innerWidth < 768) {
			setMenuIsOpen(false);
		}
	};

	const handleMenuBtn = () => {
		setMenuIsOpen(!menuIsOpen);
	};

	useEffect(() => {
		dispatch(fetchUserChannels({ channelId: channel.channelId as string }));
	}, [channel?.channelId, dispatch]);

	const openModalAdd = useRef(false);

	const handleClose = useCallback(() => {
		if (!openModalAdd.current) {
			onClose();
		}
	}, [onClose]);

	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, handleClose);
	useOnClickOutside(modalRef, handleClose);

	useEffect(() => {
		setDisplayChannelLabel(currentChannel?.channelLabel || '');
	}, [currentChannel?.channelId, currentChannel?.channelLabel]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setMenuIsOpen(true);
			} else {
				setMenuIsOpen(false);
			}
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="flex fixed inset-0  w-screen z-30 cursor-default bg-theme-setting-primary text-theme-primary"
			onMouseDown={(event) => event.stopPropagation()}
			role="button"
		>
			<div className="flex text-gray- w-screen relative text-white">
				{menuIsOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sbm:hidden" onClick={() => setMenuIsOpen(false)} />}
				<div
					className={`${
						!menuIsOpen ? 'hidden sbm:flex' : 'flex fixed sbm:relative left-0 top-0 h-full z-50 sbm:z-auto'
					} w-1/6 xl:w-1/4 min-w-56 relative bg-theme-setting-nav`}
				>
					<ChannelSettingItem
						onItemClick={handleSettingItemClick}
						channel={channel}
						onCloseModal={onClose}
						stateClose={closeMenu}
						stateMenu={menu}
						displayChannelLabel={displayChannelLabel}
						getTabTranslation={getTabTranslation}
					/>
				</div>
				<div className="flex sbm:hidden fixed top-0 left-0 right-0 justify-between items-center z-[60] bg-theme-setting-primary pb-4 pt-4 px-4">
					<div className="absolute inset-0 bg-gradient-to-b from-theme-setting-primary via-theme-setting-primary/95 to-transparent pointer-events-none" />
					<div className="relative z-10">
						{!menuIsOpen ? (
							<button className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer" onClick={handleMenuBtn}>
								<Icons.OpenMenu className="w-full h-full" />
							</button>
						) : (
							<button className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer" onClick={handleMenuBtn}>
								<Icons.ArrowLeftCircleActive className="w-full h-full" />
							</button>
						)}
					</div>
					<div onClick={onClose} className="relative z-10 cursor-pointer">
						<Icons.CloseIcon className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover" />
					</div>
				</div>
				{currentSetting === EChannelSettingTab.OVERVIEW && (
					<OverviewChannel channel={channel} onDisplayLabelChange={setDisplayChannelLabel} menuIsOpen={menuIsOpen} />
				)}
				{currentSetting === EChannelSettingTab.PREMISSIONS && (
					<PermissionsChannel
						channel={channel}
						openModalAdd={openModalAdd}
						parentRef={modalRef}
						clanId={channel.clanId}
						menuIsOpen={menuIsOpen}
					/>
				)}
				{currentSetting === EChannelSettingTab.INVITES && <InvitesChannel menuIsOpen={menuIsOpen} />}
				{currentSetting === EChannelSettingTab.INTEGRATIONS && <IntegrationsChannel currentChannel={channel} menuIsOpen={menuIsOpen} />}
				{currentSetting === EChannelSettingTab.CATEGORY && <SettingCategoryChannel channel={channel} menuIsOpen={menuIsOpen} />}
				{currentSetting === EChannelSettingTab.STREAM_THUMBNAIL && <StreamThumbnailChannel channel={channel} menuIsOpen={menuIsOpen} />}
				{currentSetting === EChannelSettingTab.QUICK_MENU && (
					<div
						className={`overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] sbm:pb-7 sbm:pr-[10px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar ${!menuIsOpen ? 'sbm:pt-[94px] pt-[70px]' : 'pt-[94px]'}`}
					>
						<QuickMenuAccessManager channelId={channel.channelId || ''} clanId={channel.clanId || ''} />
					</div>
				)}

				<ExitSetting onClose={onClose} />
			</div>
		</div>
	);
};

export default SettingChannel;
