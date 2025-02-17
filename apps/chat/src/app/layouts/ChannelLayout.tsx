import { useIdleRender } from '@mezon/core';
import { selectCloseMenu, selectCurrentChannel, topicsActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ReactionEmojiPanel from './ReactionEmojiPanel';

const ChannelLayout = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const isChannelVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE;
	const isChannelStream = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	const closeMenu = useSelector(selectCloseMenu);

	const dispatch = useDispatch();

	const onMouseDown = () => {
		dispatch(topicsActions.setFocusTopicBox(false));
	};
	const shouldRender = useIdleRender();

	return (
		<div onMouseDown={onMouseDown} className="flex flex-col z-0 flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-visible  relative">
			{isChannelVoice ? (
				<ChannelLayoutVoice channelLabel={currentChannel.channel_label} meetingCode={currentChannel.meeting_code} />
			) : (
				<>
					<div
						className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`} ${isChannelStream ? 'justify-center items-center mx-4' : ''}`}
					>
						<Outlet />
					</div>
					{shouldRender && (
						<ReactionEmojiPanel showInTopicDisscusion={false} closeMenu={closeMenu} currentChannelId={currentChannel?.channel_id ?? ''} />
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
