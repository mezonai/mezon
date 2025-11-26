import type { ApiPhoto, IAlbum, IAlbumLayout, ObserveFn } from '@mezon/utils';
import { AlbumRectPart, generateAttachmentId } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { FC } from 'react';
import Photo from './Photo';

type OwnProps = {
	album: IAlbum;
	observeIntersection?: ObserveFn;
	hasCustomAppendix?: boolean;
	isOwn?: boolean;
	isProtected?: boolean;
	albumLayout: IAlbumLayout;
	onClick?: (url?: string, attachmentId?: string) => void;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	isInSearchMessage?: boolean;
	isSending?: boolean;
	isMobile?: boolean;
	messageId?: string;
	images?: ApiMessageAttachment[];
};

const Album: FC<OwnProps> = ({
	album,
	observeIntersection,
	hasCustomAppendix,
	isOwn,
	isProtected,
	albumLayout,
	onClick,
	onContextMenu,
	isInSearchMessage,
	isSending,
	isMobile,
	messageId,
	images
}) => {
	const mediaCount = (album as any)?.length;

	function renderAlbumMessage(attachment: any, index: number) {
		const video = false;
		const { dimensions, sides } = albumLayout.layout[index];

		if (attachment) {
			const shouldAffectAppendix =
				hasCustomAppendix &&
				// eslint-disable-next-line no-bitwise
				(isOwn ? index === mediaCount - 1 : Boolean(sides & AlbumRectPart.Left && sides & AlbumRectPart.Bottom));

			const photoProps = {
				mediaType: 'photo',
				id: `${index}`,
				url: attachment?.url,
				width: attachment?.width || 0,
				height: attachment?.height || 150
			} as ApiPhoto;

			attachment?.thumbnail &&
				(photoProps.thumbnail = {
					dataUri: attachment.thumbnail
				});

			const attachmentId = messageId && images?.[index] ? generateAttachmentId(images[index], messageId) : `album-media-${index}`;
			return (
				<Photo
					id={attachmentId}
					key={index}
					photo={photoProps}
					isOwn={isOwn}
					observeIntersection={observeIntersection}
					shouldAffectAppendix={shouldAffectAppendix}
					dimensions={dimensions}
					isProtected={isProtected}
					onClick={onClick}
					onContextMenu={onContextMenu}
					isSending={isSending}
				/>
			);
		} else if (video) {
			return null;
		}

		return undefined;
	}

	const { width: containerWidth, height: containerHeight } = albumLayout.containerStyle;

	return (
		<div className="relative overflow-hidden" style={{ width: isInSearchMessage ? '' : containerWidth, height: containerHeight }}>
			{(album as any).map(renderAlbumMessage)}
		</div>
	);
};

export default Album;
