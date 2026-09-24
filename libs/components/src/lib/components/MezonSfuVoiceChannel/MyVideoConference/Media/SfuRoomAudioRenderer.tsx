import type { SfuRemoteMedia } from '../../types';
import { SfuAudioTrack } from './SfuAudioTrack';

export const SfuRoomAudioRenderer = ({ participants, mutedParticipantIds }: { participants: SfuRemoteMedia[]; mutedParticipantIds: Set<string> }) => (
	<div className="hidden">
		{participants.map((participant) =>
			participant.audio ? (
				<SfuAudioTrack
					key={`${participant.id}-${participant.peerId || participant.userId || 'unknown'}-${participant.audio.id}`}
					track={participant.audio}
					muted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
				/>
			) : null
		)}
	</div>
);
