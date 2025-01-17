import { GifStickerEmojiPopup } from '@mezon/components';
import { useApp, useGifsStickersEmoji } from '@mezon/core';
import {
	selectCloseMenu,
	selectCurrentChannel,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectPositionEmojiButtonSmile,
	selectReactionTopState,
	selectStatusMenu
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EmojiPlaces, SubPanelName, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';

const ChannelLayout = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const isChannelVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE;
	const isChannelStream = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	const reactionTopState = useSelector(selectReactionTopState);
	const { subPanelActive } = useGifsStickersEmoji();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
	const { isShowMemberList } = useApp();
	const positionOfSmileButton = useSelector(selectPositionEmojiButtonSmile);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const HEIGHT_EMOJI_PANEL = 457;
	const WIDTH_EMOJI_PANEL = 500;
	const distanceToBottom = window.innerHeight - positionOfSmileButton.bottom;
	const distanceToRight = window.innerWidth - positionOfSmileButton.right;
	let topPositionEmojiPanel: string;

	if (distanceToBottom < HEIGHT_EMOJI_PANEL) {
		topPositionEmojiPanel = 'auto';
	} else if (positionOfSmileButton.top < 100) {
		topPositionEmojiPanel = `${positionOfSmileButton.top}px`;
	} else {
		topPositionEmojiPanel = `${positionOfSmileButton.top - 100}px`;
	}

	return (
		<div className="z-0 flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-visible">
			{isChannelVoice ? (
				<ChannelLayoutVoice channelLabel={currentChannel.channel_label} meetingCode={currentChannel.meeting_code} />
			) : (
				<>
					<div
						className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`} ${isChannelStream ? 'justify-center items-center mx-4' : ''}`}
					>
						<Outlet />
					</div>
					{subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && (
						<div
							id="emojiPicker"
							className={`z-20 fixed size-[500px] max-sm:hidden right-1 ${closeMenu && !statusMenu && 'w-[370px]'} ${reactionTopState ? 'top-20' : 'bottom-20'} ${(isShowCreateThread || isShowCreateTopic) && 'ssm:right-[650px]'} ${isShowMemberList && 'ssm:right-[420px]'} ${!isShowCreateThread && !isShowMemberList && !isShowCreateTopic && 'ssm:right-44'}`}
						>
							<div className="mb-0 z-10 h-full">
								<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} />
							</div>
						</div>
					)}
					{subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && (
						<div
							className={`fixed z-50 max-sm:hidden duration-300 ease-in-out animate-fly_in min-[960px]:!left-24 `}
							style={{
								top: topPositionEmojiPanel,
								bottom: distanceToBottom < HEIGHT_EMOJI_PANEL ? '0' : 'auto',
								left:
									distanceToRight < WIDTH_EMOJI_PANEL
										? `${positionOfSmileButton.left - WIDTH_EMOJI_PANEL}px`
										: `${positionOfSmileButton.right}px`
							}}
						>
							<div className="mb-0 z-10 h-full">
								<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} />
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ChannelLayout;

const ChannelLayoutVoice = ({ channelLabel = '', meetingCode = '' }: { channelLabel?: string; meetingCode?: string }) => {
	const [statusCall, setStatusCall] = useState(true);
	const handleStatusCall = () => {
		setStatusCall(!statusCall);
		if (!statusCall) {
			const urlVoice = `https://meet.google.com/${meetingCode}`;
			window.open(urlVoice, '_blank', 'noreferrer');
		}
	};
	return (
		<div className="bg-black h-full flex flex-col font-semibold">
			{statusCall ? (
				<>
					<p className="flex-1 flex justify-center items-center">You've popped out the player to another tab.</p>
					<div className="relative justify-center items-center gap-x-5 w-full bottom-5 flex h-[50px]">
						<button className="size-[50px] rounded-full bg-red-500 hover:bg-red-950" onClick={handleStatusCall}>
							<Icons.PhoneOff defaultSize="rotate-[138deg] m-auto" />
						</button>
					</div>
				</>
			) : (
				<div className="h-full flex flex-col justify-center items-center gap-y-4">
					<h3 className="uppercase font-bold text-4xl">{channelLabel}</h3>
					<button className="size-[50px] rounded-full bg-colorSuccess w-fit text-nowrap p-3 text-base" onClick={handleStatusCall}>
						Join Call
					</button>
				</div>
			)}
		</div>
	);
};
