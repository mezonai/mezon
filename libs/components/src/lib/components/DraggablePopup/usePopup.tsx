import { ReactNode } from 'react';
import { useModal } from 'react-modal-hook';
import DraggablePopup from './DraggablePopup';

interface UsePopupOptions {
	title?: string;
	initialWidth?: number;
	initialHeight?: number;
	minWidth?: number;
	minHeight?: number;
	handleClose?: () => void;
}

export function usePopup<T extends Record<string, any> = Record<string, never>>(
	modalContent: (props: T & { closePopup: () => void }) => ReactNode,
	options: UsePopupOptions = {}
) {
	const { title = 'Popup', initialWidth = 400, initialHeight = 300, minWidth = 400, minHeight = 300, handleClose } = options;

	const [_showPopup, hidePopup] = useModal(
		({ in: open, onExited }: { in: boolean; onExited: () => void }) => {
			const handleClosePopup = () => {
				if (handleClose) {
					handleClose();
				}
				hidePopup();
			};

			return (
				<DraggablePopup
					isOpen={open}
					onClose={handleClosePopup}
					title={title}
					initialWidth={initialWidth}
					initialHeight={initialHeight}
					minWidth={minWidth}
					minHeight={minHeight}
				>
					{modalContent({ closePopup: handleClosePopup } as T & { closePopup: () => void })}
				</DraggablePopup>
			);
		},
		[modalContent, title, initialWidth, initialHeight, minWidth, minHeight, handleClose]
	);

	const showPopup = _showPopup as unknown as () => void;

	const openPopup = () => {
		showPopup();
	};

	return [openPopup, hidePopup] as const;
}
