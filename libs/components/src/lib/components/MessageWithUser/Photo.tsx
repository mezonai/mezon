import type { ApiMediaExtendedPreview, ApiPhoto, IMediaDimensions, ObserveFn } from '@mezon/utils';
import {
	EMimeTypes,
	MIN_MEDIA_HEIGHT,
	SHOW_POSITION,
	buildClassName,
	calculateMediaDimensions,
	createImgproxyUrl,
	useIsIntersecting
} from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';
import { AttachmentSendingIndicator } from './AttachmentSendingIndicator';

let lastSentUrl: string | null = null;

/**
 * In the layout flow on purpose. A locally picked file usually has no measured
 * width, and the wrapper is `width: auto` — so with every child positioned
 * absolutely the box collapses to zero and the row renders as nothing at all.
 * This one is what gives it a size while there is no image to show.
 */
function ImageAttachmentSkeleton({ width, height }: { width: number; height: number }) {
	return <div style={{ width, height }} className="max-w-full rounded-md bg-bgLightSecondary dark:bg-bgSecondary" />;
}

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
	onClick?: (url?: string, attachmentId?: string) => void;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	onCancelUpload?: (arg: T) => void;
	isInSearchMessage?: boolean;
	isSending?: boolean;
	isPresignPending?: boolean;
	/** Object url for the file being uploaded; shown until the CDN copy exists. */
	localSource?: string;
	loadWhenUnpending?: boolean;
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
	isPresignPending = false,
	localSource,
	loadWhenUnpending = false,
	isMobile
}: OwnProps<T>) => {
	const ref = useRef<HTMLDivElement>(null);

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const isRecentlySent = !!(photo?.url && photo.url === lastSentUrl);
	const isUploading = isSending || isPresignPending;
	// The sender already holds the bytes, so their row never asks the proxy for a
	// rendition of them. That request is the one thing that can go wrong at the
	// worst moment: it lands seconds after the object is written, and a proxy
	// timeout there is cached as a failure for a week — for everyone, triggered by
	// the one person who did not need the request at all.
	//
	// The cost is that this row holds the file in memory until the message leaves
	// the store, and that a broken object stays invisible to its sender until they
	// reload. A reload has no blob and takes the ordinary path.
	const [localFailed, setLocalFailed] = useState(false);
	const showLocalPreview = !!localSource && !localFailed;
	const onLocalPreviewError = useCallback(() => setLocalFailed(true), []);

	const shouldLoad = canAutoLoad && !isPresignPending && !showLocalPreview && (isSending || isIntersecting || isRecentlySent || loadWhenUnpending);

	if (isSending && photo?.url) {
		lastSentUrl = photo.url;
	}

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

	const resizeType = (() => {
		if (hasZeroDimension || !width || !height) {
			return 'fill';
		}

		if (!realWidth || !realHeight) {
			return 'fill';
		}

		if (realWidth < width || realHeight < height) {
			return 'fill-down';
		}

		return 'fill';
	})();

	const isNonInteractive = nonInteractive || isPresignPending;

	const componentClassName = buildClassName(
		'media-inner',
		!isNonInteractive && 'interactive',
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

	const displayWidth = forcedWidth || width || 150;
	const displayHeight = height || 150;

	const isGif = useMemo(() => {
		return photo?.url?.endsWith('.gif') || photo?.url?.includes('.gif');
	}, [photo?.url]);

	const thumbnailDataUri = photo.thumbnail?.dataUri;
	const hasThumbnail = !!thumbnailDataUri;
	// `isPresignPending` alone leaves the upload-first paths open: an anonymous
	// send is never presign-pending, only sending, and the row already carries the
	// CDN url of an object that has not been written yet. Opening the viewer on it
	// asks the image proxy for that object and pins the failure in its cache for a
	// week. The desktop row gates on the same set of states.
	const canOpenViewer = !isUploading;

	// The proxied copy is absolutely positioned, so between "start loading" and
	// "decoded" there is nothing in the layout at all and the row goes blank for
	// the length of a network round trip. Hold the placeholder until something is
	// genuinely on screen — the local copy, the thumbnail, or the image itself.
	const [imagePainted, setImagePainted] = useState(false);
	const onImageSettled = useCallback(() => setImagePainted(true), []);
	useEffect(() => {
		setImagePainted(false);
	}, [photo?.url]);

	const somethingIsPainted = showLocalPreview || (isPresignPending && hasThumbnail) || (shouldLoad && imagePainted);

	return (
		<div
			id={id}
			ref={ref}
			className={`relative max-w-full ${componentClassName}`}
			style={style}
			onClick={() => {
				if (!canOpenViewer) return;
				if ((photo as ApiPhoto & { filetype?: string })?.filetype === EMimeTypes.sticker) return;
				onClick?.(photo?.url, id);
			}}
		>
			{shouldLoad && (
				<PhotoImage
					url={photo?.url ?? ''}
					width={width}
					height={height}
					resizeType={resizeType}
					displayWidth={displayWidth}
					isGif={isGif}
					isProtected={isProtected}
					onContextMenu={onContextMenu}
					isInSearchMessage={isInSearchMessage}
					onSettled={onImageSettled}
				/>
			)}
			{/* The sender's own copy, straight off disk: the CDN object is not there
			    yet, and requesting it early is what pins a 404 in the image proxy's
			    cache. In the layout flow, so it is also what gives the row a size. */}
			{showLocalPreview && (
				<img
					src={localSource}
					alt=""
					className="block max-w-full rounded object-cover"
					style={{ maxHeight: displayHeight, width: width || undefined }}
					onError={onLocalPreviewError}
				/>
			)}
			{isPresignPending && hasThumbnail && (
				<img
					src={thumbnailDataUri}
					alt=""
					className="max-w-full max-h-full w-full h-full block object-cover absolute bottom-0 left-0 z-[1] rounded overflow-hidden"
					style={{ width: displayWidth, height: displayHeight }}
				/>
			)}
			{!somethingIsPainted && <ImageAttachmentSkeleton width={displayWidth} height={displayHeight} />}
			{isUploading && <AttachmentSendingIndicator showLabel boxWidth={displayWidth} boxHeight={displayHeight} />}
			{isProtected && <span className="protector" />}
		</div>
	);
};

type PhotoImageProps = {
	url: string;
	width: number;
	height: number;
	resizeType: string;
	displayWidth: number;
	isGif?: boolean | string | null;
	isProtected?: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	isInSearchMessage?: boolean;
	/** Fires once the CDN copy is painted, or has failed for good. */
	onSettled?: () => void;
};

const PhotoImage = React.memo(
	({ url, width, height, resizeType, displayWidth, isGif, isProtected, onContextMenu, isInSearchMessage, onSettled }: PhotoImageProps) => {
		const { setImageURL, setPositionShow } = useMessageContextMenu();
		const [hasError, setHasError] = useState(false);

		const imgSrc = useMemo(() => {
			return createImgproxyUrl(url, { width, height, resizeType });
		}, [url, width, height, resizeType]);

		const handleContextMenu = useCallback(
			(e: React.MouseEvent<HTMLImageElement>) => {
				setImageURL(url);
				setPositionShow(SHOW_POSITION.NONE);
				onContextMenu?.(e);
			},
			[url, setImageURL, setPositionShow, onContextMenu]
		);

		const handleError = useCallback(() => {
			setHasError(true);
			onSettled?.();
		}, [onSettled]);

		const handleLoad = useCallback(() => {
			onSettled?.();
		}, [onSettled]);

		if (hasError) {
			return (
				<div
					className="max-w-full max-h-full w-full h-full flex items-center justify-center absolute bottom-0 left-0 z-[1] rounded overflow-hidden bg-bgSecondary"
					style={{ width: displayWidth, height: height || 150 }}
				>
					<svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
			);
		}

		return (
			<img
				onContextMenu={handleContextMenu}
				src={imgSrc}
				className={`max-w-full max-h-full w-full h-full block ${isGif || isInSearchMessage ? 'object-contain' : 'object-cover'} absolute bottom-0 left-0 z-[1] rounded overflow-hidden cursor-pointer`}
				alt=""
				style={{ width: displayWidth }}
				draggable={!isProtected}
				onError={handleError}
				onLoad={handleLoad}
			/>
		);
	}
);

export default Photo;
