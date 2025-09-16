import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { LiveKitRoom } from '@livekit/components-react';
import { useAuth } from '@mezon/core';
import { handleParticipantVoiceState, selectVoiceInfo, useAppDispatch, voiceActions } from '@mezon/store';
import { ParticipantMeetState } from '@mezon/utils';
import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MyVideoConference } from '../MyVideoConference/MyVideoConference';

const VoicePopout: React.FC<{
	tracks?: TrackReferenceOrPlaceholder[];
	onClose?: () => void;
}> = ({ tracks = [], onClose }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);

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
				state,
				room_name: voiceInfo?.roomId || ''
			})
		);
	};

	const handleLeaveRoom = useCallback(async () => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		dispatch(voiceActions.resetVoiceSettings());
		await participantMeetState(ParticipantMeetState.LEAVE, voiceInfo.clanId, voiceInfo.channelId);

		if (onClose) {
			onClose();
		}
	}, [dispatch, voiceInfo, onClose]);

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

	return (
		<div className="h-full w-full">
			<LiveKitRoom
				ref={containerRef}
				id="livekitRoom"
				className="flex flex-col !w-full !h-full"
				token={''}
				serverUrl={''}
				data-lk-theme="default"
				connectOptions={{
					autoSubscribe: false
				}}
				connect={false}
			>
				<MyVideoConference
					channelLabel={voiceInfo?.channelLabel || 'Voice Channel'}
					onLeaveRoom={handleLeaveRoom}
					onFullScreen={handleFullScreen}
					tracks={tracks}
					currentChannel={{
						channel_id: voiceInfo?.channelId || '',
						clan_id: voiceInfo?.clanId || '',
						channelPrivate: voiceInfo?.channelPrivate || 0
					}}
					token={''}
				/>
			</LiveKitRoom>
		</div>
	);
};

export default VoicePopout;
