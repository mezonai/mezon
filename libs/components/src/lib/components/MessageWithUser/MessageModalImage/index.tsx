import { useAppParams, useAttachments } from '@mezon/core';
import {
	attachmentActions,
	getStore,
	selectAllListAttachmentByChannel,
	selectAttachment,
	selectAttachmentPaginationByChannel,
	selectCurrentAttachmentShowImage,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
	selectCurrentClanId,
	selectDmChannelLabelById,
	selectMemberClanByUserId,
	selectMemberGroupByUserId,
	selectMessageIdAttachment,
	selectModeAttachment,
	selectModeResponsive,
	selectOpenModalAttachment,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ETypeLinkMedia, ModeResponsive, SHOW_POSITION, createImgproxyUrl, formatDateI18n, handleSaveImage } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import type { MessageContextMenuProps } from '../../ContextMenu';
import { useMessageContextMenu } from '../../ContextMenu';
import ListAttachment from './listAttachment';
export const MAX_SCALE_IMAGE = 5;

const MessageModalImage = () => {
	const { directId } = useAppParams();
	const [scale, setScale] = useState(1);
	const [rotate, setRotate] = useState(0);
	const modalRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const [showList, setShowList] = useState(true);
	const currentChannelId = useAppSelector(selectCurrentChannelId);
	const currentClanId = useAppSelector(selectCurrentClanId) ?? '';
	const attachments = useAppSelector((state) => selectAllListAttachmentByChannel(state, (directId ?? currentChannelId) as string));
	const paginationState = useAppSelector((state) => selectAttachmentPaginationByChannel(state, (directId ?? currentChannelId) as string));
	const { setOpenModalAttachment } = useAttachments();
	const openModalAttachment = useAppSelector(selectOpenModalAttachment);
	const attachment = useAppSelector(selectAttachment);
	const currentAttachment = useAppSelector(selectCurrentAttachmentShowImage);
	const [urlImg, setUrlImg] = useState(attachment);
	const [currentIndexAtt, setCurrentIndexAtt] = useState(-1);
	const { showMessageContextMenu, setPositionShow, setImageURL } = useMessageContextMenu();
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMediaLoading, setIsMediaLoading] = useState(true);
	const [showSkeleton, setShowSkeleton] = useState(false);
	const skeletonTimerRef = useRef<NodeJS.Timeout | null>(null);

	const isVideo = useMemo(() => {
		if (currentAttachment?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX)) {
			return true;
		}

		if (urlImg) {
			const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
			const lowerUrl = urlImg.toLowerCase();
			return videoExtensions.some((ext) => lowerUrl.includes(ext));
		}

		return false;
	}, [currentAttachment?.filetype, urlImg]);

	const mode = useAppSelector(selectModeAttachment);
	const messageId = useAppSelector(selectMessageIdAttachment);
	const dispatch = useAppDispatch();
	const handleShowList = () => {
		setShowList(!showList);
	};

	const handleLoadMoreAttachments = useCallback(
		async (direction: 'before' | 'after') => {
			const channelId = (directId ?? currentChannelId) as string;
			if (paginationState.isLoading || !channelId) {
				return;
			}

			if (direction === 'before' && !paginationState.hasMoreBefore) {
				return;
			}
			if (direction === 'after' && !paginationState.hasMoreAfter) {
				return;
			}

			dispatch(attachmentActions.setAttachmentLoading({ channelId, isLoading: true }));

			try {
				const state = getStore()?.getState();
				const currentAttachments = selectAllListAttachmentByChannel(state, channelId);
				const timestamp =
					direction === 'before'
						? currentAttachments?.[currentAttachments.length - 1]?.create_time_seconds
						: currentAttachments?.[0]?.create_time_seconds;
				const timestampNumber = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : undefined;

				const clanId = currentClanId === '0' ? '0' : currentClanId;

				let beforeParam: number | undefined;
				let afterParam: number | undefined;

				if (direction === 'before') {
					beforeParam = timestampNumber;
				} else {
					afterParam = timestampNumber;
				}

				await dispatch(
					attachmentActions.fetchChannelAttachments({
						clanId,
						channelId,
						limit: paginationState.limit,
						direction,
						...(beforeParam && { before: beforeParam }),
						...(afterParam && { after: afterParam }),
						noCache: true
					})
				);
			} catch (error) {
				console.error('Error loading more attachments:', error);
				dispatch(attachmentActions.setAttachmentLoading({ channelId, isLoading: false }));
			}
		},
		[
			paginationState.isLoading,
			paginationState.limit,
			paginationState.hasMoreBefore,
			paginationState.hasMoreAfter,
			currentChannelId,
			directId,
			currentClanId,
			dispatch
		]
	);

	const toggleVideoPlayback = useCallback(() => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause();
			} else {
				videoRef.current.play();
			}
			setIsPlaying(!isPlaying);
		}
	}, [isPlaying]);

	const handleMediaLoaded = useCallback(() => {
		if (skeletonTimerRef.current) {
			clearTimeout(skeletonTimerRef.current);
			skeletonTimerRef.current = null;
		}
		setShowSkeleton(false);
		setIsMediaLoading(false);
	}, []);

	useEffect(() => {
		if (!currentAttachment) return;

		setIsMediaLoading(true);
		setShowSkeleton(false);

		if (skeletonTimerRef.current) {
			clearTimeout(skeletonTimerRef.current);
		}

		skeletonTimerRef.current = setTimeout(() => {
			setShowSkeleton(true);
		}, 300);

		return () => {
			if (skeletonTimerRef.current) {
				clearTimeout(skeletonTimerRef.current);
			}
		};
	}, [currentAttachment]);

	useEffect(() => {
		setShowList(true);
		setScale(1);
		setRotate(0);
		setUrlImg(attachment);
		setIsPlaying(false);
		if (videoRef.current) {
			videoRef.current.pause();
			videoRef.current.currentTime = 0;
		}
		if (openModalAttachment && modalRef.current) {
			modalRef.current.focus();
		}
	}, [openModalAttachment, attachment]);

	useEffect(() => {
		if (attachments && attachments.length > 0 && currentAttachment?.id) {
			const indexImage = attachments.findIndex((img) => img.id === currentAttachment.id);
			setCurrentIndexAtt(indexImage);
		}
	}, [attachments, currentAttachment?.id]);

	const handleDrag = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleWheel = (event: any) => {
		const deltaY = event.deltaY;
		setScale((prevScale) => {
			const newScale = deltaY > 0 ? Math.max(1, prevScale - 0.05) : Math.min(5, prevScale + 0.05);
			return newScale;
		});
		if (scale === 1) {
			setPosition({
				x: 0,
				y: 0
			});
		}
	};

	const closeModal = () => {
		setOpenModalAttachment(false);
		setPositionShow(SHOW_POSITION.NONE);
		setImageURL('');
		dispatch(attachmentActions.removeCurrentAttachment());
	};

	const handleContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>, props?: Partial<MessageContextMenuProps>) => {
			showMessageContextMenu(event, messageId, mode ?? 2, false, props);
			setPositionShow(SHOW_POSITION.IN_VIEWER);
			setImageURL(urlImg);
		},
		[showMessageContextMenu, messageId, mode, setPositionShow, setImageURL, urlImg]
	);

	const handleSelectImage = useCallback(
		(newIndex: number) => {
			if (!attachments) {
				return;
			}
			setScale(1);
			setRotate(0);
			setPosition({ x: 0, y: 0 });
			setUrlImg(attachments[newIndex]?.url || '');
			setCurrentIndexAtt(newIndex);
			dispatch(attachmentActions.setCurrentAttachment(attachments[newIndex]));
		},
		[attachments, dispatch]
	);

	const handleSelectNextImage = useCallback(() => {
		if (!attachments) {
			return;
		}

		const newIndex = currentIndexAtt < attachments.length - 1 ? currentIndexAtt + 1 : currentIndexAtt;
		if (newIndex !== currentIndexAtt) {
			handleSelectImage(newIndex);
		}
	}, [attachments, currentIndexAtt, handleSelectImage]);

	const handleSelectPreviousImage = useCallback(() => {
		const newIndex = currentIndexAtt > 0 ? currentIndexAtt - 1 : currentIndexAtt;
		if (newIndex !== currentIndexAtt) {
			handleSelectImage(newIndex);
		}
	}, [currentIndexAtt, handleSelectImage]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.repeat) {
				return;
			}

			if (event.key === 'Escape') {
				closeModal();
				return;
			}
			if (event.key === ' ' && isVideo) {
				event.preventDefault();
				toggleVideoPlayback();
				return;
			}
			if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
				handleSelectPreviousImage();
			}

			if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
				handleSelectNextImage();
			}
		},
		[isVideo, toggleVideoPlayback, handleSelectNextImage, handleSelectPreviousImage]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const handleMouseDown = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
		event.stopPropagation();
		setDragging(true);
		setDragStart({
			x: event.clientX - position.x,
			y: event.clientY - position.y
		});
	};

	const handleMouseMove = (event: any) => {
		if (dragging && scale !== 1) {
			setPosition({
				x: event.clientX - dragStart.x,
				y: event.clientY - dragStart.y
			});
		}
	};

	const handleMouseUp = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
		event.stopPropagation();
		setDragging(false);
	};

	const currentChannelLabel = useAppSelector(selectCurrentChannelLabel);
	const currentDmLabel = useAppSelector((state) => selectDmChannelLabelById(state, (directId as string) || ''));

	const handleRotateImg = (direction: 'LEFT' | 'RIGHT') => {
		if (direction === 'LEFT') {
			setRotate(rotate - 90);
		} else {
			setRotate(rotate + 90);
		}
	};

	const handleScaleImage = (scaleUp: boolean) => {
		if (scaleUp) {
			if (scale < MAX_SCALE_IMAGE) {
				setScale(scale + 1.5);
			}
			return;
		}
		setScale(1);
		setPosition({
			x: 0,
			y: 0
		});
	};

	const handleDownloadImage = async () => {
		await handleSaveImage(urlImg);
	};

	const stopPropagation = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
		e.stopPropagation();
	};

	const handleClickOutsideImage = () => {
		closeModal();
	};

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className={`justify-center items-center flex flex-col fixed z-40 inset-0 outline-none focus:outline-none bg-black text-colorTextLightMode select-none`}
		>
			<div className="flex justify-center items-center bg-[#2e2e2e] w-full h-[30px] relative">
				<div className="text-textDarkTheme">{currentDmLabel || currentChannelLabel}</div>
				<div onClick={closeModal} className="w-4 absolute right-2 top-2 cursor-pointer">
					<Icons.MenuClose className="text-white w-full" />
				</div>
			</div>
			<div className="flex w-full h-[calc(100vh_-_30px_-_56px)] bg-[#141414] max-[480px]:flex-col">
				<div
					className="flex-1 flex justify-center items-center px-5 py-3 overflow-hidden h-full w-full relative"
					onClick={handleClickOutsideImage}
				>
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
							<svg
								className="w-16 h-16 text-[#4a4a4a]"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
								/>
							</svg>
							<span className="sr-only">Loading...</span>
						</div>
					)}
					{isVideo ? (
						<video
							ref={videoRef}
							src={urlImg ?? ''}
							className={`max-h-full max-w-full object-scale-down rounded-[10px] cursor-pointer transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`}
							controls
							onContextMenu={handleContextMenu}
							onClick={(e) => {
								e.stopPropagation();
								toggleVideoPlayback();
							}}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							onLoadedData={handleMediaLoaded}
							onError={handleMediaLoaded}
						/>
					) : (
						<img
							src={createImgproxyUrl(urlImg ?? '', { width: 0, height: 0, resizeType: 'force' })}
							alt={urlImg}
							className={`max-h-full object-scale-down rounded-[10px] cursor-default transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'} ${rotate % 180 === 90 ? 'w-[calc(100vh_-_30px_-_56px)] h-auto' : 'h-auto'}`}
							onDragStart={handleDrag}
							onWheel={handleWheel}
							onMouseUp={handleMouseUp}
							onMouseMove={handleMouseMove}
							onMouseDown={handleMouseDown}
							onMouseLeave={handleMouseUp}
							style={{
								transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) `,
								transition: `${dragging ? '' : 'transform 0.2s ease'}`,
								rotate: `${rotate}deg`
							}}
							onContextMenu={handleContextMenu}
							onClick={stopPropagation}
							onLoad={handleMediaLoaded}
							onError={handleMediaLoaded}
						/>
					)}
					<div
						className={`h-full w-12 absolute flex flex-col right-0 gap-2 justify-center ${scale === 1 && !isVideo ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
						onClick={stopPropagation}
					>
						<div
							className="rounded-full rotate-180 bg-bgTertiary cursor-pointer w-10 aspect-square flex items-center justify-center text-white"
							onClick={handleSelectNextImage}
						>
							<Icons.ArrowDown size="w-5 h-5 text-channelTextLabel hover:text-white" />
						</div>
						<div
							className="rounded-full  bg-bgTertiary  cursor-pointer w-10 aspect-square flex items-center justify-center text-white"
							onClick={handleSelectPreviousImage}
						>
							<Icons.ArrowDown size="w-5 h-5 text-channelTextLabel hover:text-white" />
						</div>
					</div>
				</div>
				{showList && (
					<ListAttachment
						attachments={attachments ? attachments : []}
						urlImg={urlImg}
						setUrlImg={setUrlImg}
						handleDrag={handleDrag}
						setScale={setScale}
						setPosition={setPosition}
						setCurrentIndexAtt={setCurrentIndexAtt}
						currentIndexAtt={currentIndexAtt}
						onLoadMore={handleLoadMoreAttachments}
						isLoading={paginationState.isLoading}
						hasMoreBefore={paginationState.hasMoreBefore}
						hasMoreAfter={paginationState.hasMoreAfter}
					/>
				)}
			</div>
			<div className="h-14 flex px-4 w-full items-center justify-between bg-[#2e2e2e]">
				<div className="flex items-center  flex-1">
					<SenderUser />
				</div>
				<div className="gap-3  flex-1 text-white flex items-center justify-center">
					<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={handleDownloadImage}>
						<Icons.HomepageDownload className="w-5 h-5" />
					</div>
					{!isVideo && (
						<>
							<div className="">
								<Icons.StraightLineIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleRotateImg('LEFT')}>
								<Icons.RotateLeftIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleRotateImg('RIGHT')}>
								<Icons.RotateRightIcon className="w-5" />
							</div>
							<div className="">
								<Icons.StraightLineIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleScaleImage(true)}>
								<Icons.ZoomIcon className="w-5" />
							</div>
							<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={() => handleScaleImage(false)}>
								<Icons.AspectRatioIcon className="w-5" />
							</div>
						</>
					)}
				</div>
				<div className="flex justify-end flex-1">
					<div className="p-2 hover:bg-[#434343] rounded-md cursor-pointer" onClick={handleShowList}>
						<Icons.SideMenuIcon className="w-5 text-white" />
					</div>
				</div>
			</div>
		</div>
	);
};

