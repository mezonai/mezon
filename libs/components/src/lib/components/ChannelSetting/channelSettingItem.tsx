import { useChannels, usePermissionChecker } from '@mezon/core';
import { ChannelsEntity, selectWelcomeChannelByClanId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, IChannel, checkIsThread } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { EChannelSettingTab } from '.';
import ModalConfirm from '../ModalConfirm';

export type ChannelSettingItemProps = {
	onItemClick: (settingName: string) => void;
	channel: IChannel;
	stateClose: boolean;
	stateMenu: boolean;
	onCloseModal: () => void;
};

const ChannelSettingItem = (props: ChannelSettingItemProps) => {
	const { onItemClick, channel, stateMenu, stateClose } = props;
	const isPrivate = channel.channel_private;
	const [selectedButton, setSelectedButton] = useState<string | null>('Overview');
	const [showModal, setShowModal] = useState(false);
	const [hasManageChannelPermission, hasClanPermission] = usePermissionChecker(
		[EPermission.manageChannel, EPermission.manageClan],
		channel.channel_id ?? ''
	);
	const canEditChannelPermissions = hasManageChannelPermission;

	const isThread = checkIsThread(channel as ChannelsEntity);

	const handleButtonClick = (buttonName: string) => {
		setSelectedButton(buttonName);
		onItemClick && onItemClick(buttonName);
	};

	const { handleConfirmDeleteChannel } = useChannels();
	const handleCloseModalShow = () => {
		setShowModal(false);
	};

	const handleDeleteChannel = () => {
		handleConfirmDeleteChannel(channel.channel_id as string, channel.clan_id as string);
		handleCloseModalShow();
	};

	const renderIcon = () => {
		if (isThread) {
			if (isPrivate) {
				return <Icons.ThreadIconLocker className="w-5 h-5 -mt-1 min-w-5 block dark:text-[#AEAEAE] text-colorTextLightMode" />;
			}
			return <Icons.ThreadIcon defaultSize="w-5 h-5 -mt-1 min-w-5" />;
		}

		if (channel.type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (isPrivate) {
				return <Icons.HashtagLocked defaultSize="w-5 h-5 -mt-1 min-w-5" />;
			}
			return <Icons.Hashtag defaultSize="w-5 h-5 -mt-1 min-w-5" />;
		}

		if (channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			if (isPrivate) {
				return <Icons.SpeakerLocked defaultSize="w-5 h-5 min-w-5" />;
			}
			return <Icons.Speaker defaultSize="w-5 h-5 min-w-5" />;
		}

		if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) {
			if (isPrivate) {
				return <Icons.SpeakerLocked defaultSize="w-5 h-5 min-w-5" />;
			}
			return <Icons.Stream defaultSize="w-5 h-5 min-w-5" />;
		}
	};
	const welcomeChannelId = useSelector((state) => selectWelcomeChannelByClanId(state, channel?.clan_id as string));

	return (
		<div
			className={`overflow-y-auto w-1/6 xl:w-1/4 min-w-56 text-theme-primary bg-theme-setting-nav flex justify-end pt-96 pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 2xl:flex-grow hide-scrollbar flex-grow  ${stateClose && !stateMenu ? 'hidden' : 'flex'}`}
		>
			<div className="w-170px flex flex-col">
				<div className="flex justify-start max-w-[170px]">
					{renderIcon()} &nbsp;
					<p className="text-[#84ADFF] font-bold text-sm tracking-wider max-w-[160px] overflow-x-hidden text-ellipsis uppercase one-line">
						{channel.channel_label}
					</p>
				</div>

				<ChannelSettingItemButton tabName={EChannelSettingTab.OVERVIEW} handleOnClick={handleButtonClick} selectedButton={selectedButton} />
				{!isThread && (
					<>
						<ChannelSettingItemButton
							tabName={EChannelSettingTab.CATEGORY}
							handleOnClick={handleButtonClick}
							selectedButton={selectedButton}
						/>
						{channel.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
							channel.type !== ChannelType.CHANNEL_TYPE_APP &&
							channel.id !== welcomeChannelId &&
							canEditChannelPermissions && (
								<ChannelSettingItemButton
									tabName={EChannelSettingTab.PREMISSIONS}
									handleOnClick={handleButtonClick}
									selectedButton={selectedButton}
								/>
							)}
					</>
				)}
				{channel.type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE && hasClanPermission && (
					<ChannelSettingItemButton
						tabName={EChannelSettingTab.INTEGRATIONS}
						handleOnClick={handleButtonClick}
						selectedButton={selectedButton}
					/>
				)}
				{canEditChannelPermissions &&
					channel.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
					channel.type !== ChannelType.CHANNEL_TYPE_APP && (
						<ChannelSettingItemButton
							tabName={EChannelSettingTab.QUICK_MENU}
							handleOnClick={handleButtonClick}
							selectedButton={selectedButton}
						/>
					)}
				<hr className="border-t border-solid dark:border-borderDefault my-4" />
				<button
					className={`p-2 dark:text-red-600 text-red-600 text-[16px] font-medium pl-2 ml-[-8px] hover:bg-bgModifierHoverLight dark:hover:bg-bgModalLight ${selectedButton === 'Delete' ? 'dark:bg-[#232E3B] bg-bgLightModeButton  ' : ''} w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						setShowModal(true);
					}}
				>
					Delete {isThread ? 'Thread' : 'Channel'}
				</button>
			</div>
			{showModal && (
				<ModalConfirm
					handleCancel={handleCloseModalShow}
					handleConfirm={handleDeleteChannel}
					title="delete"
					modalName={`${channel.channel_label}`}
					message="This cannot be undone"
				/>
			)}
		</div>
	);
};

export default ChannelSettingItem;
const ChannelSettingItemButton = ({
	tabName,
	handleOnClick,
	selectedButton
}: {
	tabName: string;
	handleOnClick: (tab: string) => void;
	selectedButton: string | null;
}) => {
	const handleOnClickTabChannelSetting = () => {
		handleOnClick(tabName);
	};
	return (
		<button
			className={`text-theme-primary text-[16px] font-medium rounded-[5px] text-left ml-[-8px] p-2 mt-2 bg-item-theme-hover ${selectedButton === tabName ? 'bg-item-theme text-theme-primary-active' : ''}`}
			onClick={handleOnClickTabChannelSetting}
		>
			{tabName}
		</button>
	);
};
