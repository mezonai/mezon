import type { SfuRemoteMedia } from '../../types';
import type { AudioPlaybackFailure } from './audioPlayback';
import { SfuAudioTrack } from './SfuAudioTrack';

export const SfuRoomAudioRenderer = ({
	participants,
	mutedParticipantIds,
	sinkId,
	onPlaybackFailure,
	onSinkIdFailure
}: {
	participants: SfuRemoteMedia[];
	mutedParticipantIds: Set<string>;
	sinkId?: string;
	onPlaybackFailure?: AudioPlaybackFailure;
	onSinkIdFailure?: (sinkId: string) => void;
}) => (
	<div className="hidden">
		{participants.map((participant) =>
			participant.audio ? (
				<SfuAudioTrack
					key={`${participant.id}-${participant.peerId || participant.userId || 'unknown'}-${participant.audio.id}`}
					track={participant.audio}
					sinkId={sinkId}
					onPlaybackFailure={onPlaybackFailure}
					onSinkIdFailure={onSinkIdFailure}
					muted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
				/>
			) : null
		)}
	</div>
);
