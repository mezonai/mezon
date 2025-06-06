import { ReactNode, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import DraggablePopup from './DraggablePopup';

type InitialPosition = 'center' | 'bottom-right';

interface UsePopupOptions {
	title?: string;
	customHeader?: React.ReactNode;
	customFooter?: React.ReactNode;
	customHeaderFactory?: (props: { closePopup: () => void; maximizeToggle: () => void }) => React.ReactNode;
	customFooterFactory?: (props: { closePopup: () => void; maximizeToggle: () => void }) => React.ReactNode;
	initialPosition?: InitialPosition;
	initialWidth?: number;
	initialHeight?: number;
	minWidth?: number;
	minHeight?: number;
	handleClose?: () => void;
	onMaximizeToggle?: (isMaximized: boolean) => void;
	popupId?: string;
}

export function usePopup<T extends Record<string, any> = Record<string, never>>(
	modalContent: (props: T & { closePopup: () => void }) => ReactNode,
	options: UsePopupOptions = {}
) {
	const {
		title = 'Popup',
		customHeader,
		customFooter,
		customHeaderFactory,
		customFooterFactory,
		initialPosition = 'bottom-right',
		initialWidth = 400,
		initialHeight = 300,
		minWidth = 400,
		minHeight = 300,
		handleClose,
		onMaximizeToggle,
		popupId
	} = options;
	const popupRef = useRef<HTMLDivElement>(null);

	const uniquePopupId = useMemo(() => {
		return popupId || `popup-${Date.now()}-${Math.random()}`;
	}, [popupId]);

	const [_showPopup, hidePopup] = useModal(
		({ in: open, onExited }: { in: boolean; onExited: () => void }) => {
			const handleClosePopup = () => {
				if (handleClose) {
					handleClose();
				}
				hidePopup();
			};

			const handleMaximizeToggle = () => {
				if (popupRef.current && (popupRef.current as any).maximizeToggle) {
					(popupRef.current as any).maximizeToggle();
				}
			};

			const finalCustomHeader = customHeaderFactory
				? customHeaderFactory({ closePopup: handleClosePopup, maximizeToggle: handleMaximizeToggle })
				: customHeader;

			const finalCustomFooter = customFooterFactory
				? customFooterFactory({ closePopup: handleClosePopup, maximizeToggle: handleMaximizeToggle })
				: customFooter;

			return (
				<DraggablePopup
					ref={popupRef}
					onClose={handleClosePopup}
					title={title}
					customHeader={finalCustomHeader}
					customFooter={finalCustomFooter}
					onMaximizeToggle={onMaximizeToggle}
					initialPosition={initialPosition}
					initialWidth={initialWidth}
					initialHeight={initialHeight}
					minWidth={minWidth}
					minHeight={minHeight}
					popupId={uniquePopupId}
				>
					{modalContent({ closePopup: handleClosePopup } as T & { closePopup: () => void })}
				</DraggablePopup>
			);
		},
		[
			modalContent,
			title,
			customHeader,
			customFooter,
			customHeaderFactory,
			customFooterFactory,
			initialPosition,
			initialWidth,
			initialHeight,
			minWidth,
			minHeight,
			handleClose,
			onMaximizeToggle,
			uniquePopupId
		]
	);

	const showPopup = _showPopup as unknown as () => void;

	const openPopup = () => {
		showPopup();
	};

	return [openPopup, hidePopup] as const;
}
