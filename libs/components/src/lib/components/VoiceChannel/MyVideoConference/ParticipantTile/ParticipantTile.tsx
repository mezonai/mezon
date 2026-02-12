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
import { selectMemberClanByUserId, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import { EPermission, createImgproxyUrl } from '@mezon/utils';
import type { Participant, Room } from 'livekit-client';
import { ConnectionQuality, Track } from 'livekit-client';
import { safeJSONParse } from 'mezon-js';
import type { PropsWithChildren } from 'react';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { useActiveSoundReaction } from '../Reaction/useActiveSoundReaction';
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
		props.children
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
		props.children
	);
}

export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
	trackRef?: TrackReferenceOrPlaceholder;
	disableSpeakingIndicator?: boolean;
	onParticipantClick?: (event: ParticipantClickEvent) => void;
	isExtCalling?: boolean;
	isConnectingScreen?: boolean;
	roomName?: string;
	room?: Room;
	groupMembers?: UsersClanEntity[];
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
		room: _room,
		groupMembers,
		...htmlProps
	}: ParticipantTileProps,
	ref
) {
	const { t } = useTranslation('channelVoice');
	const trackReference = useEnsureTrackRef(trackRef);

	const isMicrophoneEnabled = (() => {
		const participant = trackReference.participant;
		const microphoneTrack = participant.getTrackPublication(Track.Source.Microphone);
		if (!microphoneTrack) {
			return false;
		}
		if (microphoneTrack.track) {
			return !microphoneTrack.track.isMuted && !microphoneTrack.isMuted;
		}
		return !microphoneTrack.isMuted && microphoneTrack.isSubscribed;
	})();

	const shouldDisableSpeakingIndicator = disableSpeakingIndicator || !isMicrophoneEnabled;

	const { elementProps } = useParticipantTile<HTMLDivElement>({
		htmlProps,
		disableSpeakingIndicator: shouldDisableSpeakingIndicator,
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
	const participantId = trackReference.participant.identity;

	const parsedUsername = isExtCalling ? safeJSONParse(participantId as string) : undefined;

	const usernameString = parsedUsername?.extName ? parsedUsername?.extName : trackReference.participant.name || participantId;

	const extAvatar = parsedUsername?.extAvatar ? parsedUsername?.extAvatar : undefined;

	const clanMember = useAppSelector((state) => selectMemberClanByUserId(state, participantId));

	const member = useMemo(() => {
		if (groupMembers) {
			return groupMembers.find((m) => m.user?.id === participantId || m.id === participantId);
		}
		return clanMember;
	}, [groupMembers, clanMember, participantId]);

	const voiceUsername = member?.clan_nick || member?.user?.display_name || member?.user?.username || usernameString;

	const avatar = useMemo(() => {
		if (trackReference.participant.isAgent) {
			return 'https://imgproxy.mezon.ai/K0YUZRIosDOcz5lY6qrgC6UIXmQgWzLjZv7VJ1RAA8c/rs:fit:100:100:1/mb:2097152/plain/https://cdn.mezon.vn/0/0/1779484387973271600/1737423959329_undefined173740153013517374015248704886401586613166392.png@webp';
		}
		return member?.clan_avatar || member?.user?.avatar_url || null;
	}, [member]);

	const resolvedAvatar = extAvatar ?? avatar;
	const isAvatarResolved = parsedUsername !== undefined || member !== undefined;

	const activeSoundReaction = useActiveSoundReaction(usernameString);

	const hasActiveSoundReaction = Boolean(activeSoundReaction);

	const avatarToRender = resolvedAvatar ? (
		<AvatarImage
			alt={voiceUsername || ''}
			username={voiceUsername || ''}
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
		voiceUsername && (
			<div
				className={`size-10 text-theme-primary bg-theme-primary text-[16px] w-20 h-20 !text-4xl font-semibold flex items-center justify-center rounded-xl`}
			>
				{voiceUsername?.charAt(0)?.toUpperCase()}
			</div>
		)
	);

	const dispatch = useAppDispatch();

	const [canMangeVoice] = usePermissionChecker([EPermission.manageChannel]);
	const { userProfile } = useAuth();

	const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();

		if (roomName && canMangeVoice && userProfile?.user?.id !== member?.id) {
			const heightWindow = window.innerHeight;
			const widthWindow = window.innerWidth;
			const position = {
				y: heightWindow - event.clientY < 200 ? heightWindow - 200 : event.clientY,
				x: widthWindow - event.clientX < 220 ? widthWindow - 220 : event.clientX
			};
			dispatch(
				voiceActions.openVoiceContextMenu({
					participantId,
					position
				})
			);
		}
	};

	return (
		<div ref={ref} className="relative" {...elementProps}>
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
											<span className="truncate whitespace-nowrap py-0.5">
												{t('usernameScreen', { username: voiceUsername })}
											</span>
										</div>
									)}
									<ConnectionQualityIndicator />
								</div>
							</div>
						</>
					)}
					<FocusToggle
						className="peer w-full h-full absolute top-0 right-0 bg-transparent"
						trackRef={trackReference}
						onContextMenu={handleContextMenu}
					/>
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
		const { quality } = useConnectionQualityIndicator(props);

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
