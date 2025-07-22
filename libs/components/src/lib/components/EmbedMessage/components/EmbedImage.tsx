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

	return (
		<div className="mt-2 rounded-lg overflow-hidden">
			<img
				src={url}
				style={{ width: width || 'auto', height: height || 'auto' }}
				alt=""
				className="w-full h-auto max-w-full cursor-pointer"
				onClick={showPreview}
			/>
		</div>
	);
}
