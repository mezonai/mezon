import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useRef } from 'react';

type ImagePreviewProps = {
	imageUrl: string;
	onClose: () => void;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onClose }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	useOnClickOutside(imageRef, onClose);

	useEscapeKeyClose(containerRef, onClose);

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			ref={containerRef}
			tabIndex={-1}
			onClick={handleOverlayClick}
			className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center p-20"
		>
			<img
				ref={imageRef}
				src={createImgproxyUrl(imageUrl, { width: 0, height: 0, resizeType: 'force' })}
				alt=""
				className={'max-h-full w-auto max-w-full'}
			/>
		</div>
	);
};
