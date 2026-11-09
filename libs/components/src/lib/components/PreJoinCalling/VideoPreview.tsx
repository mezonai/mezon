import { MezonIcon, MzIcons16, MzIcons24, MzIcons48 } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
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

export function VisualEffectsIcon({ size = 24, className }: { size?: 16 | 24; className?: string }) {
	return <MezonIcon icon={size === 16 ? MzIcons16.mzSparkles : MzIcons24.mzSparkles} className={className} />;
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
							<img
								src={createImgproxyUrl(avatarExist, { width: 100, height: 100, resizeType: 'fill-down' })}
								alt="Avatar"
								className="w-full h-full object-cover"
							/>
						) : (
							<MezonIcon icon={MzIcons48.mzUser} className="text-white" />
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
					<VisualEffectsIcon className="text-white" />
				</button>
			)}
			{children}
		</div>
	);
});

export { VideoPreview };
