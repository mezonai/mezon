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
	const channelId = (channel?.channel_id || (channel as any)?.id || '') as string;
	const channelFromStore = useAppSelector((state) => selectChannelById(state, channelId));
	const currentChannel = (channelFromStore || channel) as IChannel;

	const [currentSetting, setCurrentSetting] = useState<string>(EChannelSettingTab.OVERVIEW);
	const [menu, setMenu] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const [displayChannelLabel, setDisplayChannelLabel] = useState<string>(currentChannel?.channel_label || '');

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
		if (window.innerWidth < 480) {
			setIsSidebarOpen(false);
		}
	};

	const handleMenuBtn = () => {
		setIsSidebarOpen((prev) => !prev);
	};
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchUserChannels({ channelId: channel.channel_id as string }));
	}, [channel?.channel_id]);

	const closeMenu = useSelector(selectCloseMenu);

	const openModalAdd = useRef(false);

	const handleClose = useCallback(() => {
		if (!openModalAdd.current) {
			onClose();
		}
	}, []);

	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, handleClose);
	useOnClickOutside(modalRef, handleClose);

	useEffect(() => {
		setDisplayChannelLabel(currentChannel?.channel_label || '');
	}, [currentChannel?.channel_id, currentChannel?.channel_label]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 480) {
				setIsSidebarOpen(true);
			} else {
				setIsSidebarOpen(false);
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
			className="flex fixed inset-0  w-screen z-[70] cursor-default"
			onMouseDown={(event) => event.stopPropagation()}
			role="button"
		>
			<div className="flex text-gray- w-screen relative text-white">
				<div className="flex sbm:hidden fixed top-0 left-0 right-0 justify-between items-center z-[60] bg-theme-setting-primary pb-4 pt-4 px-4">
					<div className="absolute inset-0 bg-gradient-to-b from-theme-setting-primary via-theme-setting-primary/95 to-transparent pointer-events-none" />
					<div className="relative z-10">
						{!isSidebarOpen ? (
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
				<div className="flex flex-row flex-1 w-screen overflow-hidden">
					{isSidebarOpen && (
						<div className="fixed inset-0 bg-black bg-opacity-50 z-40 sbm:hidden" onClick={() => setIsSidebarOpen(false)} />
					)}
					<div
						className={`${
							!isSidebarOpen ? 'hidden sbm:flex' : 'flex fixed sbm:relative left-0 top-0 h-full z-50 sbm:z-auto'
						} w-1/6 xl:w-1/4 min-w-56 relative bg-theme-setting-nav text-theme-primary ${closeMenu && !menu && window.innerWidth >= 480 ? 'hidden' : ''}`}
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
					<div className="flex-1 bg-theme-setting-primary text-theme-primary overflow-y-auto hide-scrollbar">
						<div className="flex flex-row flex-1 justify-start h-full">
							<div className="w-full max-w-[740px] pl-4 pr-4 sbm:w-auto sbm:max-w-none sbm:pl-0 sbm:pr-0">
								<div className="relative max-h-full text-theme-primary pt-[70px] sbm:pt-0">
									{currentSetting === EChannelSettingTab.OVERVIEW && (
										<OverviewChannel channel={channel} onDisplayLabelChange={setDisplayChannelLabel} />
									)}
									{currentSetting === EChannelSettingTab.PREMISSIONS && (
										<PermissionsChannel
											channel={channel}
											openModalAdd={openModalAdd}
											parentRef={modalRef}
											clanId={channel.clan_id}
										/>
									)}
									{currentSetting === EChannelSettingTab.INVITES && <InvitesChannel />}
									{currentSetting === EChannelSettingTab.INTEGRATIONS && <IntegrationsChannel currentChannel={channel} />}
									{currentSetting === EChannelSettingTab.CATEGORY && <SettingCategoryChannel channel={channel} />}
									{currentSetting === EChannelSettingTab.STREAM_THUMBNAIL && <StreamThumbnailChannel channel={channel} />}
									{currentSetting === EChannelSettingTab.QUICK_MENU && (
										<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-full lg:pt-[94px] sbm:pb-7 pr-[10px] sbm:pr-[10px] pl-[10px] sbm:pl-[40px] overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
											<QuickMenuAccessManager channelId={channel.channel_id || '0'} clanId={channel.clan_id || '0'} />
										</div>
									)}
								</div>
							</div>
							<ExitSetting onClose={onClose} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingChannel;
