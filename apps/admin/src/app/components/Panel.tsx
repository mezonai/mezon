import { createPortal } from 'react-dom';

interface PanelProps {
	isOpen: boolean;
	onClose: () => void;
	position?: 'left' | 'right' | 'top' | 'bottom' | 'center';
	width?: string | number;
	height?: string | number;
	children: React.ReactNode;
	className?: string;
	headerHeight?: number; // offset top
	sideOffset?: number; // offset left/right/bottom
}

const positionClass = {
	left: 'left-0 top-0 h-full',
	right: 'right-0 top-0 h-full',
	top: 'top-0 left-0 w-full',
	bottom: 'bottom-0 left-0 w-full',
	center: 'inset-0 flex items-center justify-center pointer-events-none'
};

const Panel: React.FC<PanelProps> = ({
	isOpen,
	onClose,
	position = 'right',
	width = 'auto',
	height = 'auto',
	children,
	className = '',
	headerHeight = 0,
	sideOffset = 0
}) => {
	if (!isOpen) return null;

	const style: React.CSSProperties = {};
	if (position === 'top') {
		style.top = headerHeight;
		style.left = sideOffset;
		style.right = sideOffset;
		style.height = height;
	} else if (position === 'bottom') {
		style.bottom = sideOffset;
		style.left = sideOffset;
		style.right = sideOffset;
		style.height = height;
	} else if (position === 'left') {
		style.top = headerHeight;
		style.left = sideOffset;
		style.height = height;
	} else if (position === 'right') {
		style.top = headerHeight;
		style.right = sideOffset;
		style.height = height;
	}

	return createPortal(
		<div
			className="fixed z-[999] flex"
			style={{
				inset: 0,
				...style,
				maxWidth: '100vw',
				maxHeight: '100vh'
			}}
		>
			<div className="absolute inset-0" onClick={onClose} />
			<div
				className={`
          absolute dark:bg-[#232329] shadow-2xl flex flex-col
          ${positionClass[position]} ${className}
        `}
				style={{
					width: ['left', 'right', 'center'].includes(position) ? width : '100%',
					height: ['top', 'bottom', 'center'].includes(position) ? height : '100%',
					overflow: 'auto'
				}}
			>
				<div className="pointer-events-auto">{children}</div>
			</div>
		</div>,
		document.body
	);
};

export default Panel;
