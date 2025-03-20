import {
	ApiMediaExtendedPreview,
	ApiPhoto,
	buildClassName,
	calculateMediaDimensions,
	createImgproxyUrl,
	getMediaFormat,
	getMediaTransferState,
	getPhotoMediaHash,
	IMediaDimensions,
	MIN_MEDIA_HEIGHT,
	ObserveFn,
	SHOW_POSITION,
	useAppLayout,
	useBlurredMediaThumbRef,
	useIsIntersecting,
	useMediaTransition,
	useMediaWithLoadProgress,
	usePreviousDeprecated,
	useShowTransition
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
	canAutoLoad = true,
	isInSelectMode,
	isSelected,
	uploadProgress,
	forcedWidth,
	size = 'inline',
	dimensions,
	asForwarded,
	nonInteractive,
	shouldAffectAppendix,
	isDownloading,
	isProtected,
	isInWebPage,
	clickArg,
	className,
	onClick,
	onContextMenu
}: OwnProps<T>) => {
	const ref = useRef<HTMLDivElement>(null);
	const isPaidPreview = photo.mediaType === 'extendedMediaPreview';

	const localBlobUrl = (photo as any).blobUrl;

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const { setImageURL, setPositionShow } = useMessageContextMenu();

	const { isMobile } = useAppLayout();
	const [isLoadAllowed, setIsLoadAllowed] = useState(canAutoLoad);
	const shouldLoad = isLoadAllowed && isIntersecting;

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
	const noThumb = Boolean(fullMediaData);
	const thumbRef = useBlurredMediaThumbRef(photo, false);
	useMediaTransition(!noThumb, { ref: thumbRef });
	const blurredBackgroundRef = useBlurredMediaThumbRef(photo, !withBlurredBackground);

	const { loadProgress: downloadProgress } = useMediaWithLoadProgress(
		!isPaidPreview ? getPhotoMediaHash(photo, 'download') : undefined,
		!isDownloading,
		!isPaidPreview ? getMediaFormat(photo, 'download') : undefined
	);

	const { isUploading, isTransferring, transferProgress } = getMediaTransferState(
		uploadProgress || (isDownloading ? downloadProgress : loadProgress),
		shouldLoad && !fullMediaData,
		uploadProgress !== undefined
	);

	const wasLoadDisabled = usePreviousDeprecated(isLoadAllowed) === false;

	const { ref: spinnerRef, shouldRender: shouldRenderSpinner } = useShowTransition({
		isOpen: isTransferring,
		noMountTransition: wasLoadDisabled,
		className: 'slow',
		withShouldRender: true
	});

	const { ref: downloadButtonRef, shouldRender: shouldRenderDownloadButton } = useShowTransition({
		isOpen: !fullMediaData && !isLoadAllowed,
		withShouldRender: true
	});

	const componentClassName = buildClassName(
		'media-inner',
		!isUploading && !nonInteractive && 'interactive',
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

	const { width: realWidth, height: realHeight } = photo;
	let displayWidth, displayHeight;

	const originalAspectRatio = realWidth && realHeight ? realWidth / realHeight : 1;

	if (realWidth && realHeight) {
		if (originalAspectRatio > 1) {
			displayHeight = Math.min(height, realHeight);
			displayWidth = Math.round(displayHeight * originalAspectRatio);
			if (displayWidth > width) {
				displayWidth = width;
				displayHeight = Math.round(displayWidth / originalAspectRatio);
			}
		} else {
			displayWidth = Math.min(width, realWidth);
			displayHeight = Math.round(displayWidth / originalAspectRatio);
			if (displayHeight > height) {
				displayHeight = height;
				displayWidth = Math.round(displayHeight * originalAspectRatio);
			}
		}
	} else {
		if (width && height) {
			if (width / height > 1) {
				displayHeight = height;
				displayWidth = Math.min(width, Math.round(height * originalAspectRatio));
			} else {
				displayWidth = width;
				displayHeight = Math.min(height, Math.round(width / originalAspectRatio));
			}
		} else {
			displayWidth = width || 300;
			displayHeight = height || 300;
		}
	}

	displayWidth = Math.min(displayWidth, width || displayWidth);
	displayHeight = Math.min(displayHeight, height || displayHeight);

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
			{withThumb && (
				<canvas
					style={{ width: displayWidth, height: displayHeight }}
					ref={thumbRef}
					className="block object-cover absolute bottom-0 left-0 rounded overflow-hidden "
				/>
			)}
			{isProtected && <span className="protector" />}
			{shouldRenderSpinner && !shouldRenderDownloadButton && <div ref={spinnerRef as any}></div>}
		</div>
	);
};

export default Photo;
