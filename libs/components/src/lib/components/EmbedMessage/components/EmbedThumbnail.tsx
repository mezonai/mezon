import { createImgproxyUrl } from '@mezon/utils';
import { useModal } from 'react-modal-hook';
import { ImagePreview } from '../../ImagePreview';

interface ThumbnailProps {
	url: string;
}

export function EmbedThumbnail({ url }: ThumbnailProps) {
	const [showPreview, closePreview] = useModal(() => {
		return <ImagePreview imageUrl={url} onClose={closePreview} />;
	});

	return (
		<div className="relative top-4 w-16 h-16 rounded overflow-hidden">
			<img src={createImgproxyUrl(url)} alt="Thumbnail" className="w-full h-full object-cover cursor-pointer" onClick={showPreview} />
		</div>
	);
}
