import { useAppParams, useAuth, useChatReaction, useEmojiSuggestion } from '@mezon/core';
import { selectClanView, selectCurrentChannel, selectTheme } from '@mezon/store';
import { ContextMenuItem, IEmoji, SHOW_POSITION, isPublicChannel } from '@mezon/utils';
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
};

export default function DynamicContextMenu({ menuId, items, mode, messageId }: Props) {
	const appearanceTheme = useSelector(selectTheme);
	const { emojiConverted } = useEmojiSuggestion();

	const { directId } = useAppParams();

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();

	const isClanView = useSelector(selectClanView);
	const currentChannel = useSelector(selectCurrentChannel);

	const handleClickEmoji = useCallback(
		async (emojiId: string, emojiShortCode: string) => {
			await reactionMessageDispatch('', messageId, emojiId, emojiShortCode, 1, userId.userId ?? '', false, isPublicChannel(currentChannel));
		},
		[messageId, currentChannel, directId, isClanView, reactionMessageDispatch, userId]
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
							<div key={index} style={{ display: 'flex', alignItems: 'center' }}>
								<Item key={index} onClick={() => handleClickEmoji(item.id || '', item.shortname || '')}>
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
										<span>{item.shortname}</span>
									</div>
								</Item>
								<ReactionItem
									emojiShortCode={item.shortname || ''}
									emojiId={item.id || ''}
									activeMode={mode}
									messageId={messageId}
									isOption={false}
								/>
							</div>
						))}
						<hr />
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
								<span>View Move</span>
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
	}, [items, checkPos, firstFourElements]);

	return (
		<Menu onVisibilityChange={onVisibilityChange} id={menuId} style={className} className="z-50">
			{checkPos && <ReactionPart emojiList={firstFourElements} activeMode={mode} messageId={messageId} isOption={false} />}
			{children}
		</Menu>
	);
}
