import { useAppParams, useAttachments } from '@mezon/core';
import {
	attachmentActions,
	selectAllListAttachmentByChannel,
	selectAttachment,
	selectCurrentAttachmentShowImage,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectDmGroupCurrent,
	selectMembeGroupByUserId,
	selectMemberClanByUserId2,
	selectMessageIdAttachment,
	selectModeAttachment,
	selectModeResponsive,
	selectOpenModalAttachment,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ModeResponsive, SHOW_POSITION, createImgproxyUrl, handleSaveImage } from '@mezon/utils';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageContextMenuProps, useMessageContextMenu } from '../../ContextMenu';
import ListAttachment from './listAttachment';
export const MAX_SCALE_IMAGE = 5;

const MessageModalImage = () => {
	const { directId } = useAppParams();
	const [scale, setScale] = useState(1);
	const [rotate, setRotate] = useState(0);

	const [showList, setShowList] = useState(true);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const attachments = useSelector(selectAllListAttachmentByChannel((directId ?? currentChannelId) as string));
	const { setOpenModalAttachment } = useAttachments();
	const openModalAttachment = useSelector(selectOpenModalAttachment);
	const attachment = useSelector(selectAttachment);
	const [urlImg, setUrlImg] = useState(attachment);
	const [currentIndexAtt, setCurrentIndexAtt] = useState(-1);
	const { showMessageContextMenu, setPositionShow, setImageURL } = useMessageContextMenu();

	const mode = useSelector(selectModeAttachment);
	const messageId = useSelector(selectMessageIdAttachment);
	const dispatch = useDispatch();
	const handleShowList = () => {
		setShowList(!showList);
	};

	useEffect(() => {
		setShowList(true);
		setScale(1);
		setUrlImg(attachment);
	}, [openModalAttachment]);

	useEffect(() => {
		if (attachments.length > 0) {
			const indexImage = attachments.findIndex((img) => img.url === urlImg);
			setCurrentIndexAtt(indexImage);
		}
	}, [attachments.length]);

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
			showMessageContextMenu(event, messageId, mode ?? 2, props);
			setPositionShow(SHOW_POSITION.IN_VIEWER);
			setImageURL(urlImg);
		},
		[showMessageContextMenu, messageId, mode, setPositionShow, setImageURL, urlImg]
	);

	const handleKeyDown = (event: any) => {
		if (event.key === 'Escape') {
			closeModal();
			return;
		}
		if (event.key === 'ArrowUp') {
			handleSelectNextImage();
		}
		if (event.key === 'ArrowDown') {
			handleSelectPreviousImage();
		}
	};

	const handleSelectNextImage = () => {
		const newIndex = currentIndexAtt > 0 ? currentIndexAtt - 1 : currentIndexAtt;
		if (newIndex !== currentIndexAtt) {
			handleSelectImage(newIndex);
		}
	};
	const handleSelectPreviousImage = () => {
		const newIndex = currentIndexAtt < attachments.length - 1 ? currentIndexAtt + 1 : currentIndexAtt;
		if (newIndex !== currentIndexAtt) {
			handleSelectImage(newIndex);
		}
	};
	const handleSelectImage = (newIndex: number) => {
		setUrlImg(attachments[newIndex]?.url || '');
		setCurrentIndexAtt(newIndex);
		dispatch(attachmentActions.setCurrentAttachment(attachments[newIndex]));
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [urlImg, currentIndexAtt]);

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

	const currentChannel = useSelector(selectCurrentChannel);
	const currentDM = useSelector(selectDmGroupCurrent(directId as string));

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

	return (
		<div className="justify-center items-center flex flex-col fixed z-40 inset-0 outline-none focus:outline-nonebg-black text-colorTextLightMode select-none top-[21px]">
			<div className="flex justify-center items-center bg-[#2e2e2e] w-full h-[30px] relative">
				<div className="text-textDarkTheme">{currentDM?.channel_label || currentChannel?.channel_label}</div>
			</div>
			<div className="flex w-full h-[calc(100vh_-_30px_-_56px)] bg-[#141414] max-[480px]:flex-col">
				<div className="flex-1 flex justify-center items-center px-5 py-3 overflow-hidden h-full w-full relative" onClick={closeModal}>
					<img
						src={createImgproxyUrl(urlImg ?? '', { width: 0, height: 0, resizeType: 'force' })}
						alt={urlImg}
						className={`max-h-full object-scale-down rounded-[10px] cursor-default ${rotate % 180 === 90 ? 'w-[calc(100vh_-_30px_-_56px)] h-auto' : 'h-auto'}`}
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
					/>
					<div
						className={`h-full w-12 absolute flex flex-col right-0 gap-2 justify-center ${scale === 1 ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
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
						attachments={attachments}
						urlImg={urlImg}
						setUrlImg={setUrlImg}
						handleDrag={handleDrag}
						setScale={setScale}
						setPosition={setPosition}
						setCurrentIndexAtt={setCurrentIndexAtt}
						currentIndexAtt={currentIndexAtt}
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
	const attachment = useSelector(selectCurrentAttachmentShowImage);
	const clanUser = useAppSelector((state) => selectMemberClanByUserId2(state, attachment?.uploader as string));
	const dmUser = useAppSelector((state) => selectMembeGroupByUserId(state, directId as string, attachment?.uploader as string));
	const modeResponsive = useAppSelector(selectModeResponsive);
	const user = modeResponsive === ModeResponsive.MODE_CLAN ? clanUser : dmUser;

	return (
		<div className="flex gap-2 overflow-hidden ">
			<div className="w-10 aspect-square object-cover overflow-hidden">
				<img
					src={createImgproxyUrl(user?.clan_avatar ?? user?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
					alt="user-avatar"
					className="w-10 rounded-full aspect-square object-cover"
				/>
			</div>
			<div className="flex flex-col justify-between ">
				<div className="text-[14px] font-semibold text-textDarkTheme truncate max-sm:w-12">
					{user?.clan_nick ?? user?.user?.display_name ?? user?.user?.username}
				</div>
				<div className="text-[12px] text-bgTextarea truncate max-sm:w-12">
					{format(attachment?.create_time as string, 'dd/L/yyyy hh:mm a')}
				</div>
			</div>
		</div>
	);
};

export default MessageModalImage;
