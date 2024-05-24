import { GifStickerEmojiPopup } from '@mezon/components';
import { useApp, useChatReaction, useGifsStickersEmoji, useMenu, useReference, useThreads } from '@mezon/core';
import { selectCurrentChannel, selectReactionRightState, selectReactionTopState } from '@mezon/store';
import { EmojiPlaces, SubPanelName } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';

const ChannelLayout = () => {
	const reactionRightState = useSelector(selectReactionRightState);
	const currentChannel = useSelector(selectCurrentChannel);
	const reactionTopState = useSelector(selectReactionTopState);
	const { idMessageRefReaction } = useReference();
	const { reactionBottomState } = useChatReaction();

	const { subPanelActive, setSubPanelActive } = useGifsStickersEmoji();

	const { closeMenu, statusMenu } = useMenu();
	const { isShowCreateThread } = useThreads();
	const { isShowMemberList } = useApp();
	const { messageMatchWithRefStatus, positionOfSmileButton } = useChatReaction();

	const HEIGHT_EMOJI_PANEL: number = 457;
	const WIDTH_EMOJI_PANEL: number = 500;

	const distanceToBottom = window.innerHeight - positionOfSmileButton.bottom;
	const distanceToRight = window.innerWidth - positionOfSmileButton.right;
	let topPosition: string;

	if (distanceToBottom < HEIGHT_EMOJI_PANEL) {
		topPosition = 'auto';
	} else if (positionOfSmileButton.top < 100) {
		topPosition = `${positionOfSmileButton.top}px`;
	} else {
		topPosition = `${positionOfSmileButton.top - 100}px`;
	}

	return (
		<div
			className={`flex flex-col flex-1 shrink min-w-0 dark:bg-bgSecondary bg-bgLightModeSecond h-[100%] overflow-visible ${currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE ? 'group' : ''}`}
		>
			<div className="flex h-heightWithoutTopBar flex-row">
				<Outlet />
			</div>
			{subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && (
				<div
					id="emojiPicker"
					className={`fixed size-[500px] right-1 ${closeMenu && !statusMenu && 'w-[370px]'} ${reactionTopState ? 'top-20' : 'bottom-20'} ${isShowCreateThread && 'ssm:right-[650px]'} ${isShowMemberList && 'ssm:right-[420px]'} ${!isShowCreateThread && !isShowMemberList && 'ssm:right-44'}`}
				>
					<div className="mb-0 z-10 h-full">
						<GifStickerEmojiPopup
							messageEmojiId={idMessageRefReaction}
							mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							emojiAction={EmojiPlaces.EMOJI_REACTION}
						/>
					</div>
				</div>
			)}
			{subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && (
				<div
					className="fixed"
					style={{
						top: topPosition,
						bottom: distanceToBottom < HEIGHT_EMOJI_PANEL ? '0' : 'auto',
						left:
							distanceToRight < WIDTH_EMOJI_PANEL
								? `${positionOfSmileButton.left - WIDTH_EMOJI_PANEL}px`
								: `${positionOfSmileButton.right}px`,
					}}
				>
					<div className="mb-0 z-10 h-full">
						<GifStickerEmojiPopup
							messageEmojiId={idMessageRefReaction}
							mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							emojiAction={EmojiPlaces.EMOJI_REACTION}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChannelLayout;
