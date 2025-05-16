import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import { MyVideoConference, PreJoinVoiceChannel } from '@mezon/components';
import { EmojiSuggestionProvider, useAppParams, useAuth } from '@mezon/core';
import {
	appActions,
	generateMeetToken,
	getStoreAsync,
	handleParticipantVoiceState,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsShowChatVoice,
	selectIsShowSettingFooter,
	selectShowCamera,
	selectShowMicrophone,
	selectShowModelEvent,
	selectStatusMenu,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	selectVoiceOpenPopOut,
	useAppDispatch,
	voiceActions
} from '@mezon/store';

import { ParticipantMeetState, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ChatStream from '../chatStream';

const ChannelVoice = memo(
	() => {
		const isJoined = useSelector(selectVoiceJoined);
		const token = useSelector(selectTokenJoinVoice);
		const voiceInfo = useSelector(selectVoiceInfo);
		const [loading, setLoading] = useState<boolean>(false);
		const dispatch = useAppDispatch();
		const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
		const showMicrophone = useSelector(selectShowMicrophone);
		const showCamera = useSelector(selectShowCamera);
		const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
		const isShowChatVoice = useSelector(selectIsShowChatVoice);
		const currentChannel = useSelector(selectCurrentChannel);
		const isChannelMezonVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
		const containerRef = useRef<HTMLDivElement | null>(null);
		const { userProfile } = useAuth();
		const participantMeetState = async (state: ParticipantMeetState, clanId?: string, channelId?: string): Promise<void> => {
			if (!clanId || !channelId || !userProfile?.user?.id) return;

			await dispatch(
				handleParticipantVoiceState({
					clan_id: clanId,
					channel_id: channelId,
					display_name: userProfile?.user?.display_name ?? '',
					state
				})
			);
		};
		const handleJoinRoom = async () => {
			dispatch(voiceActions.setOpenPopOut(false));
			const store = await getStoreAsync();
			const currentClan = selectCurrentClan(store.getState());
			if (!currentClan || !currentChannel?.meeting_code) return;
			setLoading(true);

			try {
				const result = await dispatch(
					generateMeetToken({
						channelId: currentChannel?.channel_id as string,
						roomName: currentChannel?.meeting_code
					})
				).unwrap();

				if (result) {
					if (isJoined && voiceInfo) {
						handleLeaveRoom();
					}

					await participantMeetState(ParticipantMeetState.JOIN, currentChannel?.clan_id as string, currentChannel?.channel_id as string);
					dispatch(voiceActions.setJoined(true));
					dispatch(voiceActions.setToken(result));
					dispatch(
						voiceActions.setVoiceInfo({
							clanId: currentClan?.clan_id as string,
							clanName: currentClan?.clan_name as string,
							channelId: currentChannel?.channel_id as string,
							channelLabel: currentChannel?.channel_label as string
						})
					);
				} else {
					dispatch(voiceActions.setToken(''));
				}
			} catch (err) {
				console.error('Failed to generate token room:', err);
				dispatch(voiceActions.setToken(''));
			} finally {
				setLoading(false);
			}
		};
		const handleLeaveRoom = useCallback(async () => {
			if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;
			dispatch(voiceActions.resetVoiceSettings());
			await participantMeetState(ParticipantMeetState.LEAVE, voiceInfo.clanId, voiceInfo.channelId);
		}, [dispatch, voiceInfo]);
		const handleFullScreen = useCallback(() => {
			if (!containerRef.current) return;

			if (!document.fullscreenElement) {
				containerRef.current
					.requestFullscreen()
					.then(() => dispatch(voiceActions.setFullScreen(true)))
					.catch((err) => {
						console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
					});
			} else {
				document.exitFullscreen().then(() => dispatch(voiceActions.setFullScreen(false)));
			}
		}, [dispatch]);
		useEffect(() => {
			const handleFullscreenChange = () => {
				if (!document.fullscreenElement) {
					dispatch(voiceActions.setFullScreen(false));
				}
			};
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
		}, [dispatch]);
		const isShow = isJoined && voiceInfo?.clanId === currentChannel?.clan_id && voiceInfo?.channelId === currentChannel?.channel_id;
		const toggleChat = () => {
			dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
		};
		const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
		const showModalEvent = useSelector(selectShowModelEvent);
		const { channelId } = useAppParams();
		const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
		const isOnMenu = useSelector(selectStatusMenu);
		return (
			<>
				<div
					className={`${!isChannelMezonVoice || showModalEvent || isShowSettingFooter?.status || !channelId ? 'hidden' : ''} absolute ${isWindowsDesktop || isLinuxDesktop ? 'bottom-[21px]' : 'bottom-0'} right-0 ${!isOnMenu ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''} z-30`}
					style={{ width: 'calc(100% - 72px - 272px)', height: isWindowsDesktop || isLinuxDesktop ? 'calc(100% - 21px)' : '100%' }}
				>
					{token === '' || !serverUrl ? (
						<PreJoinVoiceChannel
							channel={currentChannel || undefined}
							roomName={currentChannel?.meeting_code}
							loading={loading}
							handleJoinRoom={handleJoinRoom}
						/>
					) : (
						<>
							<PreJoinVoiceChannel
								channel={currentChannel || undefined}
								roomName={currentChannel?.meeting_code}
								loading={loading}
								handleJoinRoom={handleJoinRoom}
								isCurrentChannel={isShow}
							/>

							<LiveKitRoom
								ref={containerRef}
								id="livekitRoom"
								key={token}
								className={`${!isShow || isOpenPopOut ? '!hidden' : ''} ${isVoiceFullScreen ? '!fixed !inset-0 !z-50 !w-screen !h-screen' : ''} flex`}
								audio={showMicrophone}
								video={showCamera}
								token={token}
								serverUrl={serverUrl}
								data-lk-theme="default"
							>
								<div className="flex-1 relative flex">
									<MyVideoConference
										channelLabel={currentChannel?.channel_label as string}
										onLeaveRoom={handleLeaveRoom}
										onFullScreen={handleFullScreen}
										isShowChatVoice={isShowChatVoice}
										onToggleChat={toggleChat}
										currentChannel={currentChannel}
									/>
									<EmojiSuggestionProvider>
										{isShowChatVoice && (
											<div className=" w-[500px] border-l border-border dark:border-bgTertiary z-40 bg-bgPrimary flex-shrink-0">
												<ChatStream currentChannel={currentChannel} />
											</div>
										)}</EmojiSuggestionProvider>
								</div>

							</LiveKitRoom>
							{isOpenPopOut && (
								<div className="flex items-center justify-center h-full w-full text-center text-lg font-semibold text-gray-500">
									You are currently in the popout window
								</div>
							)}
						</>
					)}
				</div>
			</>
		);
	},
	() => true
);

export default ChannelVoice;
