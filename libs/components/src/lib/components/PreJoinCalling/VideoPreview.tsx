import { Icons } from '@mezon/ui';
import type { ReactNode } from 'react';
import { memo, useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
	cameraOn: boolean;
	stream: MediaStream | null;
	canvas?: HTMLCanvasElement | null;
	avatarExist?: string;
	children?: ReactNode;
	onEffectClick?: () => void;
	isEffectActive?: boolean;
}

export function VisualEffectsIcon({ className = 'w-6 h-6', ...props }: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M19 13.5V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5" />
			<circle cx="11" cy="9.5" r="2" />
			<path d="M6.5 16.5a4.5 4.5 0 0 1 9 0" />
			<path
				d="M17.5 2.5c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5z"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

const VideoPreview = memo(({ cameraOn, stream, avatarExist, children, onEffectClick, isEffectActive }: VideoPreviewProps) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [aspectRatio, setAspectRatio] = useState<'video' | 'portrait'>('video');

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		video.srcObject = stream;
		if (stream && cameraOn) {
			video.play().catch(() => undefined);
		}

		const checkRatio = () => {
			if (video.videoWidth && video.videoHeight) {
				setAspectRatio(video.videoHeight > video.videoWidth ? 'portrait' : 'video');
			}
		};

		video.addEventListener('loadedmetadata', checkRatio);
		video.addEventListener('resize', checkRatio);
		checkRatio();

		return () => {
			video.removeEventListener('loadedmetadata', checkRatio);
			video.removeEventListener('resize', checkRatio);
		};
	}, [stream, cameraOn]);

	return (
		<div
			className={`w-full bg-zinc-900 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center border border-zinc-700/50 transition-all ${
				aspectRatio === 'portrait' ? 'aspect-[3/4] max-h-[60vh] max-w-sm mx-auto' : 'aspect-video'
			}`}
		>
			<video
				ref={videoRef}
				autoPlay
				playsInline
				muted
				className={`w-full h-full object-cover -scale-x-100 ${!cameraOn ? 'hidden' : 'block'}`}
			/>
			{!cameraOn && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden border border-zinc-600">
						{avatarExist ? (
							<img src={avatarExist} alt="Avatar" className="w-full h-full object-cover" />
						) : (
							<Icons.UserAvatarIcon className="w-12 h-12 text-white" />
						)}
					</div>
				</div>
			)}
			{onEffectClick && (
				<button
					type="button"
					onClick={onEffectClick}
					className={`absolute bottom-4 right-4 z-20 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 backdrop-blur-md shadow-lg ${
						isEffectActive
							? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-indigo-500/40 scale-105'
							: 'bg-black/40 hover:bg-black/60 text-white border border-white/70 hover:border-white hover:scale-105 active:scale-95'
					}`}
					title="Apply visual effects"
					aria-label="Apply visual effects"
				>
					<VisualEffectsIcon className="w-6 h-6 text-white" />
				</button>
			)}
			{children}
		</div>
	);
});

export { VideoPreview };
