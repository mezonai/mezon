import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import { MyVideoConference, PreJoinVoiceChannel } from '@mezon/components';
import { EmojiSuggestionProvider, useAppParams, useAuth } from '@mezon/core';
import {
	appActions,
	generateMeetToken,
	getStore,
	handleParticipantVoiceState,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsShowChatVoice,
	selectIsShowSettingFooter,
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

import { IS_MOBILE, ParticipantMeetState, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useRef, useState } from 'react';
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
					state,
					room_name: voiceInfo?.roomId || ''
				})
			);
		};

		const handleJoinRoom = async () => {
			dispatch(voiceActions.setOpenPopOut(false));
			const store = getStore();
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
					await participantMeetState(ParticipantMeetState.JOIN, currentChannel?.clan_id as string, currentChannel?.channel_id as string);
					dispatch(voiceActions.setJoined(true));
					dispatch(voiceActions.setToken(result));
					dispatch(
						voiceActions.setVoiceInfo({
							clanId: currentClan?.clan_id as string,
							clanName: currentClan?.clan_name as string,
							channelId: currentChannel?.channel_id as string,
							channelLabel: currentChannel?.channel_label as string,
							channelPrivate: currentChannel?.channel_private as number
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
		}, [voiceInfo, voiceInfo?.roomId]);

		const handleFullScreen = useCallback(() => {
			dispatch(voiceActions.setFullScreen(!isVoiceFullScreen));
		}, [isVoiceFullScreen]);

		const isShow = isJoined && voiceInfo?.clanId === currentChannel?.clan_id && voiceInfo?.channelId === currentChannel?.channel_id;

		const toggleChat = useCallback(() => {
			dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
		}, []);

		const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
		const showModalEvent = useSelector(selectShowModelEvent);
		const { channelId } = useAppParams();
		const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
		const isOnMenu = useSelector(selectStatusMenu);
		return (
			<div
				className={`${isOpenPopOut ? 'pointer-events-none' : ''} ${!isChannelMezonVoice || showModalEvent || isShowSettingFooter?.status || !channelId ? 'hidden' : ''} ${isVoiceFullScreen ? 'fixed inset-0 z-[100]' : `absolute ${isWindowsDesktop || isLinuxDesktop ? 'bottom-[21px]' : 'bottom-0'} right-0 ${isOnMenu ? 'max-sbm:z-1 z-30' : 'z-30'}`} ${!isOnMenu && !isVoiceFullScreen ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''}`}
				style={
					!isVoiceFullScreen
						? { width: 'calc(100% - 72px - 272px)', height: isWindowsDesktop || isLinuxDesktop ? 'calc(100% - 21px)' : '100%' }
						: { width: '100vw', height: '100vh' }
				}
			>
				{token === '' || !serverUrl || voiceInfo?.clanId === '0' ? (
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
							id="livekitRoom11"
							key={token}
							className={`${!isShow || isOpenPopOut ? '!hidden' : ''} flex ${isVoiceFullScreen ? 'w-full h-full' : ''}`}
							audio={IS_MOBILE}
							video={false}
							token={token}
							serverUrl={serverUrl}
							data-lk-theme="default"
						>
							<div className="flex-1 relative flex overflow-hidden">
								<MyVideoConference
									token={token}
									url={serverUrl}
									channelLabel={currentChannel?.channel_label as string}
									onLeaveRoom={handleLeaveRoom}
									onFullScreen={handleFullScreen}
									onJoinRoom={handleJoinRoom}
									isShowChatVoice={isShowChatVoice}
									onToggleChat={toggleChat}
									currentChannel={currentChannel}
								/>
								<EmojiSuggestionProvider>
									{isShowChatVoice && (
										<div className=" w-[500px] border-l border-border dark:border-bgTertiary z-40 bg-bgPrimary flex-shrink-0">
											<ChatStream currentChannel={currentChannel} />
										</div>
									)}
								</EmojiSuggestionProvider>
							</div>
						</LiveKitRoom>
					</>
				)}
			</div>
		);
	},
	() => true
);

export default ChannelVoice;
