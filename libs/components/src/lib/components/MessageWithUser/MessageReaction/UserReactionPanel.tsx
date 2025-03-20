import { useAuth, useChatReaction, useUserById } from '@mezon/core';
import { selectClickedOnTopicStatus, selectCurrentChannel, selectReactionsByEmojiIdFromMessage, useAppSelector } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import {
	EmojiDataOptionals,
	IMessageWithUser,
	SenderInfoOptionals,
	calculateTotalCount,
	createImgproxyUrl,
	getSrcEmoji,
	isPublicChannel
} from '@mezon/utils';
import { ForwardedRef, Fragment, forwardRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type UserReactionPanelProps = {
	emojiShowPanel: EmojiDataOptionals;
	mode: number;
	message: IMessageWithUser;
};

const UserReactionPanel = forwardRef(({ emojiShowPanel, mode, message }: UserReactionPanelProps, ref: ForwardedRef<HTMLDivElement>) => {
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();
	const currentChannel = useSelector(selectCurrentChannel);
	const getEmojiById = useAppSelector((state) =>
		selectReactionsByEmojiIdFromMessage(state, message.channel_id, message.id, emojiShowPanel.emojiId ?? '')
	);

	const removeEmojiSender = async (
		id: string,
		messageId: string,
		emoji_id: string,
		emoji: string,
		message_sender_id: string,
		countRemoved: number
	) => {
		await reactionMessageDispatch(
			id,

			messageId,
			getEmojiById?.emojiId ?? '',
			getEmojiById?.emoji ?? '',
			countRemoved,
			message_sender_id,
			true,
			isPublicChannel(currentChannel),
			isFocusTopicBox,
			message?.channel_id
		);
	};

	const hideSenderOnPanel = useCallback((emojiData: EmojiDataOptionals, senderId: string) => {
		const newEmojiData = { ...emojiData };
		if (newEmojiData.senders) {
			newEmojiData.senders = newEmojiData.senders.filter((sender) => sender.sender_id !== senderId);
		}
		return newEmojiData;
	}, []);

	const count = calculateTotalCount(getEmojiById?.senders ?? []);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{count > 0 && (
				<div className="flex flex-col justify-center ">
					<div
						onClick={(e) => e.stopPropagation()}
						className={`z-50 w-[18rem] dark:bg-bgSecondary600 bg-white border-[#28272b] rounded-sm min-h-5 max-h-[25rem] ${window.innerWidth < 640 ? 'flex flex-col justify-center' : 'p-1 bottom-0'}`}
					>
						<PanelHeader emojiId={getEmojiById?.emojiId} emojiName={getEmojiById?.emoji ?? ''} count={count} />
						<div ref={ref} tabIndex={-1} className="max-h-40 overflow-y-auto hide-scrollbar focus-visible:outline-none">
							{getEmojiById?.senders.map((sender: SenderInfoOptionals, index: number) => {
								if (sender.count && sender.count > 0) {
									return (
										<Fragment key={`${index}_${sender.sender_id}`}>
											<SenderItem
												sender={sender}
												emojiShowPanel={getEmojiById}
												userId={userId}
												removeEmojiSender={removeEmojiSender}
												hideSenderOnPanel={hideSenderOnPanel}
											/>
										</Fragment>
									);
								}
								return null;
							})}
						</div>
					</div>
				</div>
			)}
		</>
	);
});

UserReactionPanel.displayName = 'UserReactionPanel';

export default UserReactionPanel;

type PanelHeaderProps = {
	emojiId: string | undefined;
	emojiName: string;
	count: number;
};

const PanelHeader: React.FC<PanelHeaderProps> = ({ emojiId, emojiName, count }) => {
	return (
		<div>
			<div className="flex flex-row items-center m-2 dark:text-white text-black">
				<img src={getSrcEmoji(emojiId ?? '')} className="w-5 h-5 min-h-5 min-w-5" alt="" />
				<p className="text-sm ml-2">{count}</p>
				<p className="text-sm ml-2">{emojiName}</p>
			</div>
			<hr className="h-[0.1rem] dark:bg-blue-900 bg-[#E1E1E1] border-none" />
		</div>
	);
};

type SenderItemProps = {
	sender: any;
	emojiShowPanel: any;
	userId: any;
	removeEmojiSender: (
		id: string,
		messageId: string,
		emoji_id: string,
		emoji: string,
		message_sender_id: string,
		countRemoved: number
	) => Promise<void>;
	hideSenderOnPanel: (emojiData: any, senderId: string) => void;
};

const SenderItem: React.FC<SenderItemProps> = ({ sender, emojiShowPanel, userId, removeEmojiSender, hideSenderOnPanel }) => {
	const handleRemoveEmojiSender = async (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		await removeEmojiSender(
			emojiShowPanel?.id ?? '',
			emojiShowPanel?.messageId ?? '',
			emojiShowPanel?.emojiId ?? '',
			emojiShowPanel?.emoji ?? '',
			sender?.sender_id ?? '',
			sender?.count ?? 0
		);

		hideSenderOnPanel(emojiShowPanel, sender.sender_id ?? '');
	};

	const user = useUserById(sender.sender_id);

	return (
		<div className="m-2 flex flex-row justify-start mb-2 items-center gap-2 relative">
			<div className="w-8 h-8">
				<AvatarImage
					className="w-8 h-8"
					alt="user avatar"
					username={user?.clan_nick || user?.user?.display_name || user?.user?.username}
					srcImgProxy={createImgproxyUrl((user?.clan_avatar || user?.user?.avatar_url) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={user?.clan_avatar || user?.user?.avatar_url}
				/>
			</div>

			<NameComponent id={sender.sender_id ?? ''} name={user?.clan_nick || user?.user?.display_name || user?.user?.username} />
			<p className="text-xs absolute right-8 dark:text-textDarkTheme text-textLightTheme">{sender.count}</p>
			{sender.sender_id === userId.userId && sender.count && sender.count > 0 && (
				<div onClick={handleRemoveEmojiSender} className="right-1 absolute cursor-pointer">
					<Icons.Close defaultSize="w-3 h-3" />
				</div>
			)}
		</div>
	);
};
