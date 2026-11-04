import { useCdnUrlSigner } from '@mezon/core';
import type { ChannelTimelineAttachment } from '@mezon/store';
import { Icons, MezonIcon, MzIcons16, MzIcons20, MzIcons48 } from '@mezon/ui';
import { createImgproxyUrl, handleSaveImage } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVideoSource } from '../MessageWithUser/useVideoSource';

export const MAX_SCALE_IMAGE = 5;

interface MediaImageModalProps {
	attachments: ChannelTimelineAttachment[];
	initialIndex: number;
	onClose: () => void;
}

export function MediaImageModal({ attachments, initialIndex, onClose }: MediaImageModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const [rotate, setRotate] = useState(0);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const [showList, setShowList] = useState(true);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMediaLoading, setIsMediaLoading] = useState(true);
	const [showSkeleton, setShowSkeleton] = useState(false);
	const skeletonTimerRef = useRef<NodeJS.Timeout | null>(null);
	const thumbnailListRef = useRef<HTMLDivElement>(null);

	const currentAttachment = attachments[currentIndex];
	const cdnUrls = useMemo(() => attachments.flatMap((att) => [att.file_url, att.thumbnail]), [attachments]);
	const { signCdnUrl } = useCdnUrlSigner(cdnUrls);
	const currentUrl = signCdnUrl(currentAttachment?.file_url || '');

	const isVideo = useMemo(() => {
		if (currentAttachment?.file_type?.startsWith('video/')) {
			return true;
		}
		if (currentUrl) {
			const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
			const lowerUrl = currentUrl.toLowerCase();
			if (lowerUrl.includes('.avif')) return false;
			return videoExtensions.some((ext) => lowerUrl.includes(ext));
		}
		return false;
	}, [currentAttachment?.file_type, currentUrl]);
	const { failed: isVideoFailed, handleError: handleVideoError } = useVideoSource(videoRef, currentUrl, isVideo);

	const resetView = useCallback(() => {
		setScale(1);
		setRotate(0);
		setPosition({ x: 0, y: 0 });
		setIsPlaying(false);
		if (videoRef.current) {
			videoRef.current.pause();
			videoRef.current.currentTime = 0;
		}
	}, []);

	const handleMediaLoaded = useCallback(() => {
		if (skeletonTimerRef.current) {
			clearTimeout(skeletonTimerRef.current);
			skeletonTimerRef.current = null;
		}
		setShowSkeleton(false);
		setIsMediaLoading(false);
	}, []);

	useEffect(() => {
		if (isVideoFailed) handleMediaLoaded();
	}, [isVideoFailed, handleMediaLoaded]);

	useEffect(() => {
		setIsMediaLoading(true);
		setShowSkeleton(false);
		if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
		skeletonTimerRef.current = setTimeout(() => setShowSkeleton(true), 300);
		return () => {
			if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
		};
	}, [currentIndex]);

	useEffect(() => {
		if (modalRef.current) modalRef.current.focus();
	}, []);

	const selectImage = useCallback(
		(index: number) => {
			if (index < 0 || index >= attachments.length || index === currentIndex) return;
			resetView();
			setCurrentIndex(index);
		},
		[attachments.length, currentIndex, resetView]
	);

	const selectNext = useCallback(() => {
		if (currentIndex < attachments.length - 1) selectImage(currentIndex + 1);
	}, [currentIndex, attachments.length, selectImage]);

	const selectPrevious = useCallback(() => {
		if (currentIndex > 0) selectImage(currentIndex - 1);
	}, [currentIndex, selectImage]);

	const toggleVideoPlayback = useCallback(() => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause();
			} else {
				videoRef.current.play().catch((error) => {
					console.error(error);
				});
			}
			setIsPlaying(!isPlaying);
		}
	}, [isPlaying]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.repeat) return;
			if (event.key === 'Escape') {
				onClose();
				return;
			}
			if (event.key === ' ' && isVideo) {
				event.preventDefault();
				toggleVideoPlayback();
				return;
			}
			if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
				selectNext();
			}
			if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
				selectPrevious();
			}
		},
		[isVideo, toggleVideoPlayback, selectNext, selectPrevious, onClose]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		const el = thumbnailListRef.current;
		if (!el) return;
		const activeThumb = el.querySelector(`[data-index="${currentIndex}"]`);
		if (activeThumb) {
			activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [currentIndex]);

	const handleWheel = useCallback(
		(event: React.WheelEvent) => {
			setScale((prev) => {
				const next = event.deltaY > 0 ? Math.max(1, prev - 0.05) : Math.min(MAX_SCALE_IMAGE, prev + 0.05);
				return next;
			});
			if (scale === 1) setPosition({ x: 0, y: 0 });
		},
		[scale]
	);

	const handleMouseDown = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			setDragging(true);
			setDragStart({ x: event.clientX - position.x, y: event.clientY - position.y });
		},
		[position]
	);

	const handleMouseMove = useCallback(
		(event: React.MouseEvent) => {
			if (dragging && scale !== 1) {
				setPosition({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
			}
		},
		[dragging, scale, dragStart]
	);

	const handleMouseUp = useCallback((event: React.MouseEvent) => {
		event.stopPropagation();
		setDragging(false);
	}, []);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleRotate = useCallback(
		(direction: 'LEFT' | 'RIGHT') => {
			setRotate(direction === 'LEFT' ? rotate - 90 : rotate + 90);
		},
		[rotate]
	);

	const handleScaleUp = useCallback(() => {
		if (scale < MAX_SCALE_IMAGE) setScale(scale + 1.5);
	}, [scale]);

	const handleScaleReset = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleDownload = useCallback(async () => {
		await handleSaveImage(currentUrl);
	}, [currentUrl]);

	const stopPropagation = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="justify-center items-center flex flex-col fixed z-50 inset-0 outline-none focus:outline-none bg-black text-colorTextLightMode select-none"
		>
			<div className="flex justify-center items-center bg-[#2e2e2e] w-full h-[30px] relative">
				<div className="text-textDarkTheme text-sm">
					{currentIndex + 1} / {attachments.length}
				</div>
				<div onClick={onClose} className="w-4 absolute right-2 top-2 cursor-pointer">
					<MezonIcon icon={MzIcons16.mzClose} className="text-white" />
				</div>
			</div>

			<div className="flex w-full h-[calc(100vh_-_30px_-_56px)] bg-[#141414] max-[480px]:flex-col">
				<div className="flex-1 flex justify-center items-center px-5 py-3 overflow-hidden h-full w-full relative" onClick={onClose}>
					{showSkeleton && isMediaLoading && (
						<div
							role="status"
							className="absolute flex items-center justify-center rounded-[10px] bg-[#2e2e2e] animate-pulse"
							style={{
								width: currentAttachment?.width ? `${currentAttachment.width}px` : '60%',
								height: currentAttachment?.height ? `${currentAttachment.height}px` : '60%',
								maxWidth: '100%',
								maxHeight: '100%'
							}}
						>
							<MezonIcon icon={MzIcons48.mzImage} className="w-16 h-16 text-[#4a4a4a]" />
						</div>
					)}

					{isVideo ? (
						<video
							ref={videoRef}
							className={`max-h-full max-w-full object-scale-down rounded-[10px] cursor-pointer transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`}
							controls
							onClick={(e) => {
								e.stopPropagation();
								toggleVideoPlayback();
							}}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							onLoadedData={handleMediaLoaded}
							onError={handleVideoError}
						/>
					) : (
						<img
							src={createImgproxyUrl(currentUrl, { width: 0, height: 0, resizeType: 'force' })}
							alt=""
							className={`max-h-full object-scale-down rounded-[10px] cursor-default transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'} ${rotate % 180 === 90 ? 'w-[calc(100vh_-_30px_-_56px)] h-auto' : 'h-auto'}`}
							onDragStart={handleDrag}
							onWheel={handleWheel}
							onMouseUp={handleMouseUp}
							onMouseMove={handleMouseMove}
							onMouseDown={handleMouseDown}
							onMouseLeave={handleMouseUp}
							style={{
								transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
								transition: dragging ? '' : 'transform 0.2s ease',
								rotate: `${rotate}deg`
							}}
							onClick={stopPropagation}
							onLoad={handleMediaLoaded}
							onError={handleMediaLoaded}
						/>
					)}

					{attachments.length > 1 && (
						<div
							className={`h-full w-12 absolute flex flex-col right-0 gap-2 justify-center ${scale === 1 && !isVideo ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
							onClick={stopPropagation}
						>
							<div
								className="rounded-full rotate-180 bg-bgTertiary cursor-pointer w-10 aspect-square flex items-center justify-center text-white"
								onClick={selectPrevious}
							>
								<MezonIcon icon={MzIcons20.mzChevronDown} />
							</div>
							<div
								className="rounded-full bg-bgTertiary cursor-pointer w-10 aspect-square flex items-center justify-center text-white"
								onClick={selectNext}
							>
								<MezonIcon icon={MzIcons20.mzChevronDown} />
							</div>
						</div>
					)}
				</div>

				{showList && attachments.length > 1 && (
					<div ref={thumbnailListRef} className="w-[100px] overflow-y-auto thread-scroll bg-[#1a1a1a]">
						{attachments.map((att, idx) => {
							const isSelected = idx === currentIndex;
							const thumbUrl = signCdnUrl(att.thumbnail || att.file_url || '');
							const attIsVideo =
								att.file_type?.startsWith('video/') ||
								['.mp4', '.webm', '.ogg', '.mov'].some((ext) => (att.file_url || '').toLowerCase().includes(ext));

							return (
								<div key={`${att.id}-${idx}`} data-index={idx} className="p-1">
									<div
										className={`mz-hover rounded-md cursor-pointer overflow-hidden border-2 ${isSelected ? 'border-white' : 'border-transparent'}`}
										onClick={() => selectImage(idx)}
									>
										{attIsVideo ? (
											<div className="relative">
												<video
													src={thumbUrl}
													className={`w-full h-[80px] object-cover ${!isSelected ? 'brightness-[0.3]' : ''}`}
													muted
													playsInline
													preload="metadata"
												/>
												<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
													<MezonIcon icon={MzIcons20.mzPlay} className="text-white drop-shadow-lg" />
												</div>
											</div>
										) : (
											<img
												src={createImgproxyUrl(thumbUrl, { width: 200, height: 200, resizeType: 'fill' })}
												alt=""
												className={`w-full h-[80px] object-cover ${!isSelected ? 'brightness-[0.3]' : ''}`}
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="h-14 flex px-4 w-full items-center justify-between bg-[#2e2e2e]">
				<div className="flex items-center flex-1">
					<span className="text-sm text-textDarkTheme truncate max-w-[200px]">{currentAttachment?.file_name || ''}</span>
				</div>
				<div className="gap-3 flex-1 text-white flex items-center justify-center">
					<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={handleDownload}>
						<MezonIcon icon={MzIcons20.mzDownload} />
					</div>
					{!isVideo && (
						<>
							<div>
								<Icons.StraightLineIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleRotate('LEFT')}>
								<MezonIcon icon={MzIcons20.mzRotateLeft} />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleRotate('RIGHT')}>
								<MezonIcon icon={MzIcons20.mzRotateRight} />
							</div>
							<div>
								<Icons.StraightLineIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={handleScaleUp}>
								<MezonIcon icon={MzIcons20.mzZoomIn} />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={handleScaleReset}>
								<MezonIcon icon={MzIcons20.mzAspectRatio} />
							</div>
						</>
					)}
				</div>
				<div className="flex justify-end flex-1">
					{attachments.length > 1 && (
						<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => setShowList(!showList)}>
							<MezonIcon icon={MzIcons20.mzSidebar} className="text-white" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
