import { fetchChannels, selectAllChannels, selectCurrentClanId, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import { ChannelStatusEnum, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ApiSystemMessage, ApiSystemMessageRequest } from 'mezon-js/api.gen';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

enum ETypeUpdateSystemMessage {
	WELCOME_RANDOM = 1,
	WELCOME_STICKER = 2,
	BOOTS_MESSAGE = 3,
	SETUP_TIPS = 4,
	HIDE_AUDIT_LOG = 5,
	CHANNEL = 6
}

type SystemMessagesManagementProps = {
	updateSystem: ApiSystemMessage | null;
	setUpdateSystemMessageRequest: React.Dispatch<React.SetStateAction<ApiSystemMessageRequest | null>>;
	channelSelectedId: string;
	setClanRequest: (channel: any) => void;
};

const SystemMessagesManagement = ({
	updateSystem,
	setUpdateSystemMessageRequest,
	channelSelectedId,
	setClanRequest
}: SystemMessagesManagementProps) => {
	const { t } = useTranslation('clanSettings');
	const dispatch = useAppDispatch();
	const channelsList = useAppSelector(selectAllChannels);
	const currentClanId = useAppSelector(selectCurrentClanId);

	useEffect(() => {
		if (currentClanId && channelsList.length === 0) {
			dispatch(
				fetchChannels({
					clanId: currentClanId,
					channelType: ChannelType.CHANNEL_TYPE_CHANNEL
				})
			);
		}
	}, [currentClanId, dispatch, channelsList.length]);
	const selectedChannel = useMemo(() => {
		return channelsList.find((channel) => channel.id === channelSelectedId);
	}, [channelsList, channelSelectedId]);

	const handleToggleSetting = (checked: boolean, type: ETypeUpdateSystemMessage, channelId?: string) => {
		if (channelId && channelId !== channelSelectedId && type === ETypeUpdateSystemMessage.CHANNEL) {
			setUpdateSystemMessageRequest({ ...updateSystem, channel_id: channelId });
			setClanRequest((prev: any) => ({ ...prev, welcome_channel_id: channelId }));
			return;
		}
		switch (type) {
			case ETypeUpdateSystemMessage.HIDE_AUDIT_LOG:
				setUpdateSystemMessageRequest({ ...updateSystem, hide_audit_log: checked ? '0' : '1' });
				break;
			case ETypeUpdateSystemMessage.SETUP_TIPS:
				setUpdateSystemMessageRequest({ ...updateSystem, setup_tips: checked ? '1' : '0' });
				break;
			case ETypeUpdateSystemMessage.WELCOME_RANDOM:
				setUpdateSystemMessageRequest({ ...updateSystem, welcome_random: checked ? '1' : '0' });
				break;
			default:
				break;
		}
	};
	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];
		channelsList
			.filter(
				(channel) =>
					channel.clan_id === currentClanId &&
					channel.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
					channel.channel_private !== ChannelStatusEnum.isPrivate
			)
			.map((channel) => {
				if (channel.id !== selectedChannel?.id) {
					menuItems.push(
						<Menu.Item
							key={channel.id}
							className="flex flex-row items-center rounded-sm text-sm w-full py-2 px-4 text-left cursor-pointer"
							onClick={() => handleToggleSetting(true, ETypeUpdateSystemMessage.CHANNEL, channel.id)}
						>
							{channel?.channel_private ? (
								<Icons.HashtagLocked defaultSize="w-4 h-4 dark:text-channelTextLabel" />
							) : (
								<Icons.Hashtag defaultSize="w-4 h-4 dark:text-channelTextLabel" />
							)}
							<p data-e2e={generateE2eId('clan_page.settings.overview.system_messages_channel.selection.item.channel_name')}>
								{channel.channel_label ?? ''}
							</p>
							<p
								data-e2e={generateE2eId('clan_page.settings.overview.system_messages_channel.selection.item.category_name')}
								className="uppercase ml-5 font-semibold"
							>
								{channel.category_name}
							</p>
						</Menu.Item>
					);
				}
			});
		return <>{menuItems}</>;
	}, [channelsList, selectedChannel?.id]);
	return (
		<div className={'border-t-theme-primary mt-10 pt-10 flex flex-col '}>
			<h3 className="text-sm font-bold uppercase mb-2">{t('systemMessages.title')}</h3>
			<Menu menu={menu} className={'h-fit max-h-[200px] text-xs overflow-y-scroll customSmallScrollLightMode bg-theme-input px-2 z-20'}>
				<div
					className="w-full cursor-pointer  h-10 rounded-md flex flex-row p-3 justify-between items-center uppercase text-sm border border-theme-primary bg-theme-input "
					data-e2e={generateE2eId('clan_page.settings.overview.system_messages_channel')}
				>
					<div className={' flex flex-row items-center'}>
						<Icons.Hashtag defaultSize="w-4 h-4 " />
						<p data-e2e={generateE2eId('clan_page.settings.overview.system_messages_channel.selection.selected.channel_name')}>
							{selectedChannel?.channel_label}
						</p>
						<p
							className={'uppercase ml-5 font-semibold'}
							data-e2e={generateE2eId('clan_page.settings.overview.system_messages_channel.selection.selected.category_name')}
						>
							{selectedChannel?.category_name}
						</p>
					</div>
					<div>
						<Icons.ArrowDownFill />
					</div>
				</div>
			</Menu>
			<p className={'text-sm py-2'}>{t('systemMessages.description')}</p>
			<ToggleItem
				label={t('systemMessages.welcomeRandom')}
				value={updateSystem?.welcome_random === '1'}
				handleToggle={(e) => handleToggleSetting(e, ETypeUpdateSystemMessage.WELCOME_RANDOM)}
			/>
			<ToggleItem
				label={t('systemMessages.setupTips')}
				value={updateSystem?.setup_tips === '1'}
				handleToggle={(e) => handleToggleSetting(e, ETypeUpdateSystemMessage.SETUP_TIPS)}
			/>
			<ToggleItem
				label={t('systemMessages.auditLog')}
				value={updateSystem?.hide_audit_log !== '1'}
				handleToggle={(e) => handleToggleSetting(e, ETypeUpdateSystemMessage.HIDE_AUDIT_LOG)}
			/>
		</div>
	);
};

export default SystemMessagesManagement;

type ToggleItemProps = {
	label: string;
	value: boolean;
	handleToggle: (checked: boolean) => void;
};

export const ToggleItem: React.FC<ToggleItemProps> = ({ label, value, handleToggle }) => {
	return (
		<div className="self-stretch justify-start items-center gap-3 inline-flex text-sm py-1">
			<div className="grow shrink basis-0 h-6 justify-start items-center gap-1 flex">
				<p>{label}</p>
			</div>
			<div className="relative flex flex-wrap items-center">
				<input
					className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
						bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
						after:bg-slate-500 after:transition-all
						checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
						hover:bg-slate-400 after:hover:bg-slate-600
						checked:hover:bg-[#4654C0] checked:after:hover:bg-white
						focus:outline-none focus-visible:outline-none"
					type="checkbox"
					checked={value}
					onChange={(e) => handleToggle(e.target.checked)}
				/>
			</div>
		</div>
	);
};
