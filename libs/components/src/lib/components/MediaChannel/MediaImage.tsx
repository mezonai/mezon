import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useState } from 'react';

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

	const processedSrc = src && imgProxyOptions ? (createImgproxyUrl(src, imgProxyOptions) as string) : src;

	if (!processedSrc || hasError) {
		return (
			<div className={`flex items-center justify-center dark:bg-skeleton-dark bg-skeleton-white ${className}`}>
				<Icons.ImageThumbnail defaultSize="w-10 h-10" className="text-contentTertiary opacity-40" />
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
			<img
				src={processedSrc}
				alt={alt}
				className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
				loading={loading}
				onLoad={() => setIsLoading(false)}
				onError={() => {
					setHasError(true);
					setIsLoading(false);
				}}
			/>
		</div>
	);
}
