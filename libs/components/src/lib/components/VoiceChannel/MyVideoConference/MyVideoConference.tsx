import {
	ConnectionStateToast,
	isTrackReference,
	LayoutContextProvider,
	RoomAudioRenderer,
	TrackReferenceOrPlaceholder,
	useCreateLayoutContext,
	usePinnedTracks,
	useRoomContext,
	useTracks
} from '@livekit/components-react';
import { EmojiSuggestionProvider } from '@mezon/core';
import { selectCurrentClan, selectSession, topicsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { LocalParticipant, RemoteParticipant, RoomEvent, Track } from 'livekit-client';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RedDot } from '../../ChannelTopbar';
import GifStickerEmojiPopup from '../../GifsStickersEmojis/GifsStickersEmojis';
import FileSelectionButton from '../../MessageBox/FileSelectionButton';
import NotificationList from '../../NotificationList';
import { RenderAttachmentThumbnail } from '../../ThumbnailAttachmentRender/ThumbnailAttachmentRender';
import { ControlBar } from '../ControlBar/ControlBar';
import { CarouselLayout } from './FocusLayout/CarouselLayout/CarouselLayout';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

interface MyVideoConferenceProps {
	channelLabel?: string;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	isExternalCalling?: boolean;
	tracks?: TrackReferenceOrPlaceholder[];
}

