import { useAuth, useChatReaction } from '@mezon/core';
import { selectCurrentChannel, selectCurrentClanId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EmojiDataOptionals, IMessageWithUser, SenderInfoOptionals, calculateTotalCount, getSrcEmoji, isPublicChannel } from '@mezon/utils';
import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import UserReactionPanel from './UserReactionPanel';

type EmojiItemProps = {
	emoji: EmojiDataOptionals;
	mode: number;
	message: IMessageWithUser;
};

function ItemEmoji({ emoji, mode, message }: EmojiItemProps) {
	const dispatch = useDispatch();
	const userId = useAuth();
	const { reactionMessageDispatch } = useChatReaction();
	const emojiHover = useRef<EmojiDataOptionals | null>(null);
	const getUrlItem = getSrcEmoji(emoji.emojiId || '');
	const count = calculateTotalCount(emoji.senders);
	const userSenderCount = emoji.senders.find((sender: SenderInfoOptionals) => sender.sender_id === userId.userId)?.count;
	const emojiItemRef = useRef<HTMLDivElement | null>(null);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);

	async function reactOnExistEmoji(
		id: string,
		mode: number,
		messageId: string,
		emojiId: string,
		emoji: string,
		count: number,
		message_sender_id: string,
		action_delete: boolean
	) {
		await reactionMessageDispatch(
			id,

			messageId ?? '',
			emojiId ?? '',
			emoji ?? '',
			1,
			message_sender_id ?? '',
			false,
			isPublicChannel(currentChannel)
		);
	}

	const handleOpenShortUser = useCallback((emoji: EmojiDataOptionals) => {
		if (emoji && emojiItemRef.current) {
			emojiHover.current = emoji;
			const { y, left } = emojiItemRef.current.getBoundingClientRect();
			let elementHeight = ((emojiHover.current?.senders.length || 1) + 1) * 48 + 40;
			const maxHeight = 205;
			elementHeight = elementHeight > maxHeight ? maxHeight : elementHeight;
			const offset = 24;

			positionShortUser.current = {
				top: window.innerHeight - y - 70 > elementHeight ? y + offset : y - offset - elementHeight,
				left: left
			};

			openProfileItem();
		}
	}, []);

	const timeoutEnter = useRef<NodeJS.Timeout | null>(null);

	const onHoverEnter = useCallback(
		async (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
			if (timeoutEnter.current) {
				clearTimeout(timeoutEnter.current);
			}
			timeoutEnter.current = setTimeout(() => {
				handleOpenShortUser(emoji);
			}, 300);

			return () => timeoutEnter.current && clearTimeout(timeoutEnter.current);
		},
		[emoji, handleOpenShortUser]
	);

	const [openProfileItem, closeProfileItem] = useModal(() => {
		return (
			emojiHover?.current && (
				<div
					onMouseEnter={() => {
						timeoutLeave.current && clearTimeout(timeoutLeave.current);
					}}
					onMouseLeave={() => {
						closeProfileItem();
					}}
					className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 dark:bg-black bg-gray-200 rounded-lg flex flex-col`}
					style={{
						top: `${positionShortUser.current?.top}px`,
						left: `${positionShortUser.current?.left}px`
					}}
				>
					<div className="text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
						<UserReactionPanel message={message} emojiShowPanel={emojiHover.current} mode={mode} />
					</div>
				</div>
			)
		);
	}, [message, emojiHover]);

	const timeoutLeave = useRef<NodeJS.Timeout | null>(null);

	const onHoverLeave = useCallback(() => {
		if (timeoutLeave.current) {
			clearTimeout(timeoutLeave.current);
		}
		timeoutLeave.current = setTimeout(() => {
			closeProfileItem();
		}, 300);
		return () => timeoutLeave.current && clearTimeout(timeoutLeave.current);
	}, [closeProfileItem]);

	const positionShortUser = useRef<{ top: number; left: number } | null>(null);

	return (
		<ItemDetail
			ref={emojiItemRef}
			onMouse={onHoverEnter}
			onLeave={onHoverLeave}
			userSenderCount={userSenderCount ?? NaN}
			onClickReactExist={() =>
				reactOnExistEmoji(
					emoji.emojiId ?? '',
					mode,
					emoji.message_id ?? '',
					emoji.emojiId ?? '',
					emoji.emoji ?? '',
					1,
					userId.userId ?? '',
					false
				)
			}
			getUrlItem={getUrlItem}
			totalCount={count}
		/>
	);
}

export default ItemEmoji;

type ItemDetailProps = {
	ref: React.RefObject<HTMLDivElement>;
	onMouse: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
	onLeave: () => void;
	userSenderCount: number;
	onClickReactExist: () => void;
	getUrlItem: string;
	totalCount: number;
};

const ItemDetail = forwardRef<HTMLDivElement, ItemDetailProps>(
	({ onMouse, onLeave, userSenderCount, onClickReactExist, getUrlItem, totalCount }, ref) => {
		const strCount = useMemo(() => {
			const thresh = 1000;

			if (Math.abs(totalCount) < thresh) {
				return totalCount;
			}

			const units = ['K', 'M', 'G', 'T'];
			let u = -1;
			const r = 10 ** 1;

			let num = totalCount;
			do {
				num /= thresh;
				++u;
			} while (Math.round(Math.abs(num) * r) / r >= thresh && u < units.length - 1);

			return num.toFixed(0) + units[u];
		}, [totalCount]);

		return (
			<div className="flex flex-row gap-1">
				<div
					ref={ref}
					onMouseEnter={onMouse}
					onMouseLeave={onLeave}
					className={`rounded-md w-fit min-w-12 gap-3 h-6 flex flex-row noselect
          cursor-pointer justify-center items-center relative
          ${userSenderCount > 0 ? 'dark:bg-[#373A54] bg-gray-200 border-blue-600 border' : 'dark:bg-[#2B2D31] bg-bgLightMode border-[#313338]'}`}
					onClick={onClickReactExist}
				>
					<span className="absolute left-[5px]">
						<img src={getUrlItem} className="w-4 h-4 object-scale-down" alt="Item Icon" />
					</span>
					<div className=" text-[13px] top-[2px] ml-5 absolute justify-center text-center cursor-pointer dark:text-white text-black">
						<p>{strCount}</p>
					</div>
				</div>
			</div>
		);
	}
);

type ArrowItemProps = {
	arrow: boolean;
	isRightLimit: boolean;
	isLeftLimit: boolean;
	emojiCross: EmojiDataOptionals;
};

function ArrowItem({ arrow, isRightLimit, emojiCross, isLeftLimit }: ArrowItemProps) {
	const dispatch = useDispatch();
	const onHover = () => {};
	return (
		<div
			onMouseEnter={onHover}
			className="w-full h-3  cursor-pointer"
			style={{
				display: 'flex',
				justifyContent: isRightLimit && !isLeftLimit ? 'flex-end' : !isRightLimit && isLeftLimit ? 'flex-start' : 'center'
			}}
		>
			{arrow && window.innerWidth >= 640 && <Icons.ArrowDownFill className={`dark:text-[#28272b] text-white`} />}
		</div>
	);
}
