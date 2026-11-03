import { selectVoiceUserVolumes, useAppSelector } from '@mezon/store';
import type { SfuRemoteMedia } from '../../types';
import { SfuAudioTrack } from './SfuAudioTrack';
import type { AudioPlaybackFailure } from './audioPlayback';

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
	onSinkIdFailure?: (sinkId?: string) => void;
}) => {
	const volumes = useAppSelector(selectVoiceUserVolumes);
	return (
		<div className="hidden">
			{participants.map((participant) =>
				participant.audio ? (
					<SfuAudioTrack
						key={`${participant.id}-${participant.peerId || participant.userId || 'unknown'}-${participant.audio.id}`}
						track={participant.audio}
						volume={participant.userId ? (volumes[participant.userId] ?? 100) / 100 : 1}
						sinkId={sinkId}
						onPlaybackFailure={onPlaybackFailure}
						onSinkIdFailure={onSinkIdFailure}
						muted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
					/>
				) : null
			)}
		</div>
	);
};
