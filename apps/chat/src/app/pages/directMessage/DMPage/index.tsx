import {
	DirectMessageBox,
	DirectMessageContextMenuProvider,
	DMCT_GROUP_CHAT_ID,
	FileUploadByDnD,
	GifStickerEmojiPopup,
	MemberListGroupChat,
	ModalInputMessageBuzz,
	ModalUserProfile,
	SearchMessageChannelRender
} from '@mezon/components';
import { EmojiSuggestionProvider, useApp, useAuth, useDragAndDrop, useGifsStickersEmoji, useSearchMessages, useSeenMessagePool } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import {
	directActions,
	directMetaActions,
	e2eeActions,
	gifsStickerEmojiActions,
	selectAudioDialTone,
	selectBlockedUsersForMessage,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentDM,
	selectDirectById,
	selectDmGroupCurrent,
	selectHasKeyE2ee,
	selectIsSearchMessage,
	selectIsShowCreateThread,
	selectIsShowMemberListDM,
	selectIsUseProfileDM,
	selectLastMessageViewportByChannelId,
	selectLastSeenDM,
	selectPositionEmojiButtonSmile,
	selectReactionTopState,
	selectSearchMessagesLoadingStatus,
	selectSignalingDataByUserId,
	selectStatusMenu,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EmojiPlaces, isBackgroundModeActive, isLinuxDesktop, isWindowsDesktop, SubPanelName, useBackgroundMode } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { DragEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ChannelMessages from '../../channel/ChannelMessages';
import { ChannelTyping } from '../../channel/ChannelTyping';

const ChannelSeen = memo(({ channelId }: { channelId: string }) => {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	const lastMessage = useAppSelector((state) => selectLastMessageViewportByChannelId(state, channelId));
	const lastSeenTimeStamp = useAppSelector((state) => selectLastSeenDM(state, channelId));
	const { markAsReadSeen } = useSeenMessagePool();

	const isMounted = useRef(false);
	const isWindowFocused = !isBackgroundModeActive();

	const markMessageAsRead = useCallback(() => {
		if (!lastMessage) return;

		if (lastMessage?.create_time_seconds && lastSeenTimeStamp && lastMessage?.create_time_seconds >= lastSeenTimeStamp) {
			const mode =
				currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;

			markAsReadSeen(lastMessage, mode, 0);
		}
	}, [lastMessage, markAsReadSeen, currentDmGroup, lastSeenTimeStamp]);

	const updateChannelSeenState = useCallback(
		(channelId: string) => {
			dispatch(directActions.setActiveDirect({ directId: channelId }));
		},
		[dispatch]
	);

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [dispatch, channelId]);

	useEffect(() => {
		if (lastMessage && isWindowFocused) {
			dispatch(directMetaActions.updateLastSeenTime(lastMessage));
			markMessageAsRead();
		}
	}, [lastMessage, isWindowFocused, markMessageAsRead, dispatch, channelId]);

	useEffect(() => {
		if (isMounted.current || !lastMessage) return;
		isMounted.current = true;
		updateChannelSeenState(channelId);
	}, [channelId, lastMessage, updateChannelSeenState]);

	useBackgroundMode(undefined, markMessageAsRead, isWindowFocused);

	return null;
});

function DirectSeenListener({ channelId, mode, currentChannel }: { channelId: string; mode: number; currentChannel: DirectEntity }) {
	return (
		<>
			<ChannelSeen channelId={channelId} />
			<KeyPressListener currentChannel={currentChannel} mode={mode} />
		</>
	);
}

