import type { ApiMediaExtendedPreview, ApiPhoto, IMediaDimensions, ObserveFn } from '@mezon/utils';
import {
	MIN_MEDIA_HEIGHT,
	SHOW_POSITION,
	buildClassName,
	calculateMediaDimensions,
	createImgproxyUrl,
	getMediaFormat,
	getMediaTransferState,
	getPhotoMediaHash,
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
	isInSearchMessage?: boolean;
	isSending?: boolean;
	isMobile?: boolean;
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
	onContextMenu,
	isInSearchMessage,
	isSending,
	isMobile
}: OwnProps<T>) => {
	const ref = useRef<HTMLDivElement>(null);
	const isPaidPreview = photo.mediaType === 'extendedMediaPreview';
	const localBlobUrl = (photo as any).blobUrl;

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const { setImageURL, setPositionShow } = useMessageContextMenu();

	const [isLoadAllowed, setIsLoadAllowed] = useState(canAutoLoad);
	const shouldLoad = isLoadAllowed && isIntersecting;

	const { width: realWidth, height: realHeight } = photo;
	const hasZeroDimension = !realWidth || !realHeight;

	const { width, height, isSmall } = hasZeroDimension
		? { width: 0, height: 150, isSmall: false }
		: dimensions ||
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
		createImgproxyUrl(photo.url ?? '', { width, height, resizeType: 'fit' }),
		!isIntersecting
	);
	const fullMediaData = localBlobUrl || mediaData;

	const withBlurredBackground = Boolean(forcedWidth);
	const [withThumb] = useState(!fullMediaData);
	const noThumb = Boolean(fullMediaData);
	const thumbRef = useBlurredMediaThumbRef(photo, false);
	useMediaTransition(!noThumb, { ref: thumbRef, className: 'fast' });
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
		className: 'fast',
		withShouldRender: true,
		isSending
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
					width: isInSearchMessage ? '' : width ? `${width}px` : 'auto',
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
			className={`relative max-w-full ${componentClassName}`}
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
					className={`max-w-full max-h-full w-full h-full block object-cover absolute bottom-0 left-0 z-[1] rounded overflow-hidden cursor-pointer ${withBlurredBackground && 'with-blurred-bg'}`}
					alt=""
					style={{ width: forcedWidth || width || 'auto' }}
					draggable={!isProtected}
				/>
			)}
			{!isSending && withThumb && (
				<canvas
					style={{ width, height }}
					ref={thumbRef}
					className="max-w-full max-h-full block object-cover absolute bottom-0 left-0 rounded overflow-hidden will-change-opacity"
				/>
			)}
			{isProtected && <span className="protector" />}
			{((shouldRenderSpinner && !shouldRenderDownloadButton) || isSending) && (
				<div
					ref={spinnerRef as any}
					style={{ width, height }}
					className={`${!photo.thumbnail?.dataUri ? 'bg-[#0000001c]' : ''} max-w-full max-h-full absolute bottom-0 left-0 flex items-center justify-center bg-muted/30 backdrop-blur-[2px] rounded-md z-[3]`}
					aria-hidden="true"
				></div>
			)}
		</div>
	);
};

export default Photo;
