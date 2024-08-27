import { FileUploadByDnD, MemberList, SearchMessageChannelRender } from '@mezon/components';
import { useCheckAlonePermission, useClanRestriction, useDragAndDrop, useSearchMessages, useThreads } from '@mezon/core';
import {
	channelsActions,
	notificationActions,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectIsMessageRead,
	selectIsSearchMessage,
	selectIsShowMemberList,
	selectIsViewingOlderMessagesByChannelId,
	selectStatusMenu,
	useAppDispatch
} from '@mezon/store';
import { EPermission, TIME_OFFSET } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { DragEvent, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ChannelJumpToPresent } from './ChannelJumpToPresent';
import { ChannelMedia } from './ChannelMedia';
import { ChannelMessageBox } from './ChannelMessageBox';
import { ChannelTyping } from './ChannelTyping';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const isMessageRead = useSelector(selectIsMessageRead);
	const currentChannel = useSelector(selectChannelById(channelId));
	useEffect(() => {
		const timestamp = Date.now() / 1000;
		dispatch(channelsActions.setChannelLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
		dispatch(
			notificationActions.setLastSeenTimeStampChannel({
				channelId,
				lastSeenTimeStamp: timestamp + TIME_OFFSET,
				clanId: currentChannel?.clan_id ?? ''
			})
		);
		if (isMessageRead && channelId === currentChannel?.channel_id) {
			dispatch(notificationActions.setIsMessageRead(false));
		}
	}, [channelId, currentChannel, dispatch, isMessageRead]);
}

const ChannelMainContentText = ({ channelId }: ChannelMainContentProps) => {
	const currentChannel = useSelector(selectChannelById(channelId));
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isViewingOldMessage = useSelector(selectIsViewingOlderMessagesByChannelId(channelId));
	const [hasViewChannelPermission] = useClanRestriction([EPermission.viewChannel]);
	const isAlone = useCheckAlonePermission();

	if (hasViewChannelPermission && isAlone) {
		return (
			<div className="opacity-80 dark:bg-[#34363C] bg-[#F5F6F7] ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission dark:text-[#4E504F] text-[#D5C8C6] rounded one-line">
				You do not have permission to send messages in this channel.
			</div>
		);
	}

	return (
		<div className={`flex-shrink flex flex-col dark:bg-bgPrimary bg-bgLightPrimary h-auto relative ${isShowMemberList ? 'w-full' : 'w-full'}`}>
			{currentChannel && <ChannelTyping channelId={currentChannel?.id} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />}
			{isViewingOldMessage && <ChannelJumpToPresent channelId={currentChannel?.id} mode={0} />}
			{currentChannel ? (
				<ChannelMessageBox clanId={currentChannel?.clan_id} channelId={currentChannel?.id} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
			) : (
				<ChannelMessageBox.Skeleton />
			)}
		</div>
	);
};

type ChannelMainContentProps = {
	channelId: string;
};

const ChannelMainContent = ({ channelId }: ChannelMainContentProps) => {
	const currentChannel = useSelector(selectChannelById(channelId));
	const { draggingState, setDraggingState } = useDragAndDrop();
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const isSearchMessage = useSelector(selectIsSearchMessage(channelId));
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const { isShowCreateThread, setIsShowCreateThread } = useThreads();

	useChannelSeen(currentChannel?.id || '');

	const handleDragEnter = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer?.types.includes('Files')) {
			setDraggingState(true);
		}
	};

	useEffect(() => {
		if (isShowMemberList) {
			setIsShowCreateThread(false);
		}
	}, [isShowMemberList, setIsShowCreateThread]);

	return (
		<>
			{draggingState && <FileUploadByDnD currentId={currentChannel?.channel_id ?? ''} />}
			<div
				className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-hidden z-0"
				id="mainChat"
				onDragEnter={handleDragEnter}
			>
				<div className={`flex flex-row ${closeMenu ? 'h-heightWithoutTopBarMobile' : 'h-heightWithoutTopBar'}`}>
					<div
						className={`flex flex-col flex-1 min-w-60 ${isShowMemberList ? 'w-widthMessageViewChat' : isShowCreateThread ? 'w-widthMessageViewChatThread' : isSearchMessage ? 'w-widthSearchMessage' : 'w-widthThumnailAttachment'} h-full ${closeMenu && !statusMenu && isShowMemberList && 'hidden'} z-10`}
					>
						<div
							className={`overflow-y-auto dark:bg-bgPrimary max-w-widthMessageViewChat overflow-x-hidden max-h-heightMessageViewChat ${closeMenu ? 'h-heightMessageViewChatMobile' : 'h-heightMessageViewChat'}`}
							ref={messagesContainerRef}
						>
							<ChannelMedia currentChannel={currentChannel} key={currentChannel?.channel_id} />
						</div>
						<ChannelMainContentText channelId={currentChannel?.id as string} />
					</div>
					{isShowMemberList && (
						<div
							onContextMenu={(event) => event.preventDefault()}
							className={` dark:bg-bgSecondary bg-bgLightSecondary text-[#84ADFF] relative overflow-y-scroll hide-scrollbar ${currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE ? 'hidden' : 'flex'} ${closeMenu && !statusMenu && isShowMemberList ? 'w-full' : 'w-widthMemberList'}`}
							id="memberList"
						>
							<div className="w-1 h-full dark:bg-bgPrimary bg-bgLightPrimary"></div>
							<MemberList />
						</div>
					)}
					{isSearchMessage && <SearchMessageChannel />}
				</div>
			</div>
		</>
	);
};

export default function ChannelMain() {
	const currentChannel = useSelector(selectCurrentChannel);

	if (!currentChannel) {
		return null;
	}

	return <ChannelMainContent channelId={currentChannel.id} />;
}

const SearchMessageChannel = () => {
	const { totalResult, currentPage, messageSearchByChannelId } = useSearchMessages();
	return <SearchMessageChannelRender searchMessages={messageSearchByChannelId} currentPage={currentPage} totalResult={totalResult} />;
};
