import { useAppParams, useAuth, useChatReaction, useEmojiConverted } from '@mezon/core';
import {
	getActiveMode,
	getStore,
	quickMenuActions,
	selectAllAccount,
	selectClanView,
	selectClickedOnTopicStatus,
	selectCurrentChannelClanId,
	selectCurrentChannelParentId,
	selectCurrentChannelPrivate,
	selectCurrentTopicId,
	selectMemberClanByUserId,
	selectMessageByMessageId,
	selectQuickMenusByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Menu as Dropdown, Icons } from '@mezon/ui';
import type { ContextMenuItem, IEmoji, IMessageWithUser } from '@mezon/utils';
import { QUICK_MENU_TYPE, SHOW_POSITION, generateE2eId, isPublicChannel } from '@mezon/utils';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { Item, Menu, Separator, Submenu } from 'react-contexify';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useMessageContextMenu } from './MessageContextMenuContext';
import ReactionItem from './ReactionItem';
import ReactionPart from './ReactionPart';
import { SearchableCommandList } from './SearchableCommandList';

interface QuickMenu {
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
	command: QuickMenu;
}

type Props = {
	menuId: string;
	items: ContextMenuItem[];
	messageId: string;
	message: IMessageWithUser;
	isTopic?: boolean;
	onQuickMenuExecute?: (command: QuickMenu) => void;
	currentChannelId?: string;
};

