import { useAuth } from '@mezon/core';
import {
	appActions,
	canvasActions,
	canvasAPIActions,
	createEditCanvas,
	selectCanvasEntityById,
	selectContent,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentClanId,
	selectIdCanvas,
	selectTheme,
	selectTitle
} from '@mezon/store';
import { EEventAction } from '@mezon/utils';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

const CanvasContent = lazy(() => import('./CanvasContent'));

const CanvasContentPlaceholder = () => <div className="w-full h-[calc(100vh-120px)] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>;

const Canvas = () => {
	const dispatch = useDispatch();
	const { clanId, channelId, canvasId } = useParams<{
		clanId: string;
		channelId: string;
		canvasId: string;
	}>();

	const title = useSelector(selectTitle);
	const content = useSelector(selectContent);
	const idCanvas = useSelector(selectIdCanvas);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentClanId = useSelector(selectCurrentClanId);
	const canvasById = useSelector((state) => selectCanvasEntityById(state, currentChannelId, currentChannelParentId, idCanvas));

	const [showLoading, setShowLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const appearanceTheme = useSelector(selectTheme);
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
	const { userProfile } = useAuth();
	const isEditAndDelCanvas = Boolean(canvasById?.creator_id === userProfile?.user?.id || !canvasById?.creator_id);

	const refreshCanvasData = useCallback(
		async (forceRefresh = false) => {
			if (!canvasId || !channelId || !clanId) return;

			try {
				setShowLoading(false);
				setError(null);
				const loadingTimeout = setTimeout(() => {
					setShowLoading(true);
				}, 1000);

				const listBody = {
					channel_id: channelId,
					clan_id: clanId,
					noCache: forceRefresh
				};
				await dispatch(canvasAPIActions.getChannelCanvasList(listBody) as any);

				dispatch(canvasActions.setIdCanvas(canvasId));

				const detailBody = {
					id: canvasId,
					channel_id: channelId,
					clan_id: clanId,
					noCache: forceRefresh
				};
				const results = await dispatch(canvasAPIActions.getChannelCanvasDetail(detailBody) as any);
				const dataUpdate = results?.payload;

				if (dataUpdate && dataUpdate.content !== undefined) {
					const { content: canvasContent } = dataUpdate;
					dispatch(canvasActions.setContent(canvasContent));
					dispatch(canvasAPIActions.updateCanvas({ channelId, dataUpdate }));
				}

				clearTimeout(loadingTimeout);
			} catch (err) {
				setError('Failed to refresh canvas data');
			} finally {
				setShowLoading(false);
			}
		},
		[canvasId, channelId, clanId, dispatch]
	);

	useEffect(() => {
		dispatch(appActions.setIsShowCanvas(true));
		refreshCanvasData(false);
	}, [canvasId, channelId, clanId, dispatch, refreshCanvasData]);

	useEffect(() => {
		return () => {
			dispatch(canvasActions.setTitle(''));
			dispatch(canvasActions.setContent(''));
			dispatch(canvasActions.setIdCanvas(''));
			dispatch(appActions.setIsShowCanvas(false));
		};
	}, []);

	useEffect(() => {
		if (textAreaRef.current) {
			textAreaRef.current.style.height = 'auto';
			textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
		}
	}, [title]);

	const callCreateEditCanvas = useCallback(
		async (isCreate: number) => {
			if (currentChannelId && currentClanId) {
				const body = {
					channel_id: currentChannelId,
					clan_id: currentClanId?.toString(),
					content,
					...(idCanvas && { id: idCanvas }),
					...(canvasById?.is_default && { is_default: true }),
					title,
					status: isCreate
				};
				const response = await dispatch(createEditCanvas(body) as any);
				if (response) {
					dispatch(canvasActions.setIdCanvas(response?.payload?.id));
				}
			}
		},
		[currentChannelId, currentClanId, content, idCanvas, canvasById?.is_default, title, dispatch]
	);

	const debouncedSave = useDebouncedCallback(() => {
		let isCreate: number = EEventAction.UPDATE;
		if (!idCanvas || (title && title !== canvasById?.title) || (content && content !== canvasById?.content)) {
			isCreate = EEventAction.CREATED;
		}

		callCreateEditCanvas(isCreate);
	}, 1000);

	const handleCanvasChange = useCallback(() => {
		if (!isEditAndDelCanvas) return;
		debouncedSave();
	}, [isEditAndDelCanvas, debouncedSave]);

	useEffect(() => {
		if (canvasById) {
			dispatch(canvasActions.setTitle(canvasById?.title || ''));
			dispatch(canvasActions.setContent(canvasById?.content || ''));
			dispatch(canvasActions.setIdCanvas(canvasById?.id || ''));
		}
	}, [canvasById]);

	const handleInputChange = (e: { target: { value: any } }) => {
		if (!isEditAndDelCanvas) return;
		const newTitle = e.target.value;
		dispatch(canvasActions.setTitle(newTitle));
		handleCanvasChange();
	};

	if (showLoading) {
		return (
			<div className="w-full h-[calc(100vh-50px)] max-w-[80%] flex items-center justify-center text-theme-message">
				<div className="flex flex-col items-center gap-4">
					<div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
					<span className="">Loading canvas...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-[calc(100vh-50px)] max-w-[80%] flex items-center justify-center text-theme-message">
				<div className="flex flex-col items-center gap-4">
					<div className="text-red-500 text-lg">
						<span role="img" aria-label="warning">
							⚠️
						</span>
						Error
					</div>
					<span className="">{error}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-[calc(100vh-50px)] max-w-[80%]">
			<textarea
				ref={textAreaRef}
				placeholder="Your canvas title"
				value={title || ''}
				onChange={handleInputChange}
				rows={1}
				disabled={!isEditAndDelCanvas}
				className="w-full px-4 py-2 mt-[25px] text-theme-message bg-inherit focus:outline-none text-[28px] resize-none leading-[34px] font-bold "
			/>
			<div className="w-full">
				<Suspense fallback={<CanvasContentPlaceholder />}>
					<CanvasContent
						key={idCanvas}
						idCanvas={idCanvas || ''}
						isLightMode={appearanceTheme === 'light'}
						content={content || ''}
						isEditAndDelCanvas={isEditAndDelCanvas}
						onCanvasChange={handleCanvasChange}
					/>
				</Suspense>
			</div>
		</div>
	);
};

export default Canvas;
