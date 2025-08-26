import { useAppParams, useAuth, useChatReaction, useEmojiConverted } from '@mezon/core';
import {
	getActiveMode,
	getStore,
	quickMenuActions,
	selectAllAccount,
	selectClanView,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentTopicId,
	selectMemberClanByUserId2,
	selectMessageByMessageId,
	selectQuickMenusByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu as Dropdown } from '@mezon/ui';
import { ContextMenuItem, IEmoji, IMessageWithUser, QUICK_MENU_TYPE, SHOW_POSITION, isPublicChannel } from '@mezon/utils';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { Item, Menu, Separator, Submenu } from 'react-contexify';
import { useSelector } from 'react-redux';
import { useMessageContextMenu } from './MessageContextMenuContext';
import ReactionItem from './ReactionItem';
import ReactionPart from './ReactionPart';
import { SearchableCommandList } from './SearchableCommandList';

interface SlashCommand {
	id: string;
	display: string;
	action_msg?: string;
	description?: string;
	menu_id?: string;
	menu_type?: number;
	menu_name?: string;
	isBuiltIn?: boolean;
}

interface CommandOption {
	value: string;
	label: string;
	command: SlashCommand;
}

type Props = {
	menuId: string;
	items: ContextMenuItem[];
	messageId: string;
	message: IMessageWithUser;
	isTopic?: boolean;
	onSlashCommandExecute?: (command: SlashCommand) => void;
	currentChannelId?: string;
};

