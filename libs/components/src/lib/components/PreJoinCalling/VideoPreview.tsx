import { Icons } from '@mezon/ui';
import { memo, useEffect, useRef } from 'react';

interface VideoPreviewProps {
	cameraOn: boolean;
	stream: MediaStream | null;
}

const VideoPreview = memo(({ cameraOn, stream }: VideoPreviewProps) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	return (
		<div className="w-full aspect-video bg-zinc-900 rounded-lg mb-6 relative overflow-hidden">
			<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
			{!cameraOn && (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center">
						<Icons.UserAvatarIcon className="w-12 h-12 text-white" />
					</div>
				</div>
			)}
		</div>
	);
});

export { VideoPreview };
