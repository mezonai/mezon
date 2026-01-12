import { useAuth, useChatReaction, useUserById } from '@mezon/core';
import { getStore, selectClickedOnTopicStatus, selectCurrentChannel } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import type { EmojiDataOptionals, IMessageWithUser, SenderInfoOptionals } from '@mezon/utils';
import { calculateTotalCount, createImgproxyUrl, getSrcEmoji, isPublicChannel } from '@mezon/utils';
import type { ForwardedRef } from 'react';
import { Fragment, forwardRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type UserReactionPanelProps = {
	emojiShowPanel: EmojiDataOptionals;
	message: IMessageWithUser;
	isTopic: boolean;
};

const UserReactionPanel = forwardRef(({ emojiShowPanel, message, isTopic }: UserReactionPanelProps, ref: ForwardedRef<HTMLDivElement>) => {
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();

	const removeEmojiSender = async (id: string, emojiId: string, emoji: string, messageSenderId: string, countRemoved: number) => {
		const store = getStore();
		const currentChannel = selectCurrentChannel(store.getState());

		await reactionMessageDispatch({
			id,
			messageId: message?.id,
			emojiId: emojiShowPanel?.emojiId ?? '',
			emoji: emojiShowPanel?.emoji ?? '',
			count: countRemoved,
			messageSenderId,
			action_delete: true,
			isPublic: isPublicChannel(currentChannel),
			clanId: currentChannel?.clanId ?? '',
			channelId: isTopic ? currentChannel?.id || '' : (message?.channelId ?? ''),
			isFocusTopicBox,
			channelIdOnMessage: message?.channelId
		});
	};

	const hideSenderOnPanel = useCallback((emojiData: EmojiDataOptionals, senderId: string) => {
		const newEmojiData = { ...emojiData };
		if (newEmojiData.senders) {
			newEmojiData.senders = newEmojiData.senders.filter((sender) => sender.sender_id !== senderId);
		}
		return newEmojiData;
	}, []);

	const count = calculateTotalCount(emojiShowPanel?.senders ?? []);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{count > 0 && (
				<div className=" flex flex-col justify-center  ">
					<div
						onClick={(e) => e.stopPropagation()}
						className={`z-50 w-[18rem] bg-theme-pop border-color-primary rounded-lg min-h-5 max-h-[25rem] ${window.innerWidth < 640 ? 'flex flex-col justify-center' : 'p-1 bottom-0'}`}
					>
						<PanelHeader emojiId={emojiShowPanel?.emojiId} emojiName={emojiShowPanel?.emoji ?? ''} count={count} />
						<div ref={ref} tabIndex={-1} className="max-h-40 overflow-y-auto hide-scrollbar focus-visible:outline-none">
							{emojiShowPanel?.senders.map((sender: SenderInfoOptionals, index: number) => {
								if (sender.count && sender.count > 0) {
									return (
										<Fragment key={`${index}_${sender.sender_id}`}>
											<SenderItem
												sender={sender}
												emojiShowPanel={emojiShowPanel}
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
			<div className="flex flex-row items-center p-2 text-theme-primary border-b-theme-primary">
				<img src={getSrcEmoji(emojiId ?? '')} className="w-5 h-5 min-h-5 min-w-5" alt="" />
				<p className="text-sm ml-2">{count}</p>
				<p title={emojiName} className="text-sm ml-2 truncate max-w-[200px] overflow-hidden">
					{emojiName}
				</p>
			</div>
		</div>
	);
};

type SenderItemProps = {
	sender: any;
	emojiShowPanel: any;
	userId: any;
	removeEmojiSender: (id: string, emojiId: string, emoji: string, messageSenderId: string, countRemoved: number) => Promise<void>;
	hideSenderOnPanel: (emojiData: any, senderId: string) => void;
};

const SenderItem: React.FC<SenderItemProps> = ({ sender, emojiShowPanel, userId, removeEmojiSender, hideSenderOnPanel }) => {
	const handleRemoveEmojiSender = async (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		await removeEmojiSender(
			emojiShowPanel?.id ?? '',
			emojiShowPanel?.emojiId ?? '',
			emojiShowPanel?.emoji ?? '',
			sender?.sender_id ?? '',
			sender?.count ?? 0
		);

		hideSenderOnPanel(emojiShowPanel, sender.sender_id ?? '');
	};

	const user = useUserById(sender.sender_id);

	return (
		<div className="m-2 flex flex-row justify-start mb-2 items-center gap-2 relative  ">
			<div className="w-8 h-8">
				<AvatarImage
					className="w-8 h-8"
					alt="user avatar"
					username={user?.clanNick || user?.user?.displayName || user?.user?.username}
					srcImgProxy={createImgproxyUrl((user?.clanAvatar || user?.user?.avatarUrl) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={user?.clanAvatar || user?.user?.avatarUrl}
				/>
			</div>

			<NameComponent id={sender.sender_id ?? ''} name={user?.clanNick || user?.user?.displayName || user?.user?.username} />
			<p className="text-xs absolute right-8 text-theme-primary-hover text-theme-primary ">{sender.count}</p>
			{sender.sender_id === userId.userId && sender.count && sender.count > 0 && (
				<div onClick={handleRemoveEmojiSender} className="right-1 absolute cursor-pointer text-theme-primary hover:text-red-500">
					<Icons.Close defaultSize="w-3 h-3" />
				</div>
			)}
		</div>
	);
};
