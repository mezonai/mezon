import { GifStickerEmojiPopup } from '@mezon/components';
import { useApp } from '@mezon/core';
import { selectIsShowCreateThread, selectPositionEmojiButtonSmile, selectReactionTopState, selectStatusMenu } from '@mezon/store';
import { EmojiPlaces } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { useSelector } from 'react-redux';

const HEIGHT_EMOJI_PANEL = 457;
const WIDTH_EMOJI_PANEL = 500;

type ReactionEmojiPannelProps = {
	closeMenu: boolean;
	currentChannelId: string;
	isFocusTopicOrThreadBox?: boolean;
	openEmojiRightPanel?: boolean;
	openEmojiBottomPanel?: boolean;
	openEmojiPanelOnTopicOrThreadBox?: boolean;
	isShowCreateTopic?: boolean;
};

const ReactionEmojiPanel = memo(
	({
		closeMenu,
		currentChannelId,
		isFocusTopicOrThreadBox,
		openEmojiRightPanel,
		openEmojiBottomPanel,
		openEmojiPanelOnTopicOrThreadBox,
		isShowCreateTopic
	}: ReactionEmojiPannelProps) => {
		const reactionTopState = useSelector(selectReactionTopState);
		const statusMenu = useSelector(selectStatusMenu);
		const positionOfSmileButton = useSelector(selectPositionEmojiButtonSmile);
		const { isShowMemberList } = useApp();

		const openEmojiRightPanelOnChannelLayout = openEmojiRightPanel && !isFocusTopicOrThreadBox;
		const openEmojiBottomPanelOnChannelLayout = openEmojiBottomPanel && !isFocusTopicOrThreadBox;

		const distanceToBottom = window.innerHeight - positionOfSmileButton.bottom;
		const distanceToRight = window.innerWidth - positionOfSmileButton.right;
		const topPositionEmojiPanel = distanceToBottom < HEIGHT_EMOJI_PANEL ? 'auto' : `${positionOfSmileButton.top - 100}px`;

		const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannelId));

		return (
			<>
				{openEmojiRightPanelOnChannelLayout && (
					<div
						onMouseDown={(e) => e.stopPropagation()}
						id="emojiPicker"
						className={`z-20 fixed size-[500px] max-sm:hidden right-1 ${closeMenu && !statusMenu && 'w-[370px]'} ${reactionTopState ? 'top-20' : 'bottom-20'} ${(isShowCreateThread || isShowCreateTopic) && 'ssm:right-[650px]'} ${isShowMemberList && 'ssm:right-[420px]'} ${!isShowCreateThread && !isShowMemberList && !isShowCreateTopic && 'ssm:right-44'}`}
					>
						<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} />
					</div>
				)}
				{openEmojiBottomPanelOnChannelLayout && (
					<div
						className="fixed z-50 max-sm:hidden duration-300 ease-in-out animate-fly_in"
						onMouseDown={(e) => e.stopPropagation()}
						style={{
							top: topPositionEmojiPanel,
							bottom: distanceToBottom < HEIGHT_EMOJI_PANEL ? '0' : 'auto',
							left:
								distanceToRight < WIDTH_EMOJI_PANEL
									? `${positionOfSmileButton.left - WIDTH_EMOJI_PANEL}px`
									: `${positionOfSmileButton.right}px`
						}}
					>
						<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} />
					</div>
				)}
				{openEmojiPanelOnTopicOrThreadBox && (
					<div
						style={{ top: topPositionEmojiPanel }}
						onMouseDown={(e) => e.stopPropagation()}
						id="emojiPickerTopic"
						className="z-50 absolute size-[500px] max-sm:hidden -right-[505px]"
					>
						<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} />
					</div>
				)}
			</>
		);
	}
);

export default ReactionEmojiPanel;
