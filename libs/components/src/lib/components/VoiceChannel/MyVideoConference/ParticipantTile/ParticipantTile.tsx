import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { isTrackReference, isTrackReferencePinned } from '@livekit/components-core';
import {
	AudioTrack,
	LockLockedIcon,
	ParticipantContext,
	ScreenShareIcon,
	TrackMutedIndicator,
	TrackRefContext,
	VideoTrack,
	useConnectionQualityIndicator,
	useEnsureTrackRef,
	useFeatureContext,
	useIsEncrypted,
	useMaybeLayoutContext,
	useMaybeParticipantContext,
	useMaybeTrackRefContext,
	useParticipantTile
} from '@livekit/components-react';
import { selectMemberClanByUserName, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import type { Participant } from 'livekit-client';
import { ConnectionQuality, Track } from 'livekit-client';
import React, { PropsWithChildren, forwardRef, useCallback, useMemo, useState } from 'react';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { FocusToggle } from './FocusToggle';

export function ParticipantContextIfNeeded(
	props: React.PropsWithChildren<{
		participant?: Participant;
	}>
) {
	const hasContext = !!useMaybeParticipantContext();
	return props.participant && !hasContext ? (
		<ParticipantContext.Provider value={props.participant}>{props.children}</ParticipantContext.Provider>
	) : (
		<>{props.children}</>
	);
}

export function TrackRefContextIfNeeded(
	props: PropsWithChildren<{
		trackRef?: TrackReferenceOrPlaceholder;
	}>
) {
	const hasContext = !!useMaybeTrackRefContext();
	return props.trackRef && !hasContext ? (
		<TrackRefContext.Provider value={props.trackRef}>{props.children}</TrackRefContext.Provider>
	) : (
		<>{props.children}</>
	);
}

export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
	trackRef?: TrackReferenceOrPlaceholder;
	disableSpeakingIndicator?: boolean;

	onParticipantClick?: (event: ParticipantClickEvent) => void;
}

export const ParticipantTile: (props: ParticipantTileProps & React.RefAttributes<HTMLDivElement>) => React.ReactNode = forwardRef<
	HTMLDivElement,
	ParticipantTileProps
>(function ParticipantTile({ trackRef, children, onParticipantClick, disableSpeakingIndicator, ...htmlProps }: ParticipantTileProps, ref) {
	const trackReference = useEnsureTrackRef(trackRef);

	const { elementProps } = useParticipantTile<HTMLDivElement>({
		htmlProps,
		disableSpeakingIndicator,
		onParticipantClick,
		trackRef: trackReference
	});
	const isEncrypted = useIsEncrypted(trackReference.participant);
	const layoutContext = useMaybeLayoutContext();

	const autoManageSubscription = useFeatureContext()?.autoSubscription;

	const handleSubscribe = useCallback(
		(subscribed: boolean) => {
			if (
				trackReference.source &&
				!subscribed &&
				layoutContext &&
				layoutContext.pin.dispatch &&
				isTrackReferencePinned(trackReference, layoutContext.pin.state)
			) {
				layoutContext.pin.dispatch({ msg: 'clear_pin' });
			}
		},
		[trackReference, layoutContext]
	);

	const username = trackReference.participant.identity;
	const member = useAppSelector((state) => selectMemberClanByUserName(state, username));
	const voiceUsername = member?.clan_nick || username;
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || 'assets/images/mezon-logo-white.svg';
	}, [member]);

	return (
		<div ref={ref} style={{ position: 'relative' }} {...elementProps}>
			<TrackRefContextIfNeeded trackRef={trackReference}>
				<ParticipantContextIfNeeded participant={trackReference.participant}>
					{children ?? (
						<>
							{isTrackReference(trackReference) &&
							(trackReference.publication?.kind === 'video' ||
								trackReference.source === Track.Source.Camera ||
								trackReference.source === Track.Source.ScreenShare) ? (
								<VideoTrack
									trackRef={trackReference}
									onSubscriptionStatusChanged={handleSubscribe}
									manageSubscription={autoManageSubscription}
								/>
							) : (
								isTrackReference(trackReference) && (
									<AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
								)
							)}
							<div className="lk-participant-placeholder !bg-bgIconLight">
								<AvatarImage
									alt={username || ''}
									username={username}
									className="w-20 h-20"
									srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 320, height: 320, resizeType: 'fit' })}
									src={avatar}
								/>
							</div>
							<div className="lk-participant-metadata overflow-hidden">
								<div className="lk-participant-metadata-item flex w-full justify-between gap-1 !bg-transparent">
									{trackReference.source === Track.Source.Camera ? (
										<div className="flex min-w-0 items-center overflow-hidden gap-1 bg-[#00000080] p-[5px] rounded-md">
											{isEncrypted && <LockLockedIcon />}
											<TrackMutedIndicator
												trackRef={{
													participant: trackReference.participant,
													source: Track.Source.Microphone
												}}
												show={'muted'}
											></TrackMutedIndicator>
											<span className="truncate whitespace-nowrap">{voiceUsername}</span>
										</div>
									) : (
										<div className="flex min-w-0 items-center overflow-hidden gap-1 bg-[#00000080] p-[5px] rounded-md">
											<span>
												<ScreenShareIcon />
											</span>
											<span className="truncate whitespace-nowrap">{voiceUsername}&apos;s screen</span>
										</div>
									)}
									<ConnectionQualityIndicator />
								</div>
							</div>
						</>
					)}
					<FocusToggle className="w-full h-full absolute top-0 right-0 bg-transparent" trackRef={trackReference} />
				</ParticipantContextIfNeeded>
			</TrackRefContextIfNeeded>
		</div>
	);
});
export interface ConnectionQualityIndicatorOptions {
	participant?: Participant;
}
export interface ConnectionQualityIndicatorProps extends React.HTMLAttributes<HTMLDivElement>, ConnectionQualityIndicatorOptions {}

export const ConnectionQualityIndicator = React.forwardRef<HTMLDivElement, ConnectionQualityIndicatorProps>(
	function ConnectionQualityIndicator(props, ref) {
		const { quality: rawQuality } = useConnectionQualityIndicator(props);
		const [quality, setQuality] = useState(rawQuality);

		React.useEffect(() => {
			setQuality(rawQuality);
		}, [rawQuality]);

		return (
			<div ref={ref} className="bg-[#00000080] p-[5px] rounded-md">
				{props.children ??
					(quality === ConnectionQuality.Excellent ? (
						<Icons.SvgQualityExcellentIcon />
					) : quality === ConnectionQuality.Good ? (
						<Icons.SvgQualityGoodIcon />
					) : quality === ConnectionQuality.Poor ? (
						<Icons.SvgQualityPoorIcon />
					) : (
						<Icons.SvgQualityUnknownIcon />
					))}
			</div>
		);
	}
);
