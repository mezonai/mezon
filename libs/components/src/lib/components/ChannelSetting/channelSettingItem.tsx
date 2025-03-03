import { useChannels, usePermissionChecker } from '@mezon/core';
import { ChannelsEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, IChannel, checkIsThread } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useState } from 'react';
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
	const [hasManageChannelPermission] = usePermissionChecker([EPermission.manageChannel], channel.channel_id ?? '');
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

	return (
		<div
			className={`overflow-y-auto w-1/6 xl:w-1/4 min-w-56 dark:bg-bgSecondary bg-white dark:text-white text-black flex justify-end pt-96 pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 2xl:flex-grow hide-scrollbar flex-grow  ${stateClose && !stateMenu ? 'hidden' : 'flex'}`}
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
						{canEditChannelPermissions && (
							<ChannelSettingItemButton
								tabName={EChannelSettingTab.PREMISSIONS}
								handleOnClick={handleButtonClick}
								selectedButton={selectedButton}
							/>
						)}
						<ChannelSettingItemButton
							tabName={EChannelSettingTab.INVITES}
							handleOnClick={handleButtonClick}
							selectedButton={selectedButton}
						/>
					</>
				)}
				<ChannelSettingItemButton
					tabName={EChannelSettingTab.INTEGRATIONS}
					handleOnClick={handleButtonClick}
					selectedButton={selectedButton}
				/>
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
			className={`dark:text-[#AEAEAE] text-black w-[170px] text-[16px] font-medium rounded-[5px] text-left ml-[-8px] p-2 mt-2 hover:bg-bgModifierHoverLight dark:hover:bg-bgModalLight ${selectedButton === tabName ? 'dark:bg-[#232E3B] bg-bgLightModeButton' : ''}`}
			onClick={handleOnClickTabChannelSetting}
		>
			{tabName}
		</button>
	);
};
