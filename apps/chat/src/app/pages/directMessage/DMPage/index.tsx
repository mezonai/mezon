import {
	DirectMessageBox,
	DmTopbar,
	FileUploadByDnD,
	GifStickerEmojiPopup,
	MemberListGroupChat,
	ModalUserProfile,
	SearchMessageChannelRender
} from '@mezon/components';
import {
	useApp,
	useAppNavigation,
	useAppParams,
	useAuth,
	useChatMessages,
	useDragAndDrop,
	useGifsStickersEmoji,
	useSearchMessages,
	useSeenMessagePool,
	useWindowFocusState
} from '@mezon/core';
import {
	MessagesEntity,
	directActions,
	directMetaActions,
	gifsStickerEmojiActions,
	selectAudioDialTone,
	selectCloseMenu,
	selectCurrentChannelId,
	selectDefaultChannelIdByClanId,
	selectDmGroupCurrent,
	selectIsSearchMessage,
	selectIsShowCreateThread,
	selectIsShowMemberListDM,
	selectIsUnreadDMById,
	selectIsUseProfileDM,
	selectPositionEmojiButtonSmile,
	selectReactionTopState,
	selectSignalingDataByUserId,
	selectStatusMenu,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EmojiPlaces, SubPanelName, TIME_OFFSET, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { DragEvent, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import ChannelMessages from '../../channel/ChannelMessages';
import { ChannelTyping } from '../../channel/ChannelTyping';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const { lastMessage } = useChatMessages({ channelId });
	const mounted = useRef('');

	const { isFocusDesktop, isTabVisible } = useWindowFocusState();

	const updateChannelSeenState = (channelId: string, lastMessage: MessagesEntity) => {
		dispatch(directActions.setActiveDirect({ directId: channelId }));
	};

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId]);
	const { userId } = useAuth();
	const isUnreadDM = useAppSelector((state) => selectIsUnreadDMById(state, channelId as string));
	const { markAsReadSeen } = useSeenMessagePool();
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	useEffect(() => {
		const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
		if (lastMessage) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId]);

	useEffect(() => {
		if ((lastMessage && isFocusDesktop === true && isElectron()) || (lastMessage && isTabVisible)) {
			const timestamp = Date.now() / 1000;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
			dispatch(directMetaActions.updateLastSeenTime(lastMessage));
			updateChannelSeenState(channelId, lastMessage);
		}
	}, [isFocusDesktop, isTabVisible]);

	useEffect(() => {
		if (mounted.current === channelId) {
			return;
		}
		if (lastMessage) {
			mounted.current = channelId;
			updateChannelSeenState(channelId, lastMessage);
		}
	}, [dispatch, channelId, lastMessage]);
}

function DirectSeenListener({ channelId }: { channelId: string }) {
	useChannelSeen(channelId);
	return null;
}

