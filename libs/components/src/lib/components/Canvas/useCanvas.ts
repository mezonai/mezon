import { useAuth } from '@mezon/core';
import {
	appActions,
	canvasAPIActions,
	createEditCanvas,
	selectCanvasEntityById,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentClanId
} from '@mezon/store';
import { EEventAction } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { CanvasData, UseCanvasReturn } from './types';

const isContentEmpty = (content: string): boolean => {
	if (!content || content === '') return true;
	try {
		const parsed = JSON.parse(content);
		if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
			return (
				parsed.content.length === 0 || (parsed.content.length === 1 && parsed.content[0].type === 'paragraph' && !parsed.content[0].content)
			);
		}
	} catch {
		return content === '';
	}
	return false;
};

export function useCanvas(): UseCanvasReturn {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { canvasId, channelId, clanId } = useParams<{
		canvasId: string;
		channelId: string;
		clanId: string;
	}>();

	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentClanId = useSelector(selectCurrentClanId);

	const canvas = useSelector((state) => selectCanvasEntityById(state, currentChannelId || '', currentChannelParentId, canvasId || '')) as
		| CanvasData
		| undefined;

	const { userProfile } = useAuth();
	const canEdit = canvasId === 'new' || Boolean(canvas?.creator_id === userProfile?.user?.id || !canvas?.creator_id);

	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasChanges, setHasChanges] = useState(false);

	const originalTitle = useRef('');
	const originalContent = useRef('');

	const loadCanvasData = useCallback(async () => {
		if (!canvasId || !channelId || !clanId) return;

		if (canvasId === 'new') {
			setIsLoading(true);
			setTitle('');
			setContent('');
			originalTitle.current = '';
			originalContent.current = '';
			setHasChanges(false);
			setTimeout(() => setIsLoading(false), 200);
			return;
		}

		const existingCanvas = canvas;
		if (!existingCanvas) {
			setIsLoading(true);
		}
		setError(null);
		setHasChanges(false);

		try {
			await dispatch(
				canvasAPIActions.getChannelCanvasList({
					channel_id: channelId,
					clan_id: clanId,
					noCache: false
				}) as any
			);

			const result = await dispatch(
				canvasAPIActions.getChannelCanvasDetail({
					id: canvasId,
					channel_id: channelId,
					clan_id: clanId,
					noCache: false
				}) as any
			);

			const canvasData = result?.payload?.canvas;
			if (canvasData) {
				const newTitle = canvasData.title || '';
				const newContent = canvasData.content || '';
				setTitle(newTitle);
				setContent(newContent);
				originalTitle.current = newTitle;
				originalContent.current = newContent;
			}
		} catch {
			setError('Failed to load canvas');
		} finally {
			setIsLoading(false);
		}
	}, [canvasId, channelId, clanId, canvas]);

	useEffect(() => {
		dispatch(appActions.setIsShowCanvas(true));
		loadCanvasData();

		return () => {
			dispatch(appActions.setIsShowCanvas(false));
		};
	}, [dispatch, loadCanvasData]);

	useEffect(() => {
		if (canvas && canvasId !== 'new') {
			const newTitle = canvas.title || '';
			const newContent = canvas.content || '';
			setTitle(newTitle);
			setContent(newContent);
			originalTitle.current = newTitle;
			originalContent.current = newContent;
		}
	}, [canvas, canvasId]);

	const saveCanvas = useCallback(async () => {
		if (!currentChannelId || !currentClanId || !canEdit || !hasChanges) return;

		setIsSaving(true);

		try {
			const isCreate = !canvasId || canvasId === 'new' ? EEventAction.CREATED : EEventAction.UPDATE;

			const body = {
				channel_id: currentChannelId,
				clan_id: currentClanId.toString(),
				content,
				title,
				status: isCreate,
				...(canvasId && canvasId !== 'new' && { id: canvasId }),
				...(canvas?.is_default && { is_default: true })
			};

			const result = await dispatch(createEditCanvas(body) as any);

			originalTitle.current = title;
			originalContent.current = content;
			setHasChanges(false);
			setIsSaving(false);

			if (isCreate === EEventAction.CREATED && result?.payload?.id) {
				const newCanvasId = result.payload.id;
				const isThread = Boolean(currentChannelParentId && currentChannelParentId !== '0');
				const redirectPath = isThread
					? `/chat/clans/${currentClanId}/channels/${currentChannelId}/canvas/${newCanvasId}`
					: `/chat/clans/${currentClanId}/channels/${currentChannelId}/canvas/${newCanvasId}`;
				navigate(redirectPath, { replace: true });
			}
		} catch {
			setError('Failed to save canvas');
			setIsSaving(false);
		}
	}, [
		currentChannelId,
		currentChannelParentId,
		currentClanId,
		content,
		title,
		canvasId,
		canvas?.is_default,
		canEdit,
		hasChanges,
		dispatch,
		navigate
	]);

	const updateTitle = useCallback(
		(newTitle: string) => {
			if (!canEdit) return;
			setTitle(newTitle);
			const titleChanged = newTitle !== originalTitle.current;
			const contentChanged = !isContentEmpty(content) && content !== originalContent.current && !isContentEmpty(originalContent.current);
			setHasChanges(titleChanged || contentChanged);
		},
		[canEdit, content]
	);

	const updateContent = useCallback(
		(newContent: string) => {
			if (!canEdit) return;
			setContent(newContent);
			const titleChanged = title !== originalTitle.current;
			const contentChanged = !isContentEmpty(newContent) && newContent !== originalContent.current && !isContentEmpty(originalContent.current);
			setHasChanges(titleChanged || contentChanged);
		},
		[canEdit, title]
	);

	const discardChanges = useCallback(() => {
		setTitle(originalTitle.current);
		setContent(originalContent.current);
		setHasChanges(false);
	}, []);

	return {
		title,
		content,
		canvasId: canvasId || '',
		isLoading,
		isSaving,
		error,
		canEdit,
		hasChanges,
		updateTitle,
		updateContent,
		saveCanvas,
		discardChanges
	};
}
