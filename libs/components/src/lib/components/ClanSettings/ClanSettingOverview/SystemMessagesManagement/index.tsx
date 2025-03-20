import { ChannelsEntity, selectAllChannels, selectCurrentClanId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { ApiSystemMessage, ApiSystemMessageRequest } from 'mezon-js/api.gen';
import React, { useEffect, useState } from 'react';

type SystemMessagesManagementProps = {
	hasChanges: boolean;
	systemMessage: ApiSystemMessage | null;
	onGetCreateSystemMessageRequest: (createSystemMessageRequest: ApiSystemMessageRequest) => void;
	onGetChannelId: (channelId: string) => void;
	onGetWelcomeRandom: (welcomeRandom: string) => void;
	onGetWelcomeSticker: (welcomeSticker: string) => void;
	onGetBoostMessage: (boostMessage: string) => void;
	onGetSetupTips: (setupTips: string) => void;
	onHasChanges: (hasChanges: boolean) => void;
	onHideAuditLog: (hideLog: string) => void;
};

const SystemMessagesManagement = ({
	hasChanges,
	systemMessage,
	onGetCreateSystemMessageRequest,
	onGetChannelId,
	onGetWelcomeRandom,
	onGetWelcomeSticker,
	onGetBoostMessage,
	onGetSetupTips,
	onHasChanges,
	onHideAuditLog
}: SystemMessagesManagementProps) => {
	const channelsList = useAppSelector(selectAllChannels);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const [selectedChannel, setSelectedChannel] = useState<ChannelsEntity | null>(null);
	const [initialChannelId, setInitialChannelId] = useState<string | undefined>(systemMessage?.channel_id ?? '');
	const [isWelcomeRandom, setIsWelcomeRandom] = useState<boolean>(systemMessage?.welcome_random == '1' ? true : false);
	const [isWelcomeRandomInitial, setIsWelcomeRandomInitial] = useState<boolean>(systemMessage?.welcome_random == '1' ? true : false);
	const [isWelcomeSticker, setIsWelcomeSticker] = useState<boolean>(systemMessage?.welcome_sticker == '1' ? true : false);
	const [isWelcomeStickerInitial, setIsWelcomeStickerInitial] = useState<boolean>(systemMessage?.welcome_sticker == '1' ? true : false);
	const [isBoostMessage, setIsBoostMessage] = useState<boolean>(systemMessage?.boost_message == '1' ? true : false);
	const [isBoostMessageInitial, setIsBoostMessageInitial] = useState<boolean>(systemMessage?.boost_message == '1' ? true : false);
	const [isSetupTips, setIsSetupTips] = useState<boolean>(systemMessage?.setup_tips == '1' ? true : false);
	const [isSetupTipsInitial, setIsSetupTipsInitial] = useState<boolean>(systemMessage?.setup_tips == '1' ? true : false);
	const [hideAuditLog, setHideAuditLog] = useState<boolean>(systemMessage?.hide_audit_log == '0' ? true : false);
	const [hideAuditLogIntial, setHideAuditLogIntial] = useState<boolean>(systemMessage?.hide_audit_log == '0' ? true : false);
	useEffect(() => {
		if (systemMessage && channelsList.length > 0) {
			const channelsListWithoutVoiceChannel = channelsList.filter(
				(channel) => channel.clan_id === currentClanId && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL
			);

			if (Object.keys(systemMessage).length == 0 && currentClanId && channelsListWithoutVoiceChannel) {
				const createSystemMessageRequest = {
					clan_id: currentClanId,
					channel_id: channelsListWithoutVoiceChannel[0].channel_id,
					welcome_random: isWelcomeRandom ? '1' : '0',
					welcome_sticker: isWelcomeSticker ? '1' : '0',
					boost_message: isBoostMessage ? '1' : '0',
					setup_tips: isSetupTips ? '1' : '0',
					hide_audit_log: hideAuditLog ? '0' : '1'
				};
				if (createSystemMessageRequest && createSystemMessageRequest.channel_id) {
					onGetCreateSystemMessageRequest(createSystemMessageRequest);
				}
				const systemMessageChannel = channelsListWithoutVoiceChannel.find(
					(channel) => channel.channel_id === createSystemMessageRequest.channel_id
				);
				setSelectedChannel(systemMessageChannel ?? channelsListWithoutVoiceChannel[0]);
			}

			const systemMessageChannel = channelsListWithoutVoiceChannel.find((channel) => channel.channel_id === systemMessage.channel_id);
			setSelectedChannel(systemMessageChannel || channelsListWithoutVoiceChannel[0]);
			setInitialChannelId(systemMessageChannel?.channel_id ?? '');
			setIsWelcomeRandomInitial(systemMessage?.welcome_random == '1' ? true : false);
			setIsWelcomeStickerInitial(systemMessage?.welcome_sticker == '1' ? true : false);
			setIsBoostMessageInitial(systemMessage?.boost_message == '1' ? true : false);
			setIsSetupTipsInitial(systemMessage?.setup_tips == '1' ? true : false);
			onGetChannelId(systemMessageChannel?.channel_id ?? '');
			setHideAuditLogIntial(systemMessage?.hide_audit_log == '0' ? true : false);
		}
	}, [systemMessage, channelsList, currentClanId]);
	useEffect(() => {
		if (
			selectedChannel?.channel_id !== initialChannelId ||
			isWelcomeRandom !== isWelcomeRandomInitial ||
			isWelcomeSticker !== isWelcomeStickerInitial ||
			isBoostMessage !== isBoostMessageInitial ||
			isSetupTips !== isSetupTipsInitial ||
			hideAuditLog !== hideAuditLogIntial
		) {
			onHasChanges(true);
		} else {
			onHasChanges(false);
		}
	}, [
		selectedChannel,
		initialChannelId,
		isWelcomeRandomInitial,
		isWelcomeStickerInitial,
		isBoostMessageInitial,
		isSetupTipsInitial,
		isWelcomeRandom,
		isWelcomeSticker,
		isBoostMessage,
		isSetupTips,
		hideAuditLogIntial,
		hideAuditLog
	]);

	useEffect(() => {
		if (hasChanges) return;

		if (initialChannelId) {
			const resetChannel = channelsList.find((channel) => channel.channel_id === initialChannelId);
			setSelectedChannel(resetChannel ?? null);
		}

		handleWelcomeRandomToggle(isWelcomeRandomInitial);
		handleWelcomeStickerToggle(isWelcomeStickerInitial);
		handleBoostMessageToggle(isBoostMessageInitial);
		handleSetupTipsToggle(isSetupTipsInitial);
		handleHideAuditLog(hideAuditLogIntial);
	}, [
		hasChanges,
		initialChannelId,
		channelsList,
		isWelcomeRandomInitial,
		isWelcomeStickerInitial,
		isBoostMessageInitial,
		isSetupTipsInitial,
		hideAuditLogIntial
	]);

	const handleSelectChannel = async (channel: ChannelsEntity) => {
		setSelectedChannel(channel);
		if (channel.channel_id) {
			onGetChannelId(channel.channel_id);
		}
	};

	const handleWelcomeRandomToggle = (checked: boolean) => {
		setIsWelcomeRandom(checked);
		onGetWelcomeRandom(checked ? '1' : '0');
	};

	const handleWelcomeStickerToggle = (checked: boolean) => {
		setIsWelcomeSticker(checked);
		onGetWelcomeSticker(checked ? '1' : '0');
	};

	const handleBoostMessageToggle = (checked: boolean) => {
		setIsBoostMessage(checked);
		onGetBoostMessage(checked ? '1' : '0');
	};

	const handleSetupTipsToggle = (checked: boolean) => {
		setIsSetupTips(checked);
		onGetSetupTips(checked ? '1' : '0');
	};

	const handleHideAuditLog = (checked: boolean) => {
		setHideAuditLog(checked);
		onHideAuditLog(checked ? '0' : '1');
	};

	return (
		<div
			className={
				'border-t dark:border-borderDivider border-borderDividerLight mt-10 pt-10 flex flex-col dark:text-textSecondary text-textSecondary800'
			}
		>
			<h3 className="text-sm font-bold uppercase mb-2">System Messages Channel</h3>
			<Dropdown
				placement={'bottom-start'}
				label={''}
				renderTrigger={() => (
					<div className="w-full h-10 rounded-md flex flex-row p-3 justify-between items-center uppercase text-sm dark:bg-bgInputDark bg-bgLightModeThird border dark:text-textPrimary text-textPrimaryLight">
						<div className={'dark:text-textPrimary text-textPrimary400 flex flex-row items-center'}>
							{selectedChannel?.channel_private ? (
								<Icons.HashtagLocked defaultSize="w-4 h-4 dark:text-channelTextLabel" />
							) : (
								<Icons.Hashtag defaultSize="w-4 h-4 dark:text-channelTextLabel" />
							)}
							<p>{selectedChannel?.channel_label}</p>
							<p className={'uppercase dark:text-textThreadPrimary ml-5 font-semibold'}>{selectedChannel?.category_name}</p>
						</div>
						<div>
							<Icons.ArrowDownFill />
						</div>
					</div>
				)}
				className={'h-fit max-h-[200px] text-xs overflow-y-scroll customSmallScrollLightMode dark:bg-bgTertiary px-2 z-20'}
			>
				{channelsList
					.filter((channel) => channel.clan_id === currentClanId && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL)
					.map((channel) =>
						channel.channel_id !== selectedChannel?.channel_id ? (
							<Dropdown.Item
								key={channel.id}
								className="flex flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm dark:hover:bg-bgModifierHover hover:bg-bgIconDark text-sm w-full py-2 px-4 text-left cursor-pointer"
								onClick={() => handleSelectChannel(channel)}
							>
								{channel?.channel_private ? (
									<Icons.HashtagLocked defaultSize="w-4 h-4 dark:text-channelTextLabel" />
								) : (
									<Icons.Hashtag defaultSize="w-4 h-4 dark:text-channelTextLabel" />
								)}
								<p>{channel.channel_label ?? ''}</p>
								<p className="uppercase dark:text-textSecondary text-textSecondary800 ml-5 font-semibold">{channel.category_name}</p>
							</Dropdown.Item>
						) : null
					)}
			</Dropdown>
			<p className={'text-xs dark:text-textPrimary text-textPrimaryLight py-2'}>
				This is the channel we send system event messages to. These can be turned off at any time
			</p>
			<ToggleItem
				label={'Send a random welcome message when someone joins this server.'}
				value={isWelcomeRandom}
				handleToggle={handleWelcomeRandomToggle}
			/>
			<ToggleItem
				label={'Prompt members to reply to welcome messages with a sticker.'}
				value={isWelcomeSticker}
				handleToggle={handleWelcomeStickerToggle}
			/>
			<ToggleItem label={'Send a message when someone Boosts this server.'} value={isBoostMessage} handleToggle={handleBoostMessageToggle} />
			<ToggleItem label={'Send helpful tips for server setup.'} value={isSetupTips} handleToggle={handleSetupTipsToggle} />
			<ToggleItem label={'Send a log when an action is applied to the clan'} value={hideAuditLog} handleToggle={handleHideAuditLog} />
		</div>
	);
};

export default SystemMessagesManagement;

type ToggleItemProps = {
	label: string;
	value: boolean;
	handleToggle: (checked: boolean) => void;
};

const ToggleItem: React.FC<ToggleItemProps> = ({ label, value, handleToggle }) => {
	return (
		<div className="Frame347 self-stretch justify-start items-center gap-3 inline-flex text-sm py-1">
			<div className="Frame409 grow shrink basis-0 h-6 justify-start items-center gap-1 flex">
				<p>{label}</p>
			</div>
			<div className="relative flex flex-wrap items-center">
				<input
					className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
               bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
                 hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600
                  focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed
                   disabled:bg-slate-200 disabled:after:bg-slate-300"
					type="checkbox"
					checked={value}
					onChange={(e) => handleToggle(e.target.checked)}
				/>
			</div>
		</div>
	);
};
