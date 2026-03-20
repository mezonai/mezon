import type { CSSProperties } from 'react';
import { useModal } from 'react-modal-hook';
import { ImagePreview } from '../../ImagePreview';

interface EmbedImageProps {
	url: string;
	width?: number;
	height?: number;
}

export function EmbedImage({ url, width, height }: EmbedImageProps) {
	const [showPreview, closePreview] = useModal(() => {
		return <ImagePreview imageUrl={url} onClose={closePreview} />;
	});

	const hasAspect = typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0;

	const containerStyle: CSSProperties | undefined = hasAspect
		? { aspectRatio: `${width} / ${height}` }
		: width && width > 0
			? { maxWidth: width }
			: undefined;

	return (
		<div className="mt-2 rounded overflow-hidden max-w-full w-full" style={containerStyle}>
			<img
				src={url}
				alt=""
				className={
					hasAspect ? 'size-full max-w-full object-contain cursor-pointer' : 'w-full h-auto max-w-full object-contain cursor-pointer'
				}
				onClick={showPreview}
			/>
		</div>
	);
}
