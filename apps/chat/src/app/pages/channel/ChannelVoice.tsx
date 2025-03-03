import { LiveKitRoom } from '@livekit/components-react';

import '@livekit/components-styles';
import { MyVideoConference, PreJoinVoiceChannel } from '@mezon/components';
import { useAppParams, useAuth } from '@mezon/core';
import {
	generateMeetToken,
	getStoreAsync,
	handleParticipantMeetState,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsShowSettingFooter,
	selectShowCamera,
	selectShowMicrophone,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { ParticipantMeetState, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';

import { ChannelType } from 'mezon-js';
import { memo, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

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
		const { userProfile } = useAuth();
		const currentChannel = useSelector(selectCurrentChannel);
		const isChannelMezonVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
		const containerRef = useRef<HTMLDivElement | null>(null);

		const participantMeetState = async (state: ParticipantMeetState, clanId?: string, channelId?: string): Promise<void> => {
			if (!clanId || !channelId || !userProfile?.user?.id) return;

			await dispatch(
				handleParticipantMeetState({
					clan_id: clanId,
					channel_id: channelId,
					user_id: userProfile.user.id,
					display_name: userProfile.user.display_name,
					state
				})
			);
		};

		const handleJoinRoom = async () => {
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

		const isShow = isJoined && voiceInfo?.clanId === currentChannel?.clan_id && voiceInfo?.channelId === currentChannel?.channel_id;

		const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
		const { channelId } = useAppParams();

		return (
			<div
				className={`${!isChannelMezonVoice || isShowSettingFooter.status || !channelId ? 'hidden' : ''} absolute ${isWindowsDesktop || isLinuxDesktop ? 'bottom-[21px]' : 'bottom-0'} right-0  z-30`}
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
							className={`${!isShow ? 'hidden' : ''} ${isVoiceFullScreen ? '!fixed !inset-0 !z-50 !w-screen !h-screen' : ''}`}
							audio={showMicrophone}
							video={showCamera}
							token={token}
							serverUrl={serverUrl}
							data-lk-theme="default"
						>
							<MyVideoConference channel={currentChannel || undefined} onLeaveRoom={handleLeaveRoom} onFullScreen={handleFullScreen} />
						</LiveKitRoom>
					</>
				)}
			</div>
		);
	},
	() => true
);

export default ChannelVoice;
