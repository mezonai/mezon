import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import React, { useRef } from 'react';

type ImagePreviewProps = {
	imageUrl: string;
	onClose: () => void;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onClose }) => {
	const imageRef = useRef<HTMLImageElement>(null);

	useOnClickOutside(imageRef, onClose);

	useEscapeKeyClose(imageRef, onClose);

	return (
		<div className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center p-10">
			<img src={imageUrl} alt="" ref={imageRef} className={'max-h-full max-w-full'} />
		</div>
	);
};
