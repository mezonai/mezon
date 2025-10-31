import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	appActions,
	canvasActions,
	selectCanvasIdsByChannelId,
	selectCurrentChannelChannelId,
	selectCurrentChannelCreatorId,
	selectCurrentChannelParentId,
	selectCurrentClanId,
	selectIdCanvas,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import EmptyCanvas from './EmptyCanvas';
import GroupCanvas from './GroupCanvas';
import SearchCanvas from './SearchCanvas';
import { CANVAS_TYPES } from './constants';

type CanvasProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const CanvasModal = ({ onClose, rootRef }: CanvasProps) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const channelId = useAppSelector(selectCurrentChannelChannelId);
	const parentId = useAppSelector(selectCurrentChannelParentId);
	const creatorChannelId = useAppSelector(selectCurrentChannelCreatorId);
	const currentClanId = useSelector(selectCurrentClanId);
	const appearanceTheme = useSelector(selectTheme);
	const [keywordSearch, setKeywordSearch] = useState('');
	const currentIdCanvas = useSelector(selectIdCanvas);
	const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(currentIdCanvas);
	const canvases = useAppSelector((state) => selectCanvasIdsByChannelId(state, channelId ?? '', parentId));
	const filteredCanvases = useMemo(() => {
		if (!keywordSearch) return canvases;
		const lowerCaseQuery = keywordSearch.toLowerCase().trim();
		return canvases.filter((entity) => entity.title.toLowerCase().includes(lowerCaseQuery));
	}, [canvases, keywordSearch]);

	useEffect(() => {
		if (currentIdCanvas && !selectedCanvasId) {
			setSelectedCanvasId(currentIdCanvas);
		}
	}, [currentIdCanvas, selectedCanvasId]);

	const handleCreateCanvas = () => {
		const isThread = Boolean(parentId && parentId !== '0');
		const id = channelId;

		if (!id) {
			console.error('Error: ID is undefined. Check channel data');
			return;
		}
		const type = isThread ? CANVAS_TYPES.THREAD : CANVAS_TYPES.CHANNEL;
		dispatch(canvasActions.setParentId(isThread ? parentId || null : id));
		dispatch(canvasActions.setType(type));
		dispatch(appActions.setIsShowCanvas(true));
		dispatch(canvasActions.setTitle(''));
		dispatch(canvasActions.setContent(''));
		dispatch(canvasActions.setIdCanvas(null));
		onClose();
	};

	const handleSelectCanvas = (canvasId: string) => {
		setSelectedCanvasId(canvasId);
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);
	// const totalPages = countCanvas === undefined ? 0 : Math.ceil(countCanvas / 10);
	// const [currentPage, setCurrentPage] = useState(1);
	// const onPageChange = useCallback(
	// 	(page: number) => {
	// 		if (!currentChannel?.channel_id || !currentClanId) {
	// 			return;
	// 		}
	// 		setCurrentPage(page);
	// 		dispatch(
	// 			getChannelCanvasList({
	// 				channel_id: currentChannel?.channel_id,
	// 				clan_id: currentClanId,
	// 				page: page,
	// 				noCache: true
	// 			})
	// 		);
	// 	},
	// 	[dispatch, currentChannel?.channel_id, currentClanId]
	// );
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[99999999] origin-top-right"
		>
			<div className="flex flex-col bg-theme-setting-primary rounded-md h-[400px] md:w-[480px] max-h-[80vh] lg:w-[540px] justify-between shadow-sm overflow-hidden">
				<div className="flex flex-row items-center bg-theme-setting-nav border-b-theme-primary justify-between p-[16px] h-12 ">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<Icons.CanvasIcon />
						<span className="text-base font-semibold cursor-default ">{t('modals.canvas.title')}</span>
					</div>
					<SearchCanvas setKeywordSearch={setKeywordSearch} />
					<div className="flex flex-row items-center gap-4">
						<button onClick={handleCreateCanvas} className="px-3 h-6 rounded-lg btn-primary btn-primary-hover text-sm">
							{t('modals.canvas.create')}
						</button>
						<button onClick={onClose} className="text-theme-primary text-theme-primary-hover">
							<Icons.Close defaultSize="w-4 h-4 " />
						</button>
					</div>
				</div>
				<div
					className={`flex flex-col gap-2 py-2 px-[16px] flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
				>
					{filteredCanvases?.map((canvas) => {
						return (
							<GroupCanvas
								onClose={onClose}
								key={canvas.id}
								canvas={canvas}
								channelId={channelId}
								clanId={currentClanId || ''}
								creatorIdChannel={creatorChannelId}
								selectedCanvasId={selectedCanvasId}
								onSelectCanvas={handleSelectCanvas}
							/>
						);
					})}

					{!canvases?.length && <EmptyCanvas onClick={handleCreateCanvas} />}
				</div>
				{/* {totalPages > 1 && (
					<div className="py-2">
						<Pagination
							theme={customTheme(totalPages <= 5)}
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={onPageChange}
							previousLabel=""
							nextLabel=""
							showIcons={totalPages > 5}
						/>
					</div>
				)} */}
			</div>
		</div>
	);
};

export default CanvasModal;
