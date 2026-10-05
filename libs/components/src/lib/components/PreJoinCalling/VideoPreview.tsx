import { Icons } from '@mezon/ui';
import type { ReactNode } from 'react';
import { memo, useEffect, useRef } from 'react';

interface VideoPreviewProps {
	cameraOn: boolean;
	stream: MediaStream | null;
	avatarExist?: string;
	children?: ReactNode;
}

const VideoPreview = memo(({ cameraOn, stream, avatarExist, children }: VideoPreviewProps) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
			if (stream && cameraOn) {
				videoRef.current.play().catch(() => undefined);
			}
		}
	}, [stream, cameraOn]);

	return (
		<div className="w-full aspect-video bg-zinc-900 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center border border-zinc-700/50">
			<video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : 'block'}`} />
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
			{children}
		</div>
	);
});

export { VideoPreview };
