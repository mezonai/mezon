import {
	ApiMediaExtendedPreview,
	ApiPhoto,
	buildClassName,
	calculateMediaDimensions,
	CUSTOM_APPENDIX_ATTRIBUTE,
	getMediaFormat,
	getMediaThumbUri,
	getMediaTransferState,
	getPhotoMediaHash,
	IMediaDimensions,
	MESSAGE_CONTENT_SELECTOR,
	MIN_MEDIA_HEIGHT,
	ObserveFn,
	useAppLayout,
	useBlurredMediaThumbRef,
	useFlag,
	useIsIntersecting,
	useLayoutEffectWithPrevDeps,
	useMediaTransition,
	useMediaWithLoadProgress,
	usePreviousDeprecated,
	useShowTransition
} from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

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
	onClick?: (arg: T, e: React.MouseEvent<HTMLElement>) => void;
	onCancelUpload?: (arg: T) => void;
};

// eslint-disable-next-line @typescript-eslint/comma-dangle
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
	// theme,
	isInWebPage,
	clickArg,
	className,
	onClick,
	onCancelUpload
}: OwnProps<T>) => {
	const ref = useRef<HTMLDivElement>(null);
	const isPaidPreview = photo.mediaType === 'extendedMediaPreview';

	const localBlobUrl = (photo as any).blobUrl;

	const isIntersecting = useIsIntersecting(ref, observeIntersection);

	const { isMobile } = useAppLayout();
	const [isLoadAllowed, setIsLoadAllowed] = useState(canAutoLoad);
	const shouldLoad = isLoadAllowed && isIntersecting;
	const { mediaData, loadProgress } = useMediaWithLoadProgress(photo.url, !shouldLoad);
	const fullMediaData = localBlobUrl || mediaData;

	const withBlurredBackground = Boolean(forcedWidth);
	const [withThumb] = useState(!fullMediaData);
	const noThumb = false;
	const thumbRef = useBlurredMediaThumbRef(photo, false);
	useMediaTransition(!noThumb, { ref: thumbRef });
	const blurredBackgroundRef = useBlurredMediaThumbRef(photo, !withBlurredBackground);
	const thumbDataUri = getMediaThumbUri(photo);

	const [isSpoilerShown, showSpoiler, hideSpoiler] = useFlag(isPaidPreview || photo.isSpoiler);

	useEffect(() => {
		if (isPaidPreview || photo.isSpoiler) {
			showSpoiler();
		} else {
			hideSpoiler();
		}
	}, [isPaidPreview, photo]);

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

	const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
		// if (isUploading) {
		// 	onCancelUpload?.(clickArg!);
		// 	return;
		// }

		if (!fullMediaData) {
			setIsLoadAllowed((isAllowed) => !isAllowed);
			return;
		}

		if (isSpoilerShown) {
			hideSpoiler();
			return;
		}

		onClick?.(clickArg!, e);
	}, []);

	useLayoutEffectWithPrevDeps(
		([prevShouldAffectAppendix]) => {
			if (!shouldAffectAppendix) {
				if (prevShouldAffectAppendix) {
					ref.current!.closest<HTMLDivElement>(MESSAGE_CONTENT_SELECTOR)!.removeAttribute(CUSTOM_APPENDIX_ATTRIBUTE);
				}
				return;
			}

			const contentEl = ref.current!.closest<HTMLDivElement>(MESSAGE_CONTENT_SELECTOR)!;
			if (fullMediaData) {
				const messageId = Number(contentEl.closest<HTMLDivElement>('.Message')!.dataset.messageId);
				// getCustomAppendixBg(fullMediaData, Boolean(isOwn), messageId, isSelected, theme).then((appendixBg) => {
				// 	requestMutation(() => {
				// 		contentEl.style.setProperty('--appendix-bg', appendixBg);
				// 		contentEl.setAttribute(CUSTOM_APPENDIX_ATTRIBUTE, '');
				// 	});
				// });
			} else {
				contentEl.classList.add('has-appendix-thumb');
			}
		},
		[shouldAffectAppendix, fullMediaData, isOwn, isInSelectMode, isSelected]
	);

	const { width, height, isSmall } = calculateMediaDimensions({
		media: photo,
		isOwn,
		asForwarded,
		noAvatars,
		isMobile,
		messageText,
		isInWebPage
	});

	const componentClassName = buildClassName(
		'media-inner',
		!isUploading && !nonInteractive && 'interactive',
		isSmall && 'small-image',
		(width === height || size === 'pictogram') && 'square-image',
		height < MIN_MEDIA_HEIGHT && 'fix-min-height',
		className
	);

	const dimensionsStyle = dimensions ? ` width: ${width}px; left: ${dimensions.x}px; top: ${dimensions.y}px;` : '';
	const style = size === 'inline' ? `height: ${height}px;${dimensionsStyle}` : undefined;

	return (
		<div id={id} ref={ref} className={'relative ' + componentClassName} style={{ height, width }} onClick={isUploading ? undefined : handleClick}>
			{withBlurredBackground && <canvas ref={blurredBackgroundRef} className="thumbnail blurred-bg" />}
			{fullMediaData && (
				<img
					src={fullMediaData}
					className={`w-full h-full block object-cover absolute bottom-0 left-0 z-10 ${withBlurredBackground && 'with-blurred-bg'}`}
					alt=""
					style={{ width: forcedWidth || undefined }}
					draggable={!isProtected}
				/>
			)}
			{withThumb && <canvas ref={thumbRef} className="w-full h-full block object-cover absolute bottom-0 left-0" />}
			{isProtected && <span className="protector" />}
			{shouldRenderSpinner && !shouldRenderDownloadButton && <div ref={spinnerRef as any}>spin</div>}
		</div>
	);
};

export default Photo;
