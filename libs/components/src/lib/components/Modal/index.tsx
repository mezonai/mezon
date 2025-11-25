import { useEscapeKeyClose } from '@mezon/core';
import { useRef } from 'react';

interface ModalProps {
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
}

const Modal = ({ onClose, className, children }: ModalProps) => {
	const modalRef = useRef(null);
	useEscapeKeyClose(modalRef, onClose);
	return (
		<div
			ref={modalRef}
			className={`flex items-center justify-center fixed top-0 bottom-0 left-0 right-1 z-[100] bg-modal-overlay base-theme-color text-theme-primary ${className} `}
			onMouseDown={onClose}
		>
			<div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="contents">
				{children}
			</div>
		</div>
	);
};
export default Modal;
