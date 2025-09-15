import {
	dragAndDropAction,
	selectDragAndDropState,
	selectLimitSizeState,
	selectOverLimitReasonState,
	selectOverLimitUploadState
} from '@mezon/store';
import { MAX_FILE_SIZE, type UploadLimitReason } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function useDragAndDrop() {
	const dispatch = useDispatch();
	const draggingState = useSelector(selectDragAndDropState);
	const isOverUploading = useSelector(selectOverLimitUploadState);
	const overLimitReason = useSelector(selectOverLimitReasonState);
	const limitSize = useSelector(selectLimitSizeState);

	const setDraggingState = useCallback(
		(status: boolean) => {
			dispatch(dragAndDropAction.setDraggingState(status));
		},
		[dispatch]
	);
	const setOverUploadingState = useCallback(
		(status: boolean, reason: UploadLimitReason, limitSize?: number) => {
			dispatch(dragAndDropAction.setOverLimitUploadState(status));
			dispatch(dragAndDropAction.setOverLimitReasonState(reason));
			dispatch(dragAndDropAction.setLimitSizeState(limitSize ?? MAX_FILE_SIZE));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			draggingState,
			setDraggingState,
			isOverUploading,
			setOverUploadingState,
			overLimitReason,
			limitSize
		}),
		[draggingState, isOverUploading, overLimitReason, setDraggingState, setOverUploadingState, limitSize]
	);
}