export default function DynamicContextMenu({ menuId, items, messageId, message, isTopic, onSlashCommandExecute, currentChannelId }: Props) {
	const emojiConverted = useEmojiConverted();

	const { directId } = useAppParams();

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const currenTopicId = useSelector(selectCurrentTopicId);

	const isClanView = useSelector(selectClanView);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentMessage = useAppSelector((state) =>
		selectMessageByMessageId(state, isFocusTopicBox ? currenTopicId : currentChannel?.channel_id, messageId || '')
	);

	const handleClickEmoji = useCallback(
		async (emojiId: string, emojiShortCode: string) => {
			await reactionMessageDispatch({
				id: emojiId,
				messageId,
				emoji_id: emojiId,
				emoji: emojiShortCode,
				count: 1,
				message_sender_id: userId.userId ?? '',
				action_delete: false,
				is_public: isPublicChannel(currentChannel),
				clanId: currentChannel?.clan_id ?? '',
				channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
				isFocusTopicBox,
				channelIdOnMessage: currentMessage?.channel_id
			});
		},
		[messageId, currentChannel, directId, isClanView, reactionMessageDispatch, userId, isFocusTopicBox, currentMessage?.channel_id]
	);

	const firstFourElements = useMemo(() => {
		return emojiConverted.slice(0, 4);
	}, [emojiConverted]) as IEmoji[];

	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');
	const [isLoadingCommands, setIsLoadingCommands] = useState(false);
	const dispatch = useAppDispatch();

	const className = {
		'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
		'--contexify-item-color': 'var(--text-theme-primary)',
		'--contexify-activeItem-color': 'var(--text-secondary)',
		'--contexify-activeItem-bgColor': warningStatus || 'var(--bg-item-hover)',
		'--contexify-rightSlot-color': 'var(--text-secondary)',
		'--contexify-activeRightSlot-color': 'var(--text-secondary)',
		'--contexify-arrow-color': 'var(--text-theme-primary)',
		'--contexify-activeArrow-color': 'var(--text-secondary)'
	} as React.CSSProperties;

	const { posShowMenu, onVisibilityChange } = useMessageContextMenu();
	const checkPos = useMemo(() => {
		if (posShowMenu === SHOW_POSITION.NONE || posShowMenu === SHOW_POSITION.IN_STICKER || posShowMenu === SHOW_POSITION.IN_EMOJI) {
			return true;
		}
		return false;
	}, [posShowMenu]);

	const handleSlashCommandClick = useCallback(
		async (command: SlashCommand) => {
			const store = getStore();
			const userProfile = selectAllAccount(store.getState());
			const profileInClan = selectMemberClanByUserId2(store.getState(), userProfile?.user?.id ?? '');

			if (command.menu_type === QUICK_MENU_TYPE.QUICK_MENU) {
				try {
					const channelId = currentChannelId || currentChannel?.channel_id || '';
					const clanId = currentChannel?.clan_id || '';
					const mode = getActiveMode(channelId);
					const isPublic = isPublicChannel(currentChannel);

					await dispatch(
						quickMenuActions.writeQuickMenuEvent({
							channelId,
							clanId,
							menuName: command.display || command.menu_name || '',
							mode,
							isPublic,
							content: message.content,
							mentions: message?.mentions || [],
							attachments: message?.attachments || [],
							references: message?.references || [],
							anonymousMessage: false,
							mentionEveryone: false,
							avatar: profileInClan?.clan_avatar || userProfile?.user?.avatar_url,
							code: 0,
							topicId: isFocusTopicBox ? currenTopicId : undefined
						})
					);
				} catch (error) {
					console.error('Error sending quick menu event:', error);
				}
			} else if (command.action_msg && onSlashCommandExecute) {
				onSlashCommandExecute(command);
			}
		},
		[onSlashCommandExecute, dispatch, currentChannelId, currentChannel, messageId, message, isFocusTopicBox, currenTopicId]
	);

	const quickMenuItems = useAppSelector((state) => selectQuickMenusByChannelId(state, currentChannelId || ''));

	const slashCommandOptions = useMemo(() => {
		if (isLoadingCommands) {
			return [];
		}

		return quickMenuItems.map((item) => ({
			value: `quick_menu_${item.id}`,
			label: `/${item.menu_name || ''}`,
			command: {
				id: `quick_menu_${item.id}`,
				display: item.menu_name || '',
				action_msg: item.action_msg || '',
				menu_id: item.id,
				menu_type: item.menu_type || 1,
				isBuiltIn: false
			}
		}));
	}, [quickMenuItems, isLoadingCommands]);

	const handleCommandSelect = useCallback(
		(selectedOption: CommandOption | null) => {
			if (selectedOption && selectedOption.command) {
				handleSlashCommandClick(selectedOption.command);
			}
		},
		[handleSlashCommandClick]
	);

	const shouldShowQuickMenu = useMemo(() => {
		return quickMenuItems.length > 0 || isLoadingCommands;
	}, [quickMenuItems, isLoadingCommands]);

	const dropdownReact = useMemo(() => {
		const reactItems: ReactElement[] = [];
		const addReactionFunction = items.find((item) => item.id === 'addReaction');
		firstFourElements.map((item, index) =>
			reactItems.push(
				<div className="w-[320px] " key={index}>
					<Item
						className="flex justify-between items-center w-full px-2 py-1"
						key={index}
						onClick={() => handleClickEmoji(item.id || '', item.shortname || '')}
					>
						<div
							className={`flex truncate justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium text-theme-primary text-theme-primary-hover p-1`}
						>
							{item.shortname}
						</div>
						<div className="p-1">
							<ReactionItem
								emojiShortCode={item.shortname || ''}
								emojiId={item.id || ''}
								messageId={messageId}
								isOption={false}
								isAddReactionPanel
								message={message}
								isTopic={!!isTopic}
							/>
						</div>
					</Item>
				</div>
			)
		);

		reactItems.push(<hr className="border-b-theme-primary" />);
		reactItems.push(
			<Item className="w-full px-2 py-1">
				<div
					className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium text-theme-primary text-theme-primary-hover p-1`}
					onClick={() => {
						if (addReactionFunction) {
							addReactionFunction.handleItemClick?.();
						}
					}}
				>
					<span>View More</span>
				</div>
			</Item>
		);
		return <>{reactItems}</>;
	}, [firstFourElements]);

	const children = useMemo(() => {
		const elements: React.ReactNode[] = [];
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const lableItemWarning =
				item.label === 'Delete Message' ||
				item.label === 'Report Message' ||
				item.label === 'Remove Reactions' ||
				item.label === 'Remove All Reactions';
			if (item.label === 'Copy Link' && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === 'Copy Image') elements.push(<Separator key={`separator-${index}`} />);
			const lableAddReaction = item.label === 'Add Reaction';
			const lableSlashCommands = item.label === 'Slash Commands';

			if (lableSlashCommands && shouldShowQuickMenu) {
				elements.push(
					<Submenu
						key={item.label}
						label={<span className="text-sm font-medium pl-[4px]">Quick Menu</span>}
						className="border-none bg-theme-contexify p-0"
					>
						{isLoadingCommands ? (
							<div className="w-[320px] p-4 text-center text-gray-500">
								<div className="flex items-center justify-center gap-2 mb-2">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
										<circle
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="2"
											strokeDasharray="30"
											strokeDashoffset="30"
										/>
									</svg>
									<span>Loading commands...</span>
								</div>
							</div>
						) : slashCommandOptions.length === 0 ? (
							<div className="w-[320px] p-4 text-center text-gray-500">
								<span>No commands available</span>
							</div>
						) : (
							<Item onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} onKeyPress={(e) => e.stopPropagation()}>
								<SearchableCommandList
									options={slashCommandOptions}
									onChange={handleCommandSelect}
									placeholder="Type to search slash commands..."
									isLoading={isLoadingCommands}
									className="w-[320px]"
									autoFocus={true}
								/>
							</Item>
						)}
					</Submenu>
				);
			} else if (lableAddReaction) {
				elements.push(
					<Dropdown
						align={{
							points: ['tl', 'br']
						}}
						menu={dropdownReact}
						key={item.label}
						trigger="hover"
						className=" border-none bg-theme-contexify"
					>
						<div>
							<Item key={index} onClick={item.handleItemClick} disabled={item.disabled}>
								<div
									className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium p-1 ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}`}
								>
									<span>Add Reaction</span>
								</div>
							</Item>
						</div>
					</Dropdown>
				);
			} else if (!lableSlashCommands) {
				elements.push(
					<Item
						key={item.label}
						onClick={item.handleItemClick}
						disabled={item.disabled}
						onMouseEnter={() => {
							if (lableItemWarning) {
								setWarningStatus('#f67e882a');
							} else {
								setWarningStatus('var(--bg-item-hover)');
							}
						}}
						onMouseLeave={() => {
							setWarningStatus('var(--bg-item-hover)');
						}}
					>
						<div
							className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium p-1 ${lableItemWarning ? ' text-[#E13542]  ' : 'text-theme-primary text-theme-primary-hover'}`}
						>
							<span>{item.label}</span>
							<span> {item.icon}</span>
						</div>
					</Item>
				);
			}

			if (item.hasSubmenu)
				elements.push(
					<Submenu label={item.label}>
						{item.subMenuItems?.map((subMenuItem) => (
							<Item key={subMenuItem.id} onClick={subMenuItem.handleItemClick} disabled={subMenuItem.disabled}>
								{subMenuItem.label}
							</Item>
						))}
					</Submenu>
				);
		}
		return elements;
	}, [
		items,
		checkPos,
		firstFourElements,
		messageId,
		handleClickEmoji,
		slashCommandOptions,
		isLoadingCommands,
		handleCommandSelect,
		isTopic,
		message,
		shouldShowQuickMenu
	]);

	return (
		<>
			<style>
				{`
					.contexify_submenu {
						padding: 0 !important;
					}
					.contexify_submenu .contexify_itemContent {
						padding: 0 !important;
					}
				`}
			</style>
			<Menu
				onVisibilityChange={onVisibilityChange}
				id={menuId}
				style={className}
				className="z-50 rounded-lg  text-theme-primary text-theme-primary-hover border-theme-primary "
			>
				{checkPos && (
					<ReactionPart emojiList={firstFourElements} messageId={messageId} isOption={false} message={message} isTopic={!!isTopic} />
				)}
				{children}
			</Menu>
		</>
	);
}
