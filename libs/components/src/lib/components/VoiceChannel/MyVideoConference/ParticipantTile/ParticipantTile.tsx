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
import { useAuth, usePermissionChecker } from '@mezon/core';
import { selectMemberClanByUserName, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, createImgproxyUrl } from '@mezon/utils';
import type { Participant } from 'livekit-client';
import { ConnectionQuality, Track } from 'livekit-client';
import { safeJSONParse } from 'mezon-js';
import React, { PropsWithChildren, forwardRef, useCallback, useMemo, useState } from 'react';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { ActiveSoundReaction } from '../Reaction/types';
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
	isExtCalling?: boolean;
	isConnectingScreen?: boolean;
	activeSoundReactions?: Map<string, ActiveSoundReaction>;
	roomName?: string;
}
export const ParticipantTile: (props: ParticipantTileProps & React.RefAttributes<HTMLDivElement>) => React.ReactNode = forwardRef<
	HTMLDivElement,
	ParticipantTileProps
>(function ParticipantTile(
	{
		trackRef,
		children,
		roomName,
		onParticipantClick,
		disableSpeakingIndicator,
		isExtCalling,
		activeSoundReactions,
		...htmlProps
	}: ParticipantTileProps,
	ref
) {
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
	const usernameRaw = trackReference.participant.identity;

	const parsedUsername = isExtCalling ? safeJSONParse(usernameRaw as string) : undefined;

	const usernameString = parsedUsername?.extName ? parsedUsername?.extName : usernameRaw;

	const extAvatar = parsedUsername?.extAvatar ? parsedUsername?.extAvatar : undefined;

	const member = useAppSelector((state) => selectMemberClanByUserName(state, usernameString));

	const voiceUsername = member?.clan_nick || usernameString;

	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || null;
	}, [member]);

	const resolvedAvatar = extAvatar ?? avatar;
	const isAvatarResolved = parsedUsername !== undefined || member !== undefined;

	const activeSoundReaction = activeSoundReactions?.get(usernameString);
	const hasActiveSoundReaction = Boolean(activeSoundReaction);

	const avatarToRender = resolvedAvatar ? (
		<AvatarImage
			alt={usernameString || ''}
			username={usernameString || ''}
			className="w-20 h-20"
			srcImgProxy={createImgproxyUrl(resolvedAvatar, {
				width: 320,
				height: 320,
				resizeType: 'fit'
			})}
			src={resolvedAvatar}
		/>
	) : (
		isAvatarResolved &&
		usernameString && (
			<div
				className={`size-10 text-theme-primary bg-theme-primary text-[16px] w-20 h-20 !text-4xl font-semibold flex items-center justify-center rounded-xl`}
			>
				{usernameString?.charAt(0)?.toUpperCase()}
			</div>
		)
	);

	const dispatch = useAppDispatch();

	const handleRemoveMember = useCallback(async () => {
		if (!roomName) {
			return;
		}
		dispatch(
			voiceActions.kickVoiceMember({
				room_name: roomName,
				username: member?.user?.username
			})
		);
	}, [roomName]);

	const handleMuteMember = useCallback(async () => {
		if (!roomName) {
			return;
		}
		dispatch(
			voiceActions.muteVoiceMember({
				room_name: roomName,
				username: member?.user?.username
			})
		);
	}, [roomName]);

	const [canMangeVoice] = usePermissionChecker([EPermission.manageChannel]);
	const { userProfile } = useAuth();

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
									id="focusTrack"
									trackRef={trackReference}
									onSubscriptionStatusChanged={handleSubscribe}
									manageSubscription={autoManageSubscription}
								/>
							) : (
								isTrackReference(trackReference) && (
									<AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
								)
							)}
							<div className="lk-participant-placeholder !bg-bgIconLight">{avatarToRender}</div>

							{hasActiveSoundReaction && (
								<div className="absolute top-2 right-2 pointer-events-none z-40 transition-all duration-300 ease-in-out">
									<div className="bg-[#5865f2] rounded-full p-1.5 shadow-lg border border-white/20 animate-in fade-in-0 zoom-in-95 duration-200">
										<Icons.VoiceSoundControlIcon className="w-4 h-4 text-white" />
									</div>
								</div>
							)}

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
											<span className="truncate whitespace-nowrap py-0.5">{voiceUsername}</span>
										</div>
									) : (
										<div className="flex min-w-0 items-center overflow-hidden gap-1 bg-[#00000080] p-[5px] rounded-md">
											<span>
												<ScreenShareIcon />
											</span>
											<span className="truncate whitespace-nowrap py-0.5">{voiceUsername}&apos;s screen</span>
										</div>
									)}
									<ConnectionQualityIndicator />
								</div>
							</div>
						</>
					)}
					<FocusToggle className="peer w-full h-full absolute top-0 right-0 bg-transparent" trackRef={trackReference} />
					{roomName && canMangeVoice && userProfile?.user?.id !== member?.id && (
						<div className="hover:opacity-100 peer-hover:opacity-100 opacity-0 absolute top-2 right-2 gap-2 flex rounded-full items-center justify-center cursor-pointer">
							<div
								className="w-6 h-6 rounded-full hover:bg-bgSecondaryHover flex items-center justify-center"
								onClick={handleMuteMember}
							>
								<Icons.VoiceMicDisabledIcon className="w-4 h-4" />
							</div>
							<div
								className="w-6 h-6 rounded-full hover:bg-bgSecondaryHover flex items-center justify-center"
								onClick={handleRemoveMember}
							>
								<Icons.CloseIcon className="w-4 h-4" />
							</div>
						</div>
					)}
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