export default function DynamicContextMenu({ menuId, items, messageId, message, isTopic, onQuickMenuExecute, currentChannelId }: Props) {
	const emojiConverted = useEmojiConverted();
	const { t } = useTranslation('contextMenu');

	const { directId } = useAppParams();

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const currenTopicId = useSelector(selectCurrentTopicId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelClanId = useSelector(selectCurrentChannelClanId);

	const isClanView = useSelector(selectClanView);
	const currentMessage = useAppSelector((state) =>
		selectMessageByMessageId(state, isFocusTopicBox ? currenTopicId : currentChannelId, messageId || '')
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
				is_public: isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate }),
				clanId: currentChannelClanId ?? '',
				channelId: isTopic ? currentChannelId || '' : (message?.channel_id ?? ''),
				isFocusTopicBox,
				channelIdOnMessage: currentMessage?.channel_id
			});
		},
		[messageId, directId, isClanView, reactionMessageDispatch, userId, isFocusTopicBox, currentMessage?.channel_id]
	);

	const firstFourElements = useMemo(() => {
		return emojiConverted.slice(0, 4);
	}, [emojiConverted]) as IEmoji[];

	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');
	const [isQuickMenu, setIsLoadingCommands] = useState(false);
	const dispatch = useAppDispatch();

	const className = useMemo(
		() =>
			({
				'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
				'--contexify-activeItem-color': 'var(--text-secondary)',
				'--contexify-activeItem-bgColor': warningStatus || 'var(--bg-item-hover)',
				'--contexify-rightSlot-color': 'var(--text-secondary)',
				'--contexify-activeRightSlot-color': 'var(--text-secondary)',
				'--contexify-arrow-color': 'var(--text-theme-primary)',
				'--contexify-activeArrow-color': 'var(--text-secondary)',
				'--contexify-separator-color': 'var(--text-separator-theme-primary)',
				'--contexify-menu-radius': '8px',
				'--contexify-item-color': 'var(--text-theme-primary)',
				border: '1px solid var(--border-primary)'
			}) as React.CSSProperties,
		[warningStatus]
	);

	const { posShowMenu, onVisibilityChange } = useMessageContextMenu();
	const checkPos = useMemo(() => {
		if (posShowMenu === SHOW_POSITION.NONE || posShowMenu === SHOW_POSITION.IN_STICKER || posShowMenu === SHOW_POSITION.IN_EMOJI) {
			return true;
		}
		return false;
	}, [posShowMenu]);

	const handleQuickMenuClick = useCallback(
		async (quickMenu: QuickMenu) => {
			const store = getStore();
			const userProfile = selectAllAccount(store.getState());
			const profileInClan = selectMemberClanByUserId(store.getState(), userProfile?.user?.id ?? '');

			if (quickMenu.menu_type === QUICK_MENU_TYPE.QUICK_MENU) {
				try {
					const channelId = currentChannelId || currentChannelId || '';
					const clanId = currentChannelClanId || '';
					const mode = getActiveMode(channelId);
					const isPublic = isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate });

					await dispatch(
						quickMenuActions.writeQuickMenuEvent({
							channelId,
							clanId,
							menuName: quickMenu.display || quickMenu.menu_name || '',
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
			} else if (quickMenu.action_msg && onQuickMenuExecute) {
				onQuickMenuExecute(quickMenu);
			}
		},
		[onQuickMenuExecute, dispatch, currentChannelId, messageId, message, isFocusTopicBox, currenTopicId]
	);

	const quickMenuItems = useAppSelector((state) => selectQuickMenusByChannelId(state, currentChannelId || ''));

	const quickMenuOptions = useMemo(() => {
		if (isQuickMenu) {
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
	}, [quickMenuItems, isQuickMenu]);

	const handleQuickMenuSelect = useCallback(
		(selectedOption: CommandOption | null) => {
			if (selectedOption && selectedOption.command) {
				handleQuickMenuClick(selectedOption.command);
			}
		},
		[handleQuickMenuClick]
	);

	const shouldShowQuickMenu = useMemo(() => {
		return quickMenuItems.length > 0 || isQuickMenu;
	}, [quickMenuItems, isQuickMenu]);

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

		reactItems.push(<hr key="separator-hr" className="border-b-theme-primary" />);
		reactItems.push(
			<Item key="view-more" className="w-full px-2 py-1">
				<div
					className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium text-theme-primary text-theme-primary-hover p-1`}
					onClick={() => {
						if (addReactionFunction) {
							addReactionFunction.handleItemClick?.();
						}
					}}
				>
					<span>{t('viewMore')}</span>
				</div>
			</Item>
		);
		return <>{reactItems}</>;
	}, [firstFourElements, handleClickEmoji, isTopic, items, message, messageId, t]);

	const dropdownQuickMenus = useMemo(() => {
		if (isQuickMenu) {
			return (
				<div className="w-[320px] p-4 text-center text-gray-500">
					<div className="flex items-center justify-center gap-2 mb-2">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
							<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="30" strokeDashoffset="30" />
						</svg>
						<span>{t('loadingQuickMenus')}</span>
					</div>
				</div>
			);
		}

		if (quickMenuOptions.length === 0) {
			return (
				<div className="w-[320px] p-4 text-center text-gray-500">
					<span>{t('noQuickMenusAvailable')}</span>
				</div>
			);
		}

		return (
			<Item onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} onKeyPress={(e) => e.stopPropagation()}>
				<SearchableCommandList
					options={quickMenuOptions}
					onChange={handleQuickMenuSelect}
					placeholder={t('typeToSearchQuickMenus')}
					isLoading={isQuickMenu}
					className="w-[320px]"
					autoFocus={true}
				/>
			</Item>
		);
	}, [isQuickMenu, quickMenuOptions, handleQuickMenuSelect, t]);

	const children = useMemo(() => {
		const elements: React.ReactNode[] = [];
		for (let index = 0; index < items.length; index++) {
			const item = items[index];

			if (item.label === t('deleteMessage') && !isTopic && message?.content?.tp && message?.content?.tp !== '0') {
				continue;
			}
			const hasEdit = items.some((i) => i.label === t('editMessage'));
			const lableItemWarning =
				item.label === t('deleteMessage') ||
				item.label === t('reportMessage') ||
				item.label === t('removeReactions') ||
				item.label === t('removeAllReactions');
			if (item.label === t('deleteMessage') && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === t('editMessage') && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === t('reply') && !hasEdit && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === t('copyText') && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === t('copyLink') && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === t('copyImage')) elements.push(<Separator key={`separator-${index}`} />);
			const labelAddReaction = item.label === t('addReaction');
			const labelQuickMenus = item.label === t('quickMenus');
			if (labelQuickMenus && shouldShowQuickMenu) {
				elements.push(
					<Dropdown
						align={{
							points: ['tl', 'br']
						}}
						menu={dropdownQuickMenus}
						key={item.label}
						trigger="hover"
						className="border-none bg-theme-contexify"
					>
						<div>
							<Item key={index} onClick={item.handleItemClick} disabled={item.disabled}>
								<div
									data-e2e={generateE2eId('chat.message_action_modal.button.base')}
									className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium p-1 text-theme-primary text-theme-primary-hover`}
								>
									<span>{t('quickMenus')}</span>
									<span>
										<Icons.RightArrowRightClick defaultSize="w-4 h-4" />
									</span>
								</div>
							</Item>
						</div>
					</Dropdown>
				);
			} else if (labelAddReaction) {
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
									data-e2e={generateE2eId('chat.message_action_modal.button.base')}
									className={`flex justify-between items-center w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium p-1 ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}`}
								>
									<span>{t('addReaction')}</span>
									<span>
										<Icons.RightArrowRightClick defaultSize="w-4 h-4" />
									</span>
								</div>
							</Item>
						</div>
					</Dropdown>
				);
			} else if (!labelQuickMenus) {
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
							data-e2e={generateE2eId('chat.message_action_modal.button.base')}
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
		quickMenuOptions,
		isQuickMenu,
		handleQuickMenuSelect,
		isTopic,
		message,
		shouldShowQuickMenu,
		dropdownReact,
		dropdownQuickMenus,
		t
	]);

	return (
		<>
			<style>
				{`
					.contexify_submenu {
						padding: 0 !important;
						max-height: 80vh !important;
						overflow-y: auto !important;
						min-width: 200px !important;
						width: auto !important;
					}
					.contexify_submenu .contexify_itemContent {
						padding: 0 !important;
						width: 100% !important;
					}
					.rc-dropdown  {
						margin-left: 15px !important;
					}
					.contexify {
						max-width: calc(100vw - 10px) !important;
						min-width: 230px !important;
						overflow: visible !important;
					}
					@media (min-width: 501px) {
						.contexify {
							width: auto !important;
							max-height: 85vh !important;
							overflow-y: auto !important;
						}
					}
					@media (max-width: 500px) {
						.contexify {
							width: 100% !important;
							max-width: 500px !important;
							max-height: 80vh !important;
							overflow-y: auto !important;
						}
					}
				`}
			</style>
			<Menu
				onVisibilityChange={onVisibilityChange}
				id={menuId}
				style={className}
				className="z-50 rounded-lg text-theme-primary text-theme-primary-hover border-theme-primary thread-scroll"
			>
				{checkPos && !message?.isError && (
					<ReactionPart emojiList={firstFourElements} messageId={messageId} isOption={false} message={message} isTopic={!!isTopic} />
				)}
				{children}
			</Menu>
		</>
	);
}
