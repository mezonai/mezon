import {
	ApiMediaExtendedPreview,
	ApiPhoto,
	buildClassName,
	calculateMediaDimensions,
	createImgproxyUrl,
	IMediaDimensions,
	MIN_MEDIA_HEIGHT,
	ObserveFn,
	SHOW_POSITION,
	useAppLayout,
	useBlurredMediaThumbRef,
	useIsIntersecting,
	useMediaTransition,
	useMediaWithLoadProgress
} from '@mezon/utils';
import { useCallback, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';

export type OwnProps<T> = {
	id?: string;
	photo: ApiPhoto | ApiMediaExtendedPreview;
	isInWebPage?: boolean;
	messageText?: string;
	isOwn?: boolean;
	observeIntersection?: ObserveFn;
	noAvatars?: boolean;
	canAutoLoad?: boolean;
	isInSelectMode?: boolean;
	isSelected?: boolean;
	uploadProgress?: number;
	forcedWidth?: number;
	size?: 'inline' | 'pictogram';
	shouldAffectAppendix?: boolean;
	dimensions?: IMediaDimensions & { isSmall?: boolean };
	asForwarded?: boolean;
	nonInteractive?: boolean;
	isDownloading?: boolean;
	isProtected?: boolean;
	className?: string;
	clickArg?: T;
	onClick?: (url?: string) => void;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	onCancelUpload?: (arg: T) => void;
};

const Photo = <T,>({
	id,
	photo,
	messageText,
	isOwn,
	observeIntersection,
	noAvatars,
	forcedWidth,
	size = 'inline',
	dimensions,
	asForwarded,
	nonInteractive,
	isProtected,
	isInWebPage,
	clickArg,
	className,
	onClick,
	onContextMenu
}: OwnProps<T>) => {
	const ref = useRef<HTMLDivElement>(null);

	const localBlobUrl = (photo as any).blobUrl;

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const { setImageURL, setPositionShow } = useMessageContextMenu();

	const { isMobile } = useAppLayout();

	const { width, height, isSmall } =
		dimensions ||
		calculateMediaDimensions({
			media: photo,
			isOwn,
			asForwarded,
			noAvatars,
			isMobile,
			messageText,
			isInWebPage
		});

	const { mediaData, loadProgress } = useMediaWithLoadProgress(
		createImgproxyUrl(photo.url ?? '', { width: width, height: height, resizeType: 'fit' }),
		!isIntersecting
	);
	const fullMediaData = localBlobUrl || mediaData;

	const withBlurredBackground = Boolean(forcedWidth);
	const [withThumb] = useState(!fullMediaData);
	const noThumb = false;

	const thumbRef = useBlurredMediaThumbRef(photo, false);
	useMediaTransition(!noThumb, { ref: thumbRef });
	const blurredBackgroundRef = useBlurredMediaThumbRef(photo, !withBlurredBackground);

	const componentClassName = buildClassName(
		'media-inner',
		!nonInteractive && 'interactive',
		isSmall && 'small-image',
		(width === height || size === 'pictogram') && 'square-image',
		height < MIN_MEDIA_HEIGHT && 'fix-min-height',
		className
	);

	const style =
		size === 'inline'
			? {
					height: height ? `${height}px` : 150,
					width: width ? `${width}px` : 'auto',
					...(dimensions && {
						position: 'absolute' as const,
						left: `${dimensions.x}px`,
						top: `${dimensions.y}px`
					})
				}
			: undefined;

	const handleContextMenu = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
		setImageURL(photo?.url ?? '');
		setPositionShow(SHOW_POSITION.NONE);
		if (typeof onContextMenu === 'function') {
			onContextMenu(e || {});
		}
	}, []);

	return (
		<div
			id={id}
			ref={ref}
			className={'relative ' + componentClassName}
			style={style}
			onClick={() => {
				onClick?.(photo?.url);
			}}
		>
			{withBlurredBackground && <canvas ref={blurredBackgroundRef} className="thumbnail blurred-bg" />}
			{fullMediaData && (
				<img
					onContextMenu={handleContextMenu}
					src={fullMediaData}
					className={`w-full h-full block object-cover absolute bottom-0 left-0 z-[1] rounded overflow-hidden cursor-pointer ${withBlurredBackground && 'with-blurred-bg'}`}
					alt=""
					style={{ width: forcedWidth || 'auto' }}
					draggable={!isProtected}
				/>
			)}
			{withThumb && <canvas ref={thumbRef} className="w-full h-full block object-cover absolute bottom-0 left-0" />}
			{isProtected && <span className="protector" />}
		</div>
	);
};

export default Photo;
