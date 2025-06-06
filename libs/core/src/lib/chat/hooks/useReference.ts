import {
	messagesActions,
	referencesActions,
	selectAttachmentByChannelId,
	selectOpenOptionMessageState,
	selectOpenThreadMessageState,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useReference(channelId?: string) {
	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const openOptionMessageState = useSelector(selectOpenOptionMessageState);
	const attachmentFilteredByChannelId = useAppSelector((state) => selectAttachmentByChannelId(state, channelId ?? ''));

	const checkAttachment = useMemo(() => {
		return attachmentFilteredByChannelId?.files?.length > 0;
	}, [attachmentFilteredByChannelId?.files]);

	const setOpenThreadMessageState = useCallback(
		(status: boolean) => {
			dispatch(threadsActions.setOpenThreadMessageState(status));
		},
		[dispatch]
	);

	const setOpenOptionMessageState = useCallback(
		(status: boolean) => {
			dispatch(messagesActions.setOpenOptionMessageState(status));
		},
		[dispatch]
	);

	const removeAttachmentByIndex = useCallback(
		(channelId: string, indexItem: number) => {
			dispatch(
				referencesActions.removeAttachment({
					channelId: channelId || '',
					index: indexItem
				})
			);
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			setOpenThreadMessageState,
			openThreadMessageState,
			openOptionMessageState,
			setOpenOptionMessageState,
			removeAttachmentByIndex,
			attachmentFilteredByChannelId,
			checkAttachment
		}),
		[
			setOpenThreadMessageState,
			openThreadMessageState,
			openOptionMessageState,
			setOpenOptionMessageState,
			removeAttachmentByIndex,
			attachmentFilteredByChannelId,
			checkAttachment
		]
	);
}
