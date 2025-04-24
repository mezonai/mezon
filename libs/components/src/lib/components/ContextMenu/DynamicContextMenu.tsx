import { useAppParams, useAuth, useChatReaction, useEmojiConverted } from '@mezon/core';
import {
	selectClanView,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentTopicId,
	selectMessageByMessageId,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { ContextMenuItem, IEmoji, IMessageWithUser, SHOW_POSITION, isPublicChannel } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
import { CSSProperties, useCallback, useMemo, useState } from 'react';
import { Item, Menu, Separator, Submenu } from 'react-contexify';
import { useSelector } from 'react-redux';
import { useMessageContextMenu } from './MessageContextMenuContext';
import ReactionItem from './ReactionItem';
import ReactionPart from './ReactionPart';

type Props = {
	menuId: string;
	items: ContextMenuItem[];
	mode: number | undefined;
	messageId: string;
	message: IMessageWithUser;
	isTopic: boolean;
};

export default function DynamicContextMenu({ menuId, items, mode, messageId, message, isTopic }: Props) {
	const appearanceTheme = useSelector(selectTheme);
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
			console.log('handleClickEmoji');

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
				mode: mode ?? 0,
				channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
				isFocusTopicBox,
				channelIdOnMessage: currentMessage?.channel_id
			});
		},
		[messageId, currentChannel, directId, isClanView, reactionMessageDispatch, userId, isFocusTopicBox, currentMessage?.channel_id, mode]
	);

	const firstFourElements = useMemo(() => {
		return emojiConverted.slice(0, 4);
	}, [emojiConverted]) as IEmoji[];

	const [warningStatus, setWarningStatus] = useState<string>('');

	const isLightMode = useMemo(() => {
		return appearanceTheme === 'light';
	}, [appearanceTheme]);

	const className: CSSProperties = {
		'--contexify-menu-bgColor': isLightMode ? '#FFFFFF' : '#111214',
		'--contexify-activeItem-bgColor': warningStatus,
		'--contexify-rightSlot-color': '#6f6e77',
		'--contexify-activeRightSlot-color': '#fff',
		'--contexify-arrow-color': '#6f6e77',
		'--contexify-activeArrow-color': '#fff',
		'--contexify-itemContent-padding': '-3px',
		'--contexify-menu-radius': '2px',
		'--contexify-activeItem-radius': '2px',
		'--contexify-menu-minWidth': '188px',
		'--contexify-separator-color': '#ADB3B9'
	} as CSSProperties;

	const { posShowMenu, onVisibilityChange } = useMessageContextMenu();
	const checkPos = useMemo(() => {
		if (posShowMenu === SHOW_POSITION.NONE || posShowMenu === SHOW_POSITION.IN_STICKER || posShowMenu === SHOW_POSITION.IN_EMOJI) {
			return true;
		}
		return false;
	}, [posShowMenu]);

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

			if (lableAddReaction) {
				elements.push(
					<Dropdown
						key={item.label}
						trigger="hover"
						dismissOnClick={false}
						renderTrigger={() => (
							<div>
								<Item key={index} onClick={item.handleItemClick} disabled={item.disabled}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: '100%',
											fontFamily: `'gg sans', 'Noto Sans', sans-serif`,
											fontSize: '14px',
											fontWeight: 500
										}}
										className={`${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF]' : ' dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF]'}  p-1`}
									>
										<span>Add Reaction</span>
									</div>
								</Item>
							</div>
						)}
						label=""
						placement="right-start"
						className="dark:bg-black bg-white border-none"
					>
						{firstFourElements.map((item, index) => (
							<div className="w-[320px]" key={index}>
								<Item
									className="flex justify-between items-center w-full px-2 py-1"
									key={index}
									onClick={() => handleClickEmoji(item.id || '', item.shortname || '')}
								>
									<div
										className={`flex truncate justify-between items-center w-full font-sans text-sm font-medium ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF]' : ' dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF]'}  p-1`}
									>
										{item.shortname}
									</div>
									<div className="p-1">
										<ReactionItem
											emojiShortCode={item.shortname || ''}
											emojiId={item.id || ''}
											activeMode={mode}
											messageId={messageId}
											isOption={false}
											isAddReactionPanel
											message={message}
											isTopic={isTopic}
										/>
									</div>
								</Item>
							</div>
						))}
						<hr className="border-t dark:border-gray-600" />
						<Item className="w-full px-2 py-1" key={index} onClick={item.handleItemClick} disabled={item.disabled}>
							<div
								className={`class="flex justify-between items-center w-full font-sans text-sm font-medium ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF]' : ' dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF]'}  p-1`}
							>
								<span>View More</span>
							</div>
						</Item>
					</Dropdown>
				);
			} else {
				elements.push(
					<Item
						key={item.label}
						onClick={item.handleItemClick}
						disabled={item.disabled}
						onMouseEnter={() => {
							if (lableItemWarning) {
								setWarningStatus('#E13542');
							} else {
								setWarningStatus('#4B5CD6');
							}
						}}
						onMouseLeave={() => {
							setWarningStatus('#4B5CD6');
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								width: '100%',
								fontFamily: `'gg sans', 'Noto Sans', sans-serif`,
								fontSize: '14px',
								fontWeight: 500
							}}
							className={`${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF]' : ' dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF]'}  p-1`}
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
	}, [items, checkPos, firstFourElements, mode, messageId, handleClickEmoji]);

	return (
		<Menu onVisibilityChange={onVisibilityChange} id={menuId} style={className} className="z-50">
			{checkPos && (
				<ReactionPart
					emojiList={firstFourElements}
					activeMode={mode}
					messageId={messageId}
					isOption={false}
					message={message}
					isTopic={isTopic}
				/>
			)}
			{children}
		</Menu>
	);
}
