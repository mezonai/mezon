import { Icons } from '@mezon/ui';
import { formatTimeToMMSS } from '@mezon/utils';
import React, { useEffect, useRef, useState } from 'react';

interface ISoundItemProps {
	sound: {
		id: number;
		fileName: string;
		src: string;
	};
	isSelected: boolean;
	onPlay?: () => void;
	onSelect?: () => void;
	isPlaying?: boolean;
}

const SoundItem: React.FC<ISoundItemProps> = ({ sound, isSelected, onPlay, onSelect, isPlaying }) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.play().catch((error) => {
					console.error(error);
				});
			} else {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
			}
		}
	}, [isPlaying]);

	const handleOnClickPlay = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch((error) => {
				console.error(error);
			});
		}
		if (onPlay) {
			onPlay();
		}
	};

	const handleLoadedMetadata = () => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);
		}
	};

	return (
		<>
			<div
				className={`flex items-center bg-item-hover ${isSelected ? 'bg-item-theme text-theme-primary-active' : ''} px-2 py-3 h-fit cursor-pointer`}
				onClick={onSelect}
			>
				<p className={`${isSelected && 'font-semibold text-theme-primary-active'} w-1/2`}>{sound.fileName}</p>
				<audio className="flex-grow bg-transparent" src={sound.src} ref={audioRef} onLoadedMetadata={handleLoadedMetadata} />
				<p className={' w-1/3'}>{formatTimeToMMSS(duration)}</p>
				<button onClick={handleOnClickPlay} className={'ml-auto flex justify-center'}>
					<Icons.Speaker />
				</button>
			</div>
			<div className={' h-[1px] border-t-theme-primary'}></div>
		</>
	);
};

export default SoundItem;
