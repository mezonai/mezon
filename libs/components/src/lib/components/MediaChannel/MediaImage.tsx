import { useCdnUrlSigner } from '@mezon/core';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useEffect, useState } from 'react';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];

const isVideoUrl = (url?: string) => {
	const path = url?.split('?')[0].toLowerCase() ?? '';
	return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
};

interface ImgProxyOptions {
	width?: number;
	height?: number;
	resizeType?: 'fit' | 'fill' | 'auto';
}

interface MediaImageProps {
	src: string | undefined;
	alt?: string;
	className?: string;
	loading?: 'lazy' | 'eager';
	imgProxyOptions?: ImgProxyOptions;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function MediaImage({ src, alt = '', className = '', loading = 'lazy', imgProxyOptions, onClick }: MediaImageProps) {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const { signCdnUrl, isAwaitingSignature } = useCdnUrlSigner([src]);
	const signedSrc = signCdnUrl(src);
	const isVideo = isVideoUrl(src);
	const processedSrc = signedSrc && imgProxyOptions && !isVideo ? (createImgproxyUrl(signedSrc, imgProxyOptions) as string) : signedSrc;
	const handleLoaded = () => setIsLoading(false);
	const handleError = () => {
		setHasError(true);
		setIsLoading(false);
	};

	useEffect(() => {
		setHasError(false);
	}, [processedSrc]);

	if (isAwaitingSignature(src)) {
		return (
			<div className={`relative dark:bg-skeleton-dark bg-skeleton-white ${className} overflow-hidden`}>
				<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent dark:via-white/10 via-black/5 to-transparent" />
			</div>
		);
	}

	if (!processedSrc || hasError) {
		return (
			<div className={`flex items-center justify-center dark:bg-skeleton-dark bg-skeleton-white ${className}`}>
				<MezonIcon icon={MzIcons20.mzFileImage} className="text-contentTertiary opacity-40" />
			</div>
		);
	}

	return (
		<div className={`relative ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
			{isLoading && (
				<div className={`absolute inset-0 dark:bg-skeleton-dark bg-skeleton-white ${className} overflow-hidden`}>
					<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent dark:via-white/10 via-black/5 to-transparent" />
				</div>
			)}
			{isVideo ? (
				<>
					<video
						src={processedSrc}
						className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
						muted
						playsInline
						preload="metadata"
						onLoadedMetadata={handleLoaded}
						onError={handleError}
					/>
					{!isLoading && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<MezonIcon icon={MzIcons20.mzPlay} className="text-white drop-shadow-lg" />
						</div>
					)}
				</>
			) : (
				<img
					src={processedSrc}
					alt={alt}
					className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
					loading={loading}
					onLoad={handleLoaded}
					onError={handleError}
				/>
			)}
		</div>
	);
}
