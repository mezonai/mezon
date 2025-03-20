import { AlbumRectPart, IAlbum, IAlbumLayout, ObserveFn } from '@mezon/utils';
import { FC } from 'react';
import Photo from './Photo';

type OwnProps = {
	album: IAlbum;
	observeIntersection?: ObserveFn;
	hasCustomAppendix?: boolean;
	isOwn?: boolean;
	isProtected?: boolean;
	albumLayout: IAlbumLayout;
	onClick?: (url?: string) => void;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
};

const Album: FC<OwnProps> = ({ album, observeIntersection, hasCustomAppendix, isOwn, isProtected, albumLayout, onClick, onContextMenu }) => {
	const mediaCount = (album as any)?.length;

	function renderAlbumMessage(attachment: any, index: number) {
		const video = false;
		const { dimensions, sides } = albumLayout.layout[index];

		if (attachment) {
			const shouldAffectAppendix =
				hasCustomAppendix &&
				// eslint-disable-next-line no-bitwise
				(isOwn ? index === mediaCount - 1 : Boolean(sides & AlbumRectPart.Left && sides & AlbumRectPart.Bottom));

			return (
				<Photo
					id={`album-media-${index}`}
					key={index}
					photo={attachment}
					isOwn={isOwn}
					observeIntersection={observeIntersection}
					shouldAffectAppendix={shouldAffectAppendix}
					dimensions={dimensions}
					isProtected={isProtected}
					onClick={onClick}
					onContextMenu={onContextMenu}
				/>
			);
		} else if (video) {
			return null;
		}

		return undefined;
	}

	const { width: containerWidth, height: containerHeight } = albumLayout.containerStyle;

	return (
		<div className="relative overflow-hidden" style={{ width: containerWidth, height: containerHeight }}>
			{(album as any).map(renderAlbumMessage)}
		</div>
	);
};

export default Album;
