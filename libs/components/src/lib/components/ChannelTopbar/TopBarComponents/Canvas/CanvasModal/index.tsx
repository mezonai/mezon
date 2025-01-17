import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	appActions,
	canvasActions,
	getChannelCanvasList,
	selectCanvasCursors,
	selectCanvasIdsByChannelId,
	selectCurrentChannel,
	selectCurrentClanId,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Button, Pagination } from 'flowbite-react';
import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import EmptyCanvas from './EmptyCanvas';
import GroupCanvas from './GroupCanvas';
import SearchCanvas from './SearchCanvas';

type CanvasProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const CanvasModal = ({ onClose, rootRef }: CanvasProps) => {
	const dispatch = useAppDispatch();
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const appearanceTheme = useSelector(selectTheme);
	const [keywordSearch, setKeywordSearch] = useState('');
	const { countCanvas } = useAppSelector((state) => selectCanvasCursors(state, currentChannel?.channel_id ?? ''));
	const canvases = useAppSelector((state) => selectCanvasIdsByChannelId(state, currentChannel?.channel_id ?? ''));
	const filteredCanvases = useMemo(() => {
		if (!keywordSearch) return canvases;
		const lowerCaseQuery = keywordSearch.toLowerCase().trim();
		return canvases.filter((entity) => entity.title.toLowerCase().includes(lowerCaseQuery));
	}, [canvases, keywordSearch]);

	const handleCreateCanvas = () => {
		dispatch(appActions.setIsShowCanvas(true));
		dispatch(canvasActions.setTitle(''));
		dispatch(canvasActions.setContent(''));
		dispatch(canvasActions.setIdCanvas(null));
		onClose();
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);
	const totalPages = countCanvas === undefined ? 0 : Math.ceil(countCanvas / 10);
	const [currentPage, setCurrentPage] = useState(1);
	const onPageChange = useCallback(
		(page: number) => {
			if (!currentChannel?.channel_id || !currentClanId) {
				return;
			}
			setCurrentPage(page);
			dispatch(
				getChannelCanvasList({
					channel_id: currentChannel?.channel_id,
					clan_id: currentClanId,
					page: page,
					noCache: true
				})
			);
		},
		[dispatch, currentChannel?.channel_id, currentClanId]
	);
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[99999999] origin-top-right"
		>
			<div className="flex flex-col rounded-md min-h-[400px] md:w-[480px] max-h-[80vh] lg:w-[540px]  shadow-sm overflow-hidden">
				<div className="dark:bg-bgTertiary bg-bgLightTertiary flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] dark:border-r-[#6A6A6A] border-r-[#E1E1E1] pr-[16px] gap-4">
						<Icons.CanvasIcon />
						<span className="text-base font-semibold cursor-default dark:text-white text-black">Canvas</span>
					</div>
					<SearchCanvas setKeywordSearch={setKeywordSearch} />
					<div className="flex flex-row items-center gap-4">
						<Button
							onClick={handleCreateCanvas}
							size="sm"
							className="h-6 rounded focus:ring-transparent bg-bgSelectItem dark:bg-bgSelectItem hover:!bg-bgSelectItemHover items-center"
						>
							Create
						</Button>
						<button onClick={onClose}>
							<Icons.Close defaultSize="w-4 h-4 dark:text-[#CBD5E0] text-colorTextLightMode" />
						</button>
					</div>
				</div>
				<div
					className={`flex flex-col gap-2 py-2 dark:bg-bgSecondary bg-bgLightSecondary px-[16px] min-h-full flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
				>
					{filteredCanvases?.map((canvas) => {
						return (
							<GroupCanvas
								onClose={onClose}
								key={canvas.id}
								canvas={canvas}
								channelId={currentChannel?.channel_id}
								clanId={currentClanId || ''}
								creatorIdChannel={currentChannel?.creator_id}
							/>
						);
					})}
					{canvases?.length && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />}

					{!canvases?.length && <EmptyCanvas onClick={handleCreateCanvas} />}
				</div>
			</div>
		</div>
	);
};

export default CanvasModal;
