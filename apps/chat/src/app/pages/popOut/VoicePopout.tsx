/* eslint-disable no-console */
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { VideoTrack } from '@livekit/components-react';
import { useAuth } from '@mezon/core';
import { handleParticipantVoiceState, selectVoiceInfo, useAppDispatch, voiceActions } from '@mezon/store';
import { ParticipantMeetState } from '@mezon/utils';
import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const VoicePopout: React.FC<{
	tracks?: TrackReferenceOrPlaceholder[];
	onClose?: () => void;
}> = ({ tracks = [], onClose }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);

	const voiceInfo = useSelector(selectVoiceInfo);
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();

	const participantMeetState = async (state: ParticipantMeetState, clanId?: string, channelId?: string, roomId?: string): Promise<void> => {
		if (!clanId || !channelId || !userProfile?.user?.id) return;

		await dispatch(
			handleParticipantVoiceState({
				clan_id: clanId,
				channel_id: channelId,
				display_name: userProfile?.user?.display_name ?? '',
				state,
				room_name: roomId || ''
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

	const [trackVideo, setTrackVideo] = useState<number>(0);
	const handlePinScreen = (index: number) => {
		setTrackVideo(index);
	};

	return (
		<div className="h-full w-full">
			<div className="w-full h-[80%] bg-[#2f3136] flex justify-center">
				{tracks && tracks.length > 0 && <VideoTrack trackRef={tracks[trackVideo] as any} className="!w-auto" />}
			</div>
			<div className="h-[20%] w-full overflow-y-auto">
				<div className="h-full flex flex-col flex-wrap items-center gap-4">
					{tracks &&
						tracks.map((trackRef, index) => (
							<div
								key={index}
								className={`cursor-pointer h-20 ${trackVideo === index ? 'border-2 border-blue-500' : ''}`}
								onClick={() => handlePinScreen(index)}
							>
								<VideoTrack trackRef={trackRef as any} className="!w-auto h-full" />
							</div>
						))}
				</div>
			</div>
		</div>
	);
};

export default VoicePopout;
