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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';

let lastSentUrl: string | null = null;

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

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const isRecentlySent = !!(photo?.url && photo.url === lastSentUrl);
	const shouldLoad = canAutoLoad && (isSending || isIntersecting || isRecentlySent);

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

	const shouldRenderSkeleton = !shouldLoad && !isSending;

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

	return (
		<div
			id={id}
			ref={ref}
			className={`relative max-w-full ${componentClassName}`}
			style={style}
			onClick={() => {
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
				/>
			)}
			{!isSending && shouldRenderSkeleton && (
				<div
					style={{ width: displayWidth, height: displayHeight }}
					className="max-w-full max-h-full absolute bottom-0 left-0 rounded-md bg-[#0000001c] animate-pulse"
				/>
			)}
			{isProtected && <span className="protector" />}
			{isSending && (
				<div
					style={{ width: displayWidth, height: displayHeight }}
					className={`${!photo.thumbnail?.dataUri ? 'bg-[#0000001c]' : ''} max-w-full max-h-full absolute bottom-0 left-0 flex items-center justify-center bg-muted/30 backdrop-blur-[2px] rounded-md z-[3]`}
					aria-hidden="true"
				></div>
			)}
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
};

const PhotoImage = React.memo(({ url, width, height, resizeType, displayWidth, isGif, isProtected, onContextMenu }: PhotoImageProps) => {
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
	}, []);

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
			className={`max-w-full max-h-full w-full h-full block ${isGif ? 'object-contain' : 'object-cover'} absolute bottom-0 left-0 z-[1] rounded overflow-hidden cursor-pointer`}
			alt=""
			style={{ width: displayWidth }}
			draggable={!isProtected}
			onError={handleError}
		/>
	);
});

export default Photo;
