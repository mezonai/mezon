import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { formatTimeToMMSS } from '@mezon/utils';
import React from 'react';

type AudioUIProps = {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	togglePlay: () => void;
	seekStart: () => void;
	seek: (time: number) => void;
	seekEnd: () => void;
	handleSaveImage: () => void;
	posInPopUp?: boolean;
};

export const MessageAudioUI: React.FC<AudioUIProps> = ({
	isPlaying,
	currentTime,
	duration,
	togglePlay,
	seekStart,
	seek,
	seekEnd,
	handleSaveImage,
	posInPopUp = false
}) => (
	<>
		<hr className="opacity-0 w-full" />
		<div
			className={`inline-flex items-center justify-between gap-3 bg-bgSelectItem text-white rounded-full py-1.5 pl-1.5 pr-3.5
		${posInPopUp ? ' items-end rounded-none rounded-t-md min-w-48' : 'w-[31%] min-w-72'}`}
		>
			<button
				onClick={togglePlay}
				className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-bgSelectItem hover:bg-blue-50 transition-colors"
			>
				{isPlaying ? <MezonIcon icon={MzIcons16.mzPause} /> : <MezonIcon icon={MzIcons16.mzPlay} className="ml-0.5" />}
			</button>

			<span className="text-sm whitespace-nowrap tabular-nums">
				{formatTimeToMMSS(currentTime)} / {formatTimeToMMSS(duration)}
			</span>

			<div className="relative flex-1 flex items-center h-6 group">
				<div className="w-full h-1 rounded-full bg-white/30">
					<div
						className="relative h-full rounded-full bg-white"
						style={{ width: `${duration ? Math.min(currentTime / duration, 1) * 100 : 0}%` }}
					>
						<div className="absolute right-0 top-1/2 w-2.5 h-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-transform group-hover:scale-125" />
					</div>
				</div>
				<input
					type="range"
					min={0}
					max={duration}
					step="any"
					value={currentTime}
					onChange={(e) => seek(Number(e.target.value))}
					onPointerDown={(e) => e.button === 0 && seekStart()}
					onPointerUp={seekEnd}
					onPointerCancel={seekEnd}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				/>
			</div>

			<button onClick={handleSaveImage}>
				<MezonIcon icon={MzIcons20.mzDownload} />
			</button>
		</div>
	</>
);
