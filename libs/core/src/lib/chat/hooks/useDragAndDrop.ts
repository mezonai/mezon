import { dragAndDropAction, selectDragAndDropState, selectOverLimitReasonState, selectOverLimitUploadState } from '@mezon/store';
import { UploadLimitReason } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function useDragAndDrop() {
	const dispatch = useDispatch();
	const draggingState = useSelector(selectDragAndDropState);
	const isOverUploading = useSelector(selectOverLimitUploadState);
	const overLimitReason = useSelector(selectOverLimitReasonState);
	const setDraggingState = useCallback(
		(status: boolean) => {
			dispatch(dragAndDropAction.setDraggingState(status));
		},
		[dispatch]
	);
	const setOverUploadingState = useCallback(
		(status: boolean, reason: UploadLimitReason) => {
			dispatch(dragAndDropAction.setOverLimitUploadState(status));
			dispatch(dragAndDropAction.setOverLimitReasonState(reason));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			draggingState,
			setDraggingState,
			isOverUploading,
			setOverUploadingState,
			overLimitReason
		}),
		[draggingState, isOverUploading, overLimitReason, setDraggingState, setOverUploadingState]
	);
}
