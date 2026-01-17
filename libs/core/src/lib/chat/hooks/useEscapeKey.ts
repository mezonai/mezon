import { messagesActions, referencesActions } from '@mezon/store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

/**
 * @deprecated don't use it
 */
export const useEscapeKey = (handler: () => void, options: Partial<{ preventEvent: boolean }> = {}) => {
	const dispatch = useDispatch();
	useEffect(() => {
		const { preventEvent } = options;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				dispatch(messagesActions.setOpenOptionMessageState(false));
				dispatch(
					referencesActions.setDataReferences({
						channelId: '',
						dataReferences: { has_attachment: false, channel_id: BigInt(''), mode: 0, channel_label: '' }
					})
				);
				handler();
			}
		};

		if (!preventEvent) {
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [dispatch, handler]);
};
