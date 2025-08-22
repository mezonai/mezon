import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { fetchUserChannels, selectCloseMenu, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
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

	const [currentSetting, setCurrentSetting] = useState<string>(EChannelSettingTab.OVERVIEW);
	const [menu, setMenu] = useState(true);

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
				/>
				{currentSetting === EChannelSettingTab.OVERVIEW && <OverviewChannel channel={channel} />}
				{currentSetting === EChannelSettingTab.PREMISSIONS && (
					<PermissionsChannel channel={channel} openModalAdd={openModalAdd} parentRef={modalRef} />
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
