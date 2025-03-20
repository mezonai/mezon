import { Icons } from '@mezon/ui';
import { formatTimeToMMSS } from '@mezon/utils';
import React from 'react';

type AudioUIProps = {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	togglePlay: () => void;
	handleSaveImage: () => void;
	posInPopUp?: boolean;
};

export const MessageAudioUI: React.FC<AudioUIProps> = ({ isPlaying, currentTime, duration, togglePlay, handleSaveImage, posInPopUp = false }) => (
	<>
		<hr className="opacity-0 w-full" />
		<div
			className={`inline-flex items-center justify-between gap-3 bg-bgSelectItem text-white rounded-full py-1.5 pl-1.5 pr-3.5
		${posInPopUp ? 'w-50 items-end rounded-none rounded-t-md w-full' : 'w-60'}`}
		>
			<button
				onClick={togglePlay}
				className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-bgSelectItem hover:bg-blue-50 transition-colors"
			>
				{isPlaying ? (
					<svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
						<rect x="6" y="4" width="4" height="16" />
						<rect x="14" y="4" width="4" height="16" />
					</svg>
				) : (
					<svg viewBox="0 0 24 24" className="w-4 h-4 fill-current ml-0.5">
						<path d="M8 5v14l11-7z" />
					</svg>
				)}
			</button>

			<span className="ml-2 text-sm whitespace-nowrap">
				{formatTimeToMMSS(currentTime)} / {formatTimeToMMSS(duration)}
			</span>
			<button onClick={handleSaveImage}>
				<Icons.Download />
			</button>
		</div>
	</>
);