const DirectMessage = () => {
	// TODO: move selector to store
	const currentDirect = useSelector(selectCurrentDM);
	const directId = currentDirect?.id;
	const type = currentDirect?.type;
	const { draggingState, setDraggingState } = useDragAndDrop();
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, directId));
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const directMessage = useAppSelector((state) => selectDirectById(state, directId));
	const hasKeyE2ee = useSelector(selectHasKeyE2ee);

	const messagesContainerRef = useRef<HTMLDivElement>(null);

	// check
	const currentDmGroup = useSelector(selectDmGroupCurrent(directId ?? ''));
	const reactionTopState = useSelector(selectReactionTopState);
	const { subPanelActive } = useGifsStickersEmoji();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannelId as string));
	const { isShowMemberList, setIsShowMemberList } = useApp();
	const positionOfSmileButton = useSelector(selectPositionEmojiButtonSmile);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const isHaveCallInChannel = useMemo(() => {
		return currentDmGroup?.user_ids?.some((i) => i === signalingData?.[0]?.callerId);
	}, [currentDmGroup?.user_ids, signalingData]);
	const blockListUser = useAppSelector((state) => selectBlockedUsersForMessage(state));

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
	const handleDragEnter = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer?.types.includes('Files')) {
			setDraggingState(true);
		}
	};
	const checkTypeDm = useMemo(
		() => (Number(type) === ChannelType.CHANNEL_TYPE_GROUP ? isShowMemberListDM : isUseProfileDM),
		[isShowMemberListDM, isUseProfileDM, type]
	);
	useEffect(() => {
		if (isShowCreateThread) {
			setIsShowMemberList(false);
		}
	}, [isShowCreateThread]);

	const setMarginleft = messagesContainerRef?.current?.getBoundingClientRect()
		? window.innerWidth - messagesContainerRef?.current?.getBoundingClientRect().right + 155
		: 0;

	const isDmChannel = useMemo(() => currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM, [currentDmGroup?.type]);
	const isBlocked = useMemo(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM) {
			return blockListUser?.some((user) => user?.user && user.user.id === (currentDmGroup?.user_ids?.[0] || ''));
		}
		return false;
	}, [currentDmGroup?.type, currentDmGroup?.user_ids]);

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const handleClose = useCallback(() => {}, []);

	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;

	useEffect(() => {
		if (directMessage && directMessage?.e2ee && !hasKeyE2ee) {
			dispatch(e2eeActions.setOpenModalE2ee(true));
		}
	}, [directMessage, dispatch, hasKeyE2ee]);

	return (
		<>
			{draggingState && <FileUploadByDnD currentId={currentDmGroup?.channel_id ?? ''} />}
			<div
				className={` flex flex-col flex-1 shrink min-w-0 bg-transparent h-heightWithoutTopBar overflow-visible relative mt-[50px] bg-theme-chat text-theme-text`}
				onDragEnter={handleDragEnter}
			>
				<div
					className={`cotain-strict flex flex-row flex-1 w-full ${isHaveCallInChannel || isPlayDialTone ? 'h-heightCallDm' : 'h-heightWithoutTopBar'}`}
				>
					<div
						className={`flex-col flex-1 h-full ${isWindowsDesktop || isLinuxDesktop ? 'max-h-titleBarMessageViewChatDM' : 'max-h-messageViewChatDM'} ${isUseProfileDM || isShowMemberListDM ? 'w-widthDmProfile' : isSearchMessage ? 'w-widthSearchMessage' : 'w-full'} ${checkTypeDm ? 'sbm:flex hidden' : 'flex'}`}
					>
						<div
							className={`relative overflow-y-auto  ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatDM' : 'h-heightMessageViewChatDM'} flex-shrink`}
							ref={messagesContainerRef}
						>
							{
								<ChannelMessages
									clanId="0"
									isDM={true}
									channelId={directId ?? ''}
									isPrivate={currentDmGroup?.channel_private}
									channelLabel={currentDmGroup?.channel_label}
									username={isDmChannel ? currentDmGroup?.usernames?.toString() : undefined}
									type={isDmChannel ? ChannelType.CHANNEL_TYPE_DM : ChannelType.CHANNEL_TYPE_GROUP}
									mode={isDmChannel ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP}
									avatarDM={isDmChannel ? currentDmGroup?.avatars?.at(0) : 'assets/images/avatar-group.png'}
								/>
							}
						</div>

						{subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && (
							<div
								id="emojiPicker"
								className={`z-20 fixed size-[500px] max-sm:hidden right-1 ${closeMenu && !statusMenu && 'w-[370px]'} ${reactionTopState ? 'top-20' : 'bottom-20'} ${isShowCreateThread && 'ssm:right-[650px]'} ${isShowMemberList && 'ssm:right-[420px]'} ${!isShowCreateThread && !isShowMemberList && 'ssm:right-44'}`}
								style={{
									right: setMarginleft
								}}
							>
								<div className="mb-0 z-10 h-full">
									<GifStickerEmojiPopup
										mode={
											currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
												? ChannelStreamMode.STREAM_MODE_DM
												: ChannelStreamMode.STREAM_MODE_GROUP
										}
										emojiAction={EmojiPlaces.EMOJI_REACTION}
									/>
								</div>
							</div>
						)}
						{subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && (
							<div
								className={`fixed z-50 max-sm:hidden duration-300 ease-in-out animate-fly_in`}
								style={{
									top: topPositionEmojiPanel,
									bottom: distanceToBottom < HEIGHT_EMOJI_PANEL ? '0' : 'auto',
									left:
										distanceToRight < WIDTH_EMOJI_PANEL
											? `${positionOfSmileButton.left - WIDTH_EMOJI_PANEL}px`
											: `${positionOfSmileButton.right}px`
								}}
							>
								<div className="mb-0 z-50 h-full ">
									<GifStickerEmojiPopup
										mode={
											currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
												? ChannelStreamMode.STREAM_MODE_DM
												: ChannelStreamMode.STREAM_MODE_GROUP
										}
										emojiAction={EmojiPlaces.EMOJI_REACTION}
									/>
								</div>
							</div>
						)}

						<div className="flex-shrink-0 flex flex-col bg-theme-chat  h-auto relative">
							{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (currentDmGroup.user_ids?.length === 0 || isBlocked) ? (
								<div
									style={{ height: 44 }}
									className="opacity-80 bg-theme-input  ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission text-theme-primary rounded one-line"
								>
									You do not have permission to send message
								</div>
							) : (
								<>
									<DirectMessageBox
										direct={currentDmGroup}
										mode={
											currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
												? ChannelStreamMode.STREAM_MODE_DM
												: ChannelStreamMode.STREAM_MODE_GROUP
										}
									/>
									{directId && (
										<ChannelTyping
											channelId={directId}
											mode={
												currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
													? ChannelStreamMode.STREAM_MODE_DM
													: ChannelStreamMode.STREAM_MODE_GROUP
											}
											isPublic={false}
											isDM={true}
										/>
									)}
								</>
							)}
						</div>
					</div>
					{Number(type) === ChannelType.CHANNEL_TYPE_GROUP && isShowMemberListDM && (
						<DirectMessageContextMenuProvider
							contextMenuId={DMCT_GROUP_CHAT_ID}
							dataMemberCreate={{ createId: currentDmGroup?.creator_id || '' }}
						>
							<div
								className={`contain-strict text-theme-primary bg-active-friend-list overflow-y-scroll h-[calc(100vh_-_50px)] thread-scroll ${isShowMemberListDM ? 'flex' : 'hidden'} ${closeMenu ? 'w-full' : 'w-[241px]'}`}
							>
								<MemberListGroupChat directMessageId={directId} createId={currentDmGroup?.creator_id} />
							</div>
						</DirectMessageContextMenuProvider>
					)}

					{Number(type) === ChannelType.CHANNEL_TYPE_DM && isUseProfileDM && (
						<div className={`bg-active-friend-list ${isUseProfileDM ? 'flex' : 'hidden'} ${closeMenu ? 'w-full' : 'w-widthDmProfile'}`}>
							<ModalUserProfile
								onClose={handleClose}
								userID={Array.isArray(currentDmGroup?.user_ids) ? currentDmGroup?.user_ids[0] : currentDmGroup?.user_ids}
								classWrapper="w-full"
								classBanner="h-[120px]"
								hiddenRole={true}
								showNote={true}
								showPopupLeft={true}
								avatar={
									Number(type) === ChannelType.CHANNEL_TYPE_GROUP
										? currentDmGroup?.channel_avatar?.[0]
										: currentDmGroup?.avatars?.[0]
								}
								isDM={true}
							/>
						</div>
					)}
					{isSearchMessage && <SearchMessageChannel channelId={directId} />}
				</div>
			</div>
			<DirectSeenListener channelId={directId as string} mode={mode} currentChannel={currentDmGroup} />
		</>
	);
};