export function MyVideoConference({
	channelLabel,
	onLeaveRoom,
	onFullScreen,
	isExternalCalling = false,
	tracks: propTracks
}: MyVideoConferenceProps) {
	const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);
	const [isFocused, setIsFocused] = useState<boolean>(false);

	const tracksFromHook = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false }
		],
		{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
	);

	const tracks = propTracks || tracksFromHook;

	const layoutContext = useCreateLayoutContext();

	const screenShareTracks = useMemo(() => {
		return tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare);
	}, [tracks]);

	const focusTrack = usePinnedTracks(layoutContext)?.[0];

	useEffect(() => {
		// If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
		if (screenShareTracks.some((track) => track.publication.isSubscribed) && lastAutoFocusedScreenShareTrack.current === null) {
			layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
			lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
		} else if (
			lastAutoFocusedScreenShareTrack.current &&
			!screenShareTracks.some((track) => track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid)
		) {
			layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
			lastAutoFocusedScreenShareTrack.current = null;
		}

		if (focusTrack && !isTrackReference(focusTrack)) {
			const updatedFocusTrack = tracks.find(
				(tr) => tr.participant.identity === focusTrack.participant.identity && tr.source === focusTrack.source
			);
			if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
				layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
			}
		}
	}, [screenShareTracks, focusTrack?.publication?.trackSid, tracks, layoutContext?.pin]);

	const [isShowMember, setIsShowMember] = useState<boolean>(true);

	const handleShowMember = useCallback(() => {
		setIsShowMember((prevState) => !prevState);
	}, []);

	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
		setIsShowInbox(false);
	};

	const dispatch = useAppDispatch();
	const [isShowInbox, setIsShowInbox] = useState<boolean>(false);
	const currentClan = useSelector(selectCurrentClan);
	const inboxRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (isShowInbox) {
			dispatch(topicsActions.fetchTopics({ clanId: currentClan?.clan_id as string }));
		}
	}, [isShowInbox]);

	const handleShowInbox = () => {
		setIsShowInbox(!isShowInbox);
	};

	useEffect(() => {
		setIsFocused(!!focusTrack);
	}, [focusTrack]);

	const toggleViewMode = () => {
		if (isFocused) {
			layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
		} else {
			const firstTrack = screenShareTracks[0] || tracks.find(isTrackReference) || tracks[0];
			if (firstTrack) {
				layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: firstTrack });
			}
		}
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (!inboxRef.current) return;
		if (!inboxRef.current.contains(event.target as Node)) {
			setIsShowInbox(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const room = useRoomContext();
	const [isShowChat, setIsShowChat] = useState(false);
	const [chatMessages, setChatMessages] = useState<{ user?: string; name?: string; text?: string; file?: any }[]>([]);
	const [chatInput, setChatInput] = useState('');
	const session = useSelector(selectSession);
	const username = session?.username || session?.user_id || room.localParticipant.identity;

	// Lắng nghe tin nhắn từ các participant khác
	useEffect(() => {
		if (!room) return;
		const handleData = (
			payload: Uint8Array,
			participant?: RemoteParticipant | LocalParticipant
		) => {
			try {
				const msg = JSON.parse(new TextDecoder().decode(payload));
				if (msg.file) {
					setChatMessages((msgs) => [
						...msgs,
						{ user: participant?.identity, name: msg.name || participant?.identity, file: msg.file }
					]);
				} else {
					setChatMessages((msgs) => [
						...msgs,
						{ user: participant?.identity, name: msg.name || participant?.identity, text: msg.text }
					]);
				}
			} catch { }
		};
		room.on(RoomEvent.DataReceived, handleData);
		return () => {
			room.off(RoomEvent.DataReceived, handleData);
		};
	}, [room]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (chatInput.trim() && room) {
			const msg = { text: chatInput, name: username };
			room.localParticipant.publishData(
				new TextEncoder().encode(JSON.stringify(msg)),
				{ reliable: true }
			);
			setChatMessages((msgs) => [...msgs, { user: room.localParticipant.identity, name: username, text: chatInput }]);
			setChatInput('');
		}
	};

	// Gửi file qua chat (callback cho FileSelectionButton)
	const handleSendFile = (file: any) => {
		if (room && file && file.url) {
			// Gửi toàn bộ object file (ApiMessageAttachment)
			const msg = { type: 'file', name: username, file };
			room.localParticipant.publishData(
				new TextEncoder().encode(JSON.stringify(msg)),
				{ reliable: true }
			);
			setChatMessages((msgs) => [...msgs, { user: room.localParticipant.identity, name: username, file }]);
		}
	};

	const userTracks = tracks.filter((track) => track.source !== 'screen_share' && track.source !== 'screen_share_audio');

	// State cho emoji/sticker popup
	const [isShowEmojiPopup, setIsShowEmojiPopup] = useState(false);
	const [emojiType, setEmojiType] = useState<null | 'emoji' | 'sticker'>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Xử lý chọn emoji/sticker
	const handleSelectEmojiSticker = (item: any) => {
		if (!item) return;
		let text = '';
		if (emojiType === 'emoji') {
			text = item.native || item.shortcodes || item.emoji || item.name || '';
		} else if (emojiType === 'sticker') {
			text = item.url || item.name || '[Sticker]';
		}
		if (text && room) {
			const msg = { text, name: username };
			room.localParticipant.publishData(
				new TextEncoder().encode(JSON.stringify(msg)),
				{ reliable: true }
			);
			setChatMessages((msgs) => [...msgs, { user: room.localParticipant.identity, name: username, text }]);
		}
		setIsShowEmojiPopup(false);
		setEmojiType(null);
	};

	return (
		<div className="lk-video-conference flex-1 w-full h-full" style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh' }}>
			<LayoutContextProvider value={layoutContext}>
				{/* Video Area - Luôn flex-1 bên trái */}
				<div style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'static' }}>
					{/* Header/Topbar và các nút chức năng */}
					<div className="w-full h-[68px] flex justify-between items-center p-2 !pr-5" style={{ zIndex: 20 }}>
						<div className="flex justify-start gap-2">
							<span>
								{!isExternalCalling ? (
									<Icons.Speaker defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />
								) : (
									<Icons.SpeakerLocked defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />
								)}
							</span>
							<p className={`text-base font-semibold cursor-default one-line text-contentTertiary`}>{channelLabel}</p>
						</div>
						<div className="flex justify-start gap-4">
							{!isExternalCalling && !propTracks && (
								<div className="relative leading-5 h-5" ref={inboxRef}>
									<button
										title="Inbox"
										className="focus-visible:outline-none"
										onClick={handleShowInbox}
										onContextMenu={(e) => e.preventDefault()}
									>
										<Icons.Inbox
											isWhite={isShowInbox}
											defaultFill="text-contentTertiary"
											className="hover:text-white text-[#B5BAC1]"
										/>
										{(currentClan?.badge_count ?? 0) > 0 && <RedDot />}
									</button>
									{isShowInbox && <NotificationList rootRef={inboxRef} />}
								</div>
							)}

							<Tooltip
								showArrow={{ className: '!top-[6px]' }}
								key={+focusTrack}
								placement="bottomRight"
								align={{
									offset: [11, -4]
								}}
								overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">{focusTrack ? 'Grid' : 'Focus'}</span>}
								overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
								overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
								getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
							>
								<span onClick={toggleViewMode} className="cursor-pointer">
									{focusTrack ? (
										<Icons.VoiceGridIcon className="hover:text-white text-[#B5BAC1]" />
									) : (
										<Icons.VoiceFocusIcon className="hover:text-white text-[#B5BAC1]" />
									)}
								</span>
							</Tooltip>
							{/* Chat Icon Button */}
							<button
								title="Chat"
								className="focus-visible:outline-none"
								onClick={() => setIsShowChat((prev) => !prev)}
								style={{ position: 'relative' }}
							>
								{Icons.Chat ? (
									<Icons.Chat className="hover:text-white text-[#B5BAC1] w-6 h-6" />
								) : (
									<span className="material-icons">chat</span>
								)}
							</button>
						</div>
					</div>
					{/* Main video conference area, flex-1 */}
					<div className={isShowChat ? 'flex-1 min-w-0 transition-all duration-300' : 'flex-1 w-full transition-all duration-300'} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
						{/* ...existing video conference code... */}
						{!focusTrack ? (
							<div className="lk-grid-layout-wrapper !h-full !py-[68px]">
								<GridLayout tracks={tracks}>
									<ParticipantTile isExtCalling={isExternalCalling} />
								</GridLayout>
							</div>
						) : (
							<div className={`lk-focus-layout-wrapper !h-full  ${isShowMember ? '!py-[68px]' : ''}`}>
								<FocusLayoutContainer isShowMember={isShowMember}>
									{focusTrack && <FocusLayout trackRef={focusTrack} isExtCalling={isExternalCalling} />}
									{isShowMember && (
										<CarouselLayout tracks={tracks}>
											<ParticipantTile isExtCalling={isExternalCalling} />
										</CarouselLayout>
									)}
								</FocusLayoutContainer>
								{isHovered && (
									<Tooltip
										key={+isShowMember}
										placement="top"
										overlay={
											<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">
												{isShowMember ? 'Hide Members' : 'Show Members'}
											</span>
										}
										overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
										getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
										destroyTooltipOnHide
									>
										<div
											className={`absolute bg-[#2B2B2B] left-1/2 ${isShowMember ? 'bottom-[178px]' : 'bottom-[66px]'}
												transform -translate-x-1/2 flex flex-row items-center gap-[2px] p-[2px] rounded-[20px]`}
											onClick={handleShowMember}
										>
											{isShowMember ? <Icons.VoiceArowDownIcon /> : <Icons.VoiceArowUpIcon />}
											<p className="flex gap-1">
												<span>
													<Icons.MemberList defaultFill="text-white" />
												</span>
												<span className="pr-[6px]">{userTracks.length}</span>
											</p>
										</div>
									</Tooltip>
								)}
							</div>
						)}
					</div>
					{/* Control Bar luôn ở dưới cùng video area, không absolute */}
					<div style={{ width: '100%' }}>
						<ControlBar isExternalCalling={isExternalCalling} onLeaveRoom={onLeaveRoom} onFullScreen={onFullScreen} />
					</div>
				</div>
				{/* Chat Area - Cố định bên phải khi bật, không che video, scroll độc lập */}
				{isShowChat && (
					<div
						style={{
							width: 340,
							minWidth: 280,
							maxWidth: 400,
							background: '#23272A',
							borderLeft: '1px solid #36393F',
							display: 'flex',
							flexDirection: 'column',
							height: '100vh',
							zIndex: 10,
							boxShadow: '-2px 0 8px 0 rgba(0,0,0,0.12)',
							position: 'static'
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: '0 20px',
								height: 56,
								minHeight: 56,
								borderBottom: '1px solid #36393F',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								background: '#23272A',
								flexShrink: 0
							}}
						>
							<span style={{ color: '#fff', fontWeight: 600, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelLabel}</span>
							<button
								onClick={() => setIsShowChat(false)}
								style={{ color: '#B5BAC1', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginLeft: 8 }}
								tabIndex={0}
								aria-label="Đóng chat"
							>
								×
							</button>
						</div>
						{/* Chat messages */}
						<div
							style={{
								flex: 1,
								padding: '18px 16px 12px 16px',
								overflowY: 'auto',
								color: '#fff',
								display: 'flex',
								flexDirection: 'column',
								gap: 10,
								background: '#23272A',
								minHeight: 0
							}}
						>
							{chatMessages.length === 0 ? (
								<div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No messages yet.</div>
							) : (
								chatMessages.map((msg, idx) => {
									const isMe = msg.user === room.localParticipant.identity;
									return (
										<div
											key={idx}
											style={{
												background: isMe ? '#5865F2' : '#2F3136',
												borderRadius: 10,
												padding: '8px 12px',
												alignSelf: isMe ? 'flex-end' : 'flex-start',
												maxWidth: '80%',
												marginBottom: 2,
												textAlign: isMe ? 'right' : 'left',
												color: isMe ? '#fff' : '#fff',
												boxShadow: isMe ? '0 1px 4px 0 rgba(88,101,242,0.08)' : 'none',
												marginLeft: isMe ? 40 : 0,
												marginRight: isMe ? 0 : 40
											}}
										>
											<div style={{ fontWeight: 600, color: isMe ? '#d1d6fa' : '#aaa', fontSize: 13, marginBottom: 2 }}>{msg.name}</div>
											{msg.text && <span style={{ color: isMe ? '#fff' : '#fff', wordBreak: 'break-word', fontSize: 15 }}>{msg.text}</span>}
											{msg.file && (
												<div style={{ marginTop: 6 }}>
													<RenderAttachmentThumbnail attachment={msg.file} />
												</div>
											)}
										</div>
									);
								})
							)}
						</div>
						{/* Input */}
						<form
							style={{
								padding: '10px 16px',
								borderTop: '1px solid #36393F',
								background: '#23272A',
								flexShrink: 0,
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								position: 'relative'
							}}
							onSubmit={handleSendMessage}
						>
							{/* File gửi file bên trái */}
							<div style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
								<FileSelectionButton currentClanId={(session as any).clan_id || ''} currentChannelId={channelLabel || ''} hasPermissionEdit={true} onSendFile={handleSendFile} />
							</div>
							<div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
								<input
									ref={inputRef}
									type="text"
									placeholder="write your thoughts here..."
									value={chatInput}
									onChange={e => setChatInput(e.target.value)}
									style={{
										width: '100%',
										padding: '10px 12px',
										borderRadius: 8,
										border: 'none',
										outline: 'none',
										background: '#313338',
										color: '#fff',
										fontSize: 15,
										boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)'
									}}
									autoComplete="off"
									maxLength={500}
								/>
								{/* Nút emoji bên phải input */}
								<div
									style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 30 }}
									onClick={e => {
										e.stopPropagation();
										setIsShowEmojiPopup(true);
										setEmojiType('emoji');
									}}
									tabIndex={0}
									aria-label="Chọn emoji"
								>
									<Icons.Smile defaultSize="w-6 h-6" defaultFill="#AEAEAE" />
								</div>
							</div>
							<button
								type="submit"
								style={{
									background: '#5865F2',
									color: '#fff',
									border: 'none',
									borderRadius: 8,
									padding: '8px 16px',
									fontWeight: 600,
									fontSize: 15,
									cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
									opacity: chatInput.trim() ? 1 : 0.5,
									marginLeft: 8
								}}
								disabled={!chatInput.trim()}
							>
								Send
							</button>
							{/* Popup emoji/sticker */}
							{isShowEmojiPopup && (
								<div style={{ position: 'absolute', bottom: 50, right: 0, zIndex: 100 }} id="emoji-popup-panel">
									<EmojiSuggestionProvider>
										<GifStickerEmojiPopup
											emojiAction={emojiType === 'emoji' ? undefined : undefined}
											mode={undefined}
											toggleEmojiPanel={() => setIsShowEmojiPopup(false)}
											isTopic={false}
											// Truyền callback chọn emoji/sticker
											setBuzzInputRequest={item => handleSelectEmojiSticker(item)}
										/></EmojiSuggestionProvider>
								</div>
							)}
						</form>
					</div>
				)}
			</LayoutContextProvider>
			<RoomAudioRenderer />
			{!propTracks && <ConnectionStateToast />}
		</div>
	);
}