const SenderUser = () => {
	const { directId } = useAppParams();
	const attachment = useAppSelector(selectCurrentAttachmentShowImage);
	const clanUser = useAppSelector((state) => selectMemberClanByUserId(state, attachment?.uploader as string));
	const dmUser = useAppSelector((state) => selectMemberGroupByUserId(state, directId as string, attachment?.uploader as string));
	const modeResponsive = useAppSelector(selectModeResponsive);
	const user = modeResponsive === ModeResponsive.MODE_CLAN ? clanUser : dmUser;
	const displayName = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';
	const avatarUrl = user?.clan_avatar || user?.user?.avatar_url || '';

	return (
		<div className="flex gap-2 overflow-hidden ">
			<div className="w-10 aspect-square object-cover overflow-hidden">
				<AvatarImage
					alt={displayName || 'user-avatar'}
					username={displayName}
					src={avatarUrl}
					srcImgProxy={createImgproxyUrl(avatarUrl, { width: 300, height: 300, resizeType: 'fit' })}
					className="w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10"
				/>
			</div>
			<div className="flex flex-col justify-between ">
				<div className="text-[14px] font-semibold text-textDarkTheme truncate max-sm:w-12">{displayName}</div>
				<div className="text-[12px] text-bgTextarea truncate max-sm:w-12">
					{attachment?.create_time ? formatDateI18n(new Date(attachment.create_time || ''), 'en', 'dd/MM/yyyy') : 'N/A'}
				</div>
			</div>
		</div>
	);
};

export default MessageModalImage;
