/* eslint-disable no-console */
import { LiveKitRoom } from '@livekit/components-react';
import { useAuth } from '@mezon/core';
import {
	generateMeetToken,
	getStoreAsync,
	handleParticipantVoiceState,
	selectCurrentChannel,
	selectCurrentClan,
	selectShowCamera,
	selectShowMicrophone,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	useAppDispatch,
	usersClanActions,
	voiceActions
} from '@mezon/store';
import { ParticipantMeetState } from '@mezon/utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MyVideoConference } from '../MyVideoConference/MyVideoConference';

const Popout: React.FC = () => {
	console.log(12222);
	const isJoined = useSelector(selectVoiceJoined);
	console.log('isJoined: ', isJoined);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const token = useSelector(selectTokenJoinVoice);
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const showMicrophone = useSelector(selectShowMicrophone);
	const showCamera = useSelector(selectShowCamera);
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const currentChannel = useSelector(selectCurrentChannel);

	const voiceInfo = useSelector(selectVoiceInfo);
	const dispatch = useAppDispatch();
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
	const handleJoinRoom = async () => {
		try {
			const store = await getStoreAsync();
			const currentClan = selectCurrentClan(store.getState());
			dispatch(usersClanActions.fetchUsersClan({ clanId: currentClan?.clan_id as string }));

			if (!currentClan || !currentChannel?.meeting_code) return;

			// dispatch(voiceActions.setOpenPopOut(false));

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
						channelLabel: currentChannel?.channel_label as string
					})
				);
			} else {
				dispatch(voiceActions.setToken(''));
			}
		} catch (err) {
			console.error('Failed to generate token room:', err);
		} finally {
			// setLoading(false);
		}
	};

	useEffect(() => {
		console.log('12345');
		handleJoinRoom();
	}, []);

	return (
		<div className="h-screen w-screen">
			{' '}
			<LiveKitRoom
				ref={containerRef}
				id="livekitRoom"
				key={token}
				className={`${isVoiceFullScreen ? '!fixed !inset-0 !z-50 !w-screen !h-screen' : ''}`}
				audio={showMicrophone}
				video={showCamera}
				token={token}
				serverUrl={serverUrl}
				data-lk-theme="default"
			>
				<MyVideoConference
					channelLabel={currentChannel?.channel_label as string}
					onLeaveRoom={handleLeaveRoom}
					onFullScreen={handleFullScreen}
				/>
			</LiveKitRoom>
		</div>
	);
};

export default Popout;
