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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';

const loadedMediaUrls = new Map<string, boolean>();
const urlQueue: string[] = [];
const MAX_LOADED_CACHE = 500;

const rememberLoadedUrl = (url: string) => {
	if (loadedMediaUrls.has(url)) return;

	loadedMediaUrls.set(url, true);
	urlQueue.push(url);

	if (urlQueue.length > MAX_LOADED_CACHE) {
		const oldestUrl = urlQueue.shift();
		if (oldestUrl) {
			loadedMediaUrls.delete(oldestUrl);
		}
	}
};

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

	const { setImageURL, setPositionShow } = useMessageContextMenu();

	const shouldLoad = canAutoLoad && isIntersecting;

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

	const [fullMediaData, setFullMediaData] = useState<string | undefined>();

	useEffect(() => {
		if (!shouldLoad || !photo.url) {
			return;
		}

		const targetUrl = createImgproxyUrl(photo.url, { width, height, resizeType });
		const image = new Image();
		let canceled = false;

		if (loadedMediaUrls.has(targetUrl)) {
			setFullMediaData(targetUrl);
			return () => {
				canceled = true;
			};
		}

		setFullMediaData(undefined);

		image.onload = () => {
			if (!canceled) {
				setFullMediaData(targetUrl);
				rememberLoadedUrl(targetUrl);
			}
		};

		image.onerror = () => {
			if (!canceled) {
				setFullMediaData(undefined);
			}
		};

		image.src = targetUrl;

		return () => {
			canceled = true;
			image.onload = null;
			image.onerror = null;
		};
	}, [height, photo.url, resizeType, shouldLoad, width]);

	const shouldRenderSkeleton = !fullMediaData && !isSending;

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
				if ((photo as ApiPhoto & { filetype?: string })?.filetype === EMimeTypes.sticker) return;
				onClick?.(photo?.url, id);
			}}
		>
			{fullMediaData && (
				<img
					onContextMenu={handleContextMenu}
					src={fullMediaData}
					className={`max-w-full max-h-full w-full h-full block ${isGif ? 'object-contain' : 'object-cover'} absolute bottom-0 left-0 z-[1] rounded overflow-hidden cursor-pointer`}
					alt=""
					style={{ width: displayWidth }}
					draggable={!isProtected}
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

export default Photo;