const DirectMessage = () => {
	// TODO: move selector to store
	const { clanId, directId, type } = useAppParams();
	const defaultChannelId = useSelector(selectDefaultChannelIdByClanId(clanId || ''));
	const { navigate } = useAppNavigation();
	const { draggingState, setDraggingState } = useDragAndDrop();
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, directId));
	const dispatch = useAppDispatch();
	const { userId } = useAuth();

	const messagesContainerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (defaultChannelId) {
			navigate(`./${defaultChannelId}`);
		}
	}, [defaultChannelId, navigate]);

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
		return currentDmGroup?.user_id?.some((i) => i === signalingData?.[0]?.callerId);
	}, [currentDmGroup?.user_id, signalingData]);

	const HEIGHT_EMOJI_PANEL = 457;
	const WIDTH_EMOJI_PANEL = 500;

	const distanceToBottom = window.innerHeight - positionOfSmileButton.bottom;
	const distanceToRight = window.innerWidth - positionOfSmileButton.right;
	let topPositionEmojiPanel: string;

	useEffect(() => {
		dispatch(
			directActions.joinDirectMessage({
				directMessageId: currentDmGroup?.channel_id ?? '',
				channelName: '',
				type: Number(type)
			})
		);
	}, [currentDmGroup?.channel_id]);

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
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const handleClose = useCallback(() => {}, []);

	return (
		<>
			{draggingState && <FileUploadByDnD currentId={currentDmGroup?.channel_id ?? ''} />}
			<div
				className={` flex flex-col
			 flex-1 shrink min-w-0 bg-transparent
				h-[100%] overflow-visible relative`}
				onDragEnter={handleDragEnter}
			>
				<DmTopbar dmGroupId={directId} isHaveCallInChannel={isHaveCallInChannel || isPlayDialTone} />
				<div className={`flex flex-row flex-1 w-full ${isHaveCallInChannel || isPlayDialTone ? 'h-heightCallDm' : ''}`}>
					<div
						className={`flex-col flex-1 h-full ${isWindowsDesktop || isLinuxDesktop ? 'max-h-titleBarMessageViewChatDM' : 'max-h-messageViewChatDM'} ${isUseProfileDM ? 'w-widthDmProfile' : 'w-full'} ${checkTypeDm ? 'sbm:flex hidden' : 'flex'}`}
					>
						<div
							className={`overflow-y-auto bg-[#1E1E1E]  ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatDM' : 'h-heightMessageViewChatDM'} flex-shrink " ref={messagesContainerRef}`}
						>
							{
								<ChannelMessages
									key={directId}
									clanId="0"
									channelId={directId ?? ''}
									channelLabel={currentDmGroup?.channel_label}
									userName={isDmChannel ? currentDmGroup?.usernames : undefined}
									type={isDmChannel ? ChannelType.CHANNEL_TYPE_DM : ChannelType.CHANNEL_TYPE_GROUP}
									mode={isDmChannel ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP}
									avatarDM={isDmChannel ? currentDmGroup?.channel_avatar?.at(0) : 'assets/images/avatar-group.png'}
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

						<div className="flex-shrink-0 flex flex-col z-0 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative">
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
							<DirectMessageBox
								direct={currentDmGroup}
								mode={
									currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
										? ChannelStreamMode.STREAM_MODE_DM
										: ChannelStreamMode.STREAM_MODE_GROUP
								}
							/>
						</div>
					</div>
					<div className="w-1 h-full dark:bg-bgPrimary bg-bgLightPrimary"></div>
					{Number(type) === ChannelType.CHANNEL_TYPE_GROUP && (
						<div
							className={`dark:bg-bgSecondary bg-bgLightSecondary overflow-y-scroll h-[calc(100vh_-_60px)] thread-scroll ${isShowMemberListDM ? 'flex' : 'hidden'} ${closeMenu ? 'w-full' : 'w-[241px]'}`}
						>
							<MemberListGroupChat directMessageId={directId} createId={currentDmGroup?.creator_id} />
						</div>
					)}
					{Number(type) === ChannelType.CHANNEL_TYPE_DM && isUseProfileDM && (
						<div
							className={`dark:bg-bgTertiary bg-bgLightSecondary ${isUseProfileDM ? 'flex' : 'hidden'} ${closeMenu ? 'w-full' : 'w-widthDmProfile'}`}
						>
							<ModalUserProfile
								onClose={handleClose}
								userID={Array.isArray(currentDmGroup?.user_id) ? currentDmGroup?.user_id[0] : currentDmGroup?.user_id}
								classWrapper="w-full"
								classBanner="h-[120px]"
								hiddenRole={true}
								showNote={true}
								showPopupLeft={true}
								avatar={currentDmGroup?.channel_avatar?.[0]}
								isDM={true}
							/>
						</div>
					)}
					{isSearchMessage && <SearchMessageChannel />}
				</div>
			</div>
			<DirectSeenListener channelId={directId as string} />
		</>
	);
};

const SearchMessageChannel = () => {
	const { totalResult, currentPage, messageSearchByChannelId } = useSearchMessages();
	const currentChannelId = useSelector(selectCurrentChannelId);
	return (
		<SearchMessageChannelRender
			searchMessages={messageSearchByChannelId}
			currentPage={currentPage}
			totalResult={totalResult}
			channelId={currentChannelId || ''}
		/>
	);
};

export default memo(DirectMessage);