const SearchMessageChannel = ({ channelId }: { channelId: string }) => {
	const { totalResult, currentPage, messageSearchByChannelId } = useSearchMessages();
	const isLoading = useAppSelector(selectSearchMessagesLoadingStatus) === 'loading';

	return (
		<SearchMessageChannelRender
			searchMessages={messageSearchByChannelId}
			currentPage={currentPage}
			totalResult={totalResult}
			channelId={channelId || ''}
			isDm
			isLoading={isLoading}
		/>
	);
};

type KeyPressListenerProps = {
	currentChannel: DirectEntity | null;
	mode: ChannelStreamMode;
};

const KeyPressListener = ({ currentChannel, mode }: KeyPressListenerProps) => {
	const isListenerAttached = useRef(false);

	useEffect(() => {
		if (isListenerAttached.current) return;
		isListenerAttached.current = true;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
				event.preventDefault();
				openModalBuzz();
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
			isListenerAttached.current = false;
		};
	}, []);

	const [openModalBuzz, closeModalBuzz] = useModal(
		() => (
			<EmojiSuggestionProvider>
				<ModalInputMessageBuzz currentChannel={currentChannel} mode={mode} closeBuzzModal={closeModalBuzz} />
			</EmojiSuggestionProvider>
		),
		[currentChannel]
	);

	return null;
};
export default memo(DirectMessage);
