import { Icons } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { useMemo } from 'react';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import type { SfuRemoteMedia } from '../../types';
import { SfuVideo } from '../Media/SfuVideo';
import { useActiveSoundReaction } from '../Reaction';

const participantTileFrameBaseClass =
	'relative aspect-video overflow-hidden rounded-xl border-2 bg-theme-setting-primary transition-[border-color,box-shadow] duration-200';

export const SFU_SPEAKING_BORDER_COLOR = '#23a559';

export const getParticipantTileFrameClass = (speaking: boolean) =>
	`${participantTileFrameBaseClass} ${
		speaking ? 'border-[#23a559] shadow-[0_0_0_2px_rgba(35,165,89,0.28)]' : 'border-transparent hover:border-zinc-500/40'
	}`;

export interface SfuParticipantTileProps {
	participant: SfuRemoteMedia;
	displayName: string;
	avatar?: string;
	speaking?: boolean;
	locallyMuted?: boolean;
}

export const SfuParticipantTile = ({ participant, displayName, avatar, speaking: propSpeaking, locallyMuted }: SfuParticipantTileProps) => {
	const isMuted = locallyMuted || participant.isMute === true || !participant.audio || participant.audio.muted;
	const speaking = isMuted ? false : Boolean(propSpeaking);
	const remoteVideoStream = useMemo(() => (participant.video ? new MediaStream([participant.video]) : undefined), [participant.video]);
	const showVideo = Boolean(participant.video?.readyState === 'live' && !participant.video.muted && participant.cameraActive !== false);
	const activeSoundReaction = useActiveSoundReaction(participant.userId);

	return (
		<div className={getParticipantTileFrameClass(speaking)}>
			{activeSoundReaction && (
				<div className="pointer-events-none absolute right-2 top-2 z-40 rounded-full border border-white/20 bg-[#5865f2] p-1.5 shadow-lg">
					<Icons.VoiceSoundControlIcon className="h-4 w-4 text-white" />
				</div>
			)}
			{remoteVideoStream && (
				<div className={`absolute inset-0 ${showVideo ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
					<SfuVideo stream={remoteVideoStream} />
				</div>
			)}
			{!showVideo && (
				<div
					className="flex h-full items-center justify-center bg-[#5d5f66]"
					data-e2e={generateE2eId('clan_page.screen.voice_room.button.open_context')}
				>
					<AvatarImage
						username={displayName}
						alt={displayName}
						src={avatar}
						srcImgProxy={avatar ? createImgproxyUrl(avatar) : undefined}
						className="!h-20 !w-20 !min-h-20 !min-w-20"
					/>
				</div>
			)}
			<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] min-w-0 items-center gap-1 rounded-md bg-[#00000080] p-[5px] text-sm">
				{isMuted ? <Icons.VoiceMicDisabledIcon scale={1.8} className="shrink-0" /> : null}
				<span className="truncate whitespace-nowrap py-0.5" data-e2e={generateE2eId('clan_page.screen.voice_room.username')}>
					{displayName}
				</span>
			</div>
			{participant.role === 'audience' && (
				<span className="absolute right-2 top-2 rounded-md bg-[#00000080] p-[5px] text-xs text-white">Audience</span>
			)}
		</div>
	);
};
