import { useEffect, useRef } from 'react';
import type { SfuRemoteMedia } from '../../types';

const SfuRemoteAudioTrack = ({ track, muted }: { track: MediaStreamTrack; muted: boolean }) => {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.srcObject = new MediaStream([track]);
		void element.play().catch(() => undefined);
		return () => {
			element.srcObject = null;
		};
	}, [track]);
	return <audio ref={ref} autoPlay playsInline muted={muted} />;
};

export const SfuRoomAudioRenderer = ({ participants, mutedParticipantIds }: { participants: SfuRemoteMedia[]; mutedParticipantIds: Set<string> }) => (
	<div className="hidden">
		{participants.map((participant) =>
			participant.audio ? (
				<SfuRemoteAudioTrack
					key={`${participant.id}-${participant.audio.id}`}
					track={participant.audio}
					muted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
				/>
			) : null
		)}
	</div>
);
