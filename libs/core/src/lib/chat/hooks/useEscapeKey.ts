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
						dataReferences: { hasAttachment: false, channelId: '', mode: 0, channelLabel: '' }
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
