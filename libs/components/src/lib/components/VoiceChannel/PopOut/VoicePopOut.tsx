/* eslint-disable no-console */
import { RoomContext } from '@livekit/components-react';
import { useAuth } from '@mezon/core';
import {
	handleParticipantVoiceState,
	selectShowCamera,
	selectShowMicrophone,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { ParticipantMeetState } from '@mezon/utils';
import { Room } from 'livekit-client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MyVideoConference } from '../MyVideoConference/MyVideoConference';

const Popout: React.FC = () => {
	const token = useSelector(selectTokenJoinVoice);
	const voiceInfo = useSelector(selectVoiceInfo);
	const dispatch = useAppDispatch();
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const showMicrophone = useSelector(selectShowMicrophone);
	const showCamera = useSelector(selectShowCamera);
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const { userProfile } = useAuth();
	const containerRef = useRef<HTMLDivElement | null>(null);

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

	const [room] = useState(
		() =>
			new Room({
				// Optimize video quality for each participant's screen
				adaptiveStream: true,
				// Enable automatic audio/video quality optimization
				dynacast: true
			})
	);

	useEffect(() => {
		let mounted = true;

		const connect = async () => {
			if (mounted) {
				await room.connect(serverUrl as string, token);
			}
		};
		connect();

		return () => {
			mounted = false;
			room.disconnect();
		};
	}, [room]);

	return (
		// <LiveKitRoom
		// 	ref={containerRef}
		// 	id="livekitRoomPopOut"
		// 	key={token}
		// 	className={`${isVoiceFullScreen ? '!w-screen !h-screen' : ''}`}
		// 	audio={showMicrophone}
		// 	video={showCamera}
		// 	token={token}
		// 	serverUrl={serverUrl}
		// 	data-lk-theme="default"
		// >
		<RoomContext.Provider value={room}>
			<div data-lk-theme="default" style={{ height: '100vh' }} id="livekitRoomPopOut" ref={containerRef}>
				<MyVideoConference channelLabel={voiceInfo?.channelLabel as string} onLeaveRoom={handleLeaveRoom} onFullScreen={handleFullScreen} />
			</div>
		</RoomContext.Provider>
	);
};

export default Popout;
