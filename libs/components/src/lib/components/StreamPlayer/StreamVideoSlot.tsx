import { useLayoutEffect, useRef } from 'react';

let video: HTMLVideoElement | undefined;
let parking: HTMLDivElement | undefined;

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

	return <div ref={slotRef} className="w-full h-full" />;
}
