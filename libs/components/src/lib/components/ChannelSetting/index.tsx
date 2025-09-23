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
	QUICK_MENU = 'Quick Menu'
}
const SettingChannel = (props: ModalSettingProps) => {
	const { onClose, channel } = props;
	const { t } = useTranslation('channelSetting');
	const channelId = (channel?.channel_id || (channel as any)?.id || '') as string;
	const channelFromStore = useAppSelector((state) => selectChannelById(state, channelId));
	const currentChannel = (channelFromStore || channel) as IChannel;

	const [currentSetting, setCurrentSetting] = useState<string>(EChannelSettingTab.OVERVIEW);
	const [menu, setMenu] = useState(true);
	const [displayChannelLabel, setDisplayChannelLabel] = useState<string>(currentChannel?.channel_label || '');

	const getTabTranslation = useCallback(
		(tabKey: string) => {
			const translations: Record<string, string> = {
				[EChannelSettingTab.OVERVIEW]: t('tabs.overview'),
				[EChannelSettingTab.PREMISSIONS]: t('tabs.permissions'),
				[EChannelSettingTab.INVITES]: t('tabs.invites'),
				[EChannelSettingTab.INTEGRATIONS]: t('tabs.integrations'),
				[EChannelSettingTab.CATEGORY]: t('tabs.category'),
				[EChannelSettingTab.QUICK_MENU]: t('tabs.quickMenu')
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
	};
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchUserChannels({ channelId: channel.channel_id as string }));
	}, [channel.channel_id, dispatch]);

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

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="flex fixed inset-0  w-screen z-30 cursor-default"
			onMouseDown={(event) => event.stopPropagation()}
			role="button"
		>
			<div className="flex text-gray- w-screen relative text-white">
				<div className="h-fit absolute top-5 right-5 block sbm:hidden z-[1]">
					<div
						onClick={() => onClose()}
						className="rounded-full p-[10px] border-2 dark:border-[#a8a6a6] border-black cursor-pointer dark:text-[#a8a6a6] text-black"
					>
						<Icons.CloseButton className="w-4" />
					</div>
				</div>
				<div className="h-fit absolute top-5 left-5 block sbm:hidden z-[1]">
					<button
						className={`bg-[#AEAEAE] w-[30px] h-[30px] rounded-[50px] font-bold transform hover:scale-105 hover:bg-slate-400 transition duration-300 ease-in-out flex justify-center items-center ${menu ? 'rotate-90' : '-rotate-90'}`}
						onClick={() => setMenu(!menu)}
					>
						<Icons.ArrowDown defaultFill="white" defaultSize="w-[20px] h-[30px]" />
					</button>
				</div>
				<ChannelSettingItem
					onItemClick={handleSettingItemClick}
					channel={channel}
					onCloseModal={onClose}
					stateClose={closeMenu}
					stateMenu={menu}
					displayChannelLabel={displayChannelLabel}
					getTabTranslation={getTabTranslation}
				/>
				{currentSetting === EChannelSettingTab.OVERVIEW && (
					<OverviewChannel channel={channel} onDisplayLabelChange={setDisplayChannelLabel} />
				)}
				{currentSetting === EChannelSettingTab.PREMISSIONS && (
					<PermissionsChannel channel={channel} openModalAdd={openModalAdd} parentRef={modalRef} clanId={channel.clan_id} />
				)}
				{currentSetting === EChannelSettingTab.INVITES && <InvitesChannel />}
				{currentSetting === EChannelSettingTab.INTEGRATIONS && <IntegrationsChannel currentChannel={channel} />}
				{currentSetting === EChannelSettingTab.CATEGORY && <SettingCategoryChannel channel={channel} />}
				{currentSetting === EChannelSettingTab.QUICK_MENU && (
					<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] sbm:pb-7 sbm:pr-[10px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
						<QuickMenuAccessManager channelId={channel.channel_id || ''} clanId={channel.clan_id || ''} />
					</div>
				)}

				<ExitSetting onClose={onClose} />
			</div>
		</div>
	);
};

export default SettingChannel;
