import { Icons } from '@mezon/ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SfuVideo } from '../Media/SfuVideo';
import { isRemoteScreenSharing } from '../remoteMediaLifecycle';
import type { ScreenKeyframeRecovery } from '../screenKeyframeRecovery';
import type { SfuParticipantTileProps } from './SfuParticipantTile';

export const ScreenShareFocusContext = createContext(false);

export const SfuScreenShareTile = ({
	participant,
	displayName,
	recovery
}: Pick<SfuParticipantTileProps, 'participant' | 'displayName'> & { recovery: ScreenKeyframeRecovery }) => {
	const focused = useContext(ScreenShareFocusContext);
	const focusedRef = useRef(focused);
	focusedRef.current = focused;
	const tileRef = useRef<HTMLDivElement>(null);
	const sourceRef = useRef<symbol>();
	const track = participant.screen;
	const sharing = isRemoteScreenSharing(participant);
	const [frameState, setFrameState] = useState<{ track?: MediaStreamTrack; available: boolean }>({ available: false });
	const stream = useMemo(() => (track ? new MediaStream([track]) : undefined), [track]);
	const handleVideoFrameStateChange = useCallback(
		(available: boolean) => {
			if (!available && sourceRef.current) recovery.reportFrameUnavailable(sourceRef.current);
			setFrameState((previous) => (previous.track === track && previous.available === available ? previous : { track, available }));
		},
		[recovery, track]
	);
	const handleFrame = useCallback(() => {
		if (sourceRef.current) recovery.reportFrame(sourceRef.current);
	}, [recovery]);
	const handlePictureInPicture = useCallback(
		(active: boolean) => {
			if (sourceRef.current) recovery.setPictureInPicture(sourceRef.current, active);
		},
		[recovery]
	);

	useEffect(() => {
		const element = tileRef.current;
		if (!element || !track || !sharing) return;
		const source = Symbol('screen-renderer');
		sourceRef.current = source;
		recovery.register(source, participant.peerId, track, focusedRef.current);
		let observer: IntersectionObserver | undefined;
		let resizeObserver: ResizeObserver | undefined;
		const checkVisibility = () => {
			const rect = element.getBoundingClientRect();
			recovery.setVisible(
				source,
				rect.width > 0 &&
					rect.height > 0 &&
					rect.bottom > 0 &&
					rect.right > 0 &&
					rect.top < window.innerHeight &&
					rect.left < window.innerWidth
			);
		};
		if (typeof IntersectionObserver !== 'undefined') {
			observer = new IntersectionObserver(([entry]) => recovery.setVisible(source, entry.isIntersecting && entry.intersectionRatio > 0));
			observer.observe(element);
		} else {
			checkVisibility();
			window.addEventListener('scroll', checkVisibility, true);
			window.addEventListener('resize', checkVisibility);
			if (typeof ResizeObserver !== 'undefined') {
				resizeObserver = new ResizeObserver(checkVisibility);
				resizeObserver.observe(element);
			}
		}
		return () => {
			observer?.disconnect();
			resizeObserver?.disconnect();
			window.removeEventListener('scroll', checkVisibility, true);
			window.removeEventListener('resize', checkVisibility);
			recovery.unregister(source);
			if (sourceRef.current === source) sourceRef.current = undefined;
		};
	}, [participant.peerId, recovery, sharing, track]);

	useEffect(() => {
		// A cached frame can be reported by the video effect before this renderer is registered.
		if (sourceRef.current && frameState.track === track && frameState.available) recovery.reportFrame(sourceRef.current);
	}, [frameState, participant.peerId, recovery, sharing, track]);

	useEffect(() => {
		if (sourceRef.current) recovery.setFocused(sourceRef.current, focused);
	}, [focused, recovery, track]);

	const showVideo = Boolean(track?.readyState === 'live' && frameState.track === track && frameState.available);
	if (!stream || !sharing) return null;

	return (
		<div ref={tileRef} className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-[#5d5f66]">
			<div className={`absolute inset-0 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
				<SfuVideo
					stream={stream}
					muted
					fit="contain"
					onFrameStateChange={handleVideoFrameStateChange}
					onFrame={handleFrame}
					onPictureInPictureChange={handlePictureInPicture}
				/>
			</div>
			{!showVideo && <div className="flex h-full items-center justify-center bg-[#5d5f66] text-sm text-zinc-300">Loading screen share…</div>}
			<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] min-w-0 items-center gap-1 rounded-md bg-[#00000080] p-[5px] text-sm">
				<Icons.VoiceScreenShareIcon className="!h-4 !w-4 shrink-0" color="currentColor" />
				<span className="truncate whitespace-nowrap py-0.5">{displayName} — Screen</span>
			</div>
		</div>
	);
};
