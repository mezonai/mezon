import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';

let video: HTMLVideoElement | undefined;
let parking: HTMLDivElement | undefined;

const BUFFERING_EVENTS = ['loadstart', 'emptied', 'waiting', 'stalled', 'pause', 'playing', 'canplay'] as const;

export function getStreamVideo() {
	if (!video) {
		video = document.createElement('video');
		video.autoplay = true;
		video.playsInline = true;
		video.style.cssText = 'width:100%;height:100%;object-fit:contain';
		parking = document.createElement('div');
		parking.hidden = true;
		parking.appendChild(video);
		document.body.appendChild(parking);
	}
	return video;
}

const isBuffering = () => {
	const element = getStreamVideo();
	return element.paused || element.readyState < HTMLMediaElement.HAVE_FUTURE_DATA;
};

const subscribeBuffering = (onChange: () => void) => {
	const element = getStreamVideo();
	BUFFERING_EVENTS.forEach((type) => element.addEventListener(type, onChange));
	return () => BUFFERING_EVENTS.forEach((type) => element.removeEventListener(type, onChange));
};

export function StreamVideoSlot({ poster }: { poster: string }) {
	const slotRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const element = getStreamVideo();
		element.poster = poster;
		slotRef.current?.appendChild(element);
		return () => {
			parking?.appendChild(element);
		};
	}, [poster]);

	return <div ref={slotRef} className="h-full w-full" />;
}

export function StreamVideoBuffering() {
	const buffering = useSyncExternalStore(subscribeBuffering, isBuffering);

	if (!buffering) return null;

	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
			<div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
		</div>
	);
}
