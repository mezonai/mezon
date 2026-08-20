import { useEffect, useRef } from 'react';
import type { SfuRemoteMedia } from '../../types';

const SfuRemoteAudioTrack = ({ track }: { track: MediaStreamTrack }) => {
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
	return <audio ref={ref} autoPlay playsInline />;
};

export const SfuRoomAudioRenderer = ({ participants }: { participants: SfuRemoteMedia[] }) => (
	<div className="hidden">
		{participants.map((participant) =>
			participant.audio ? <SfuRemoteAudioTrack key={`${participant.id}-${participant.audio.id}`} track={participant.audio} /> : null
		)}
	</div>
);
