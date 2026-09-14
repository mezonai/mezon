import { Icons } from '@mezon/ui';
import { useCallback, useMemo, useState } from 'react';
import { SfuVideo } from '../Media/SfuVideo';
import type { SfuParticipantTileProps } from './SfuParticipantTile';

export const SfuScreenShareTile = ({ participant, displayName }: Pick<SfuParticipantTileProps, 'participant' | 'displayName'>) => {
	const [hasRecentVideoFrame, setHasRecentVideoFrame] = useState(false);
	const stream = useMemo(() => (participant.screen ? new MediaStream([participant.screen]) : undefined), [participant.screen]);
	const handleVideoFrameStateChange = useCallback((hasRecentFrame: boolean) => setHasRecentVideoFrame(hasRecentFrame), []);
	const showVideo = Boolean(participant.screen?.readyState === 'live' && hasRecentVideoFrame);
	if (!stream) return null;

	return (
		<div className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-[#5d5f66]">
			<div className={`absolute inset-0 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
				<SfuVideo stream={stream} muted fit="contain" onFrameStateChange={handleVideoFrameStateChange} />
			</div>
			{!showVideo && <div className="flex h-full items-center justify-center bg-[#5d5f66] text-sm text-zinc-300">Loading screen share…</div>}
			<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] min-w-0 items-center gap-1 rounded-md bg-[#00000080] p-[5px] text-sm">
				<Icons.VoiceScreenShareIcon className="!h-4 !w-4 shrink-0" color="currentColor" />
				<span className="truncate whitespace-nowrap py-0.5">{displayName} — Screen</span>
			</div>
		</div>
	);
};
