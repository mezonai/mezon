import { electronBridge, INSTALL_UPDATE } from '@mezon/utils';
import React from 'react';

type UpdateButtonProps = {
	className?: string;
	isDownloading: boolean;
};

const UpdateButton: React.FC<UpdateButtonProps> = ({ className = '', isDownloading }) => {
	const handleUpdate = async () => {
		await electronBridge.invoke(INSTALL_UPDATE);
	};

	return (
		<button
			id="update-process"
			onClick={handleUpdate}
			className={`bg-gradient-to-r from-custom-purple to-custom-pink hover:from-custom-purple-dark hover:to-custom-pink-dark active:from-custom-purple-active active:to-custom-pink-active transition duration-300 w-full flex items-center justify-center text-white py-2 px-4 ${isDownloading ? 'cursor-not-allowed' : ''}`}
			disabled={isDownloading}
		>
			<span className={`flex w-4 h-4 rounded-full bg-white justify-center items-center mr-1 ${isDownloading ? 'animate-spin' : ''}`}>
				<svg
					width="10px"
					height="10px"
					fill="black"
					id="Layer_1"
					data-name="Layer 1"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 122.61 122.88"
				>
					<path d="M111.9,61.57a5.36,5.36,0,0,1,10.71,0A61.3,61.3,0,0,1,17.54,104.48v12.35a5.36,5.36,0,0,1-10.72,0V89.31A5.36,5.36,0,0,1,12.18,84H40a5.36,5.36,0,1,1,0,10.71H23a50.6,50.6,0,0,0,88.87-33.1ZM106.6,5.36a5.36,5.36,0,1,1,10.71,0V33.14A5.36,5.36,0,0,1,112,38.49H84.44a5.36,5.36,0,1,1,0-10.71H99A50.6,50.6,0,0,0,10.71,61.57,5.36,5.36,0,1,1,0,61.57,61.31,61.31,0,0,1,91.07,8,61.83,61.83,0,0,1,106.6,20.27V5.36Z" />
				</svg>
			</span>
			<span className={`text-xs text-white`}>{isDownloading ? 'Downloading Mezon' : 'Update Mezon'}</span>
		</button>
	);
};

export default UpdateButton;
