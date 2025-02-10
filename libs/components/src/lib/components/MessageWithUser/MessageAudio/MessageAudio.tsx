import React, { useRef, useState } from 'react';
import { MessageAudioControl } from './MessageAudioControl';
import { MessageAudioUI } from './MessageAudioUI';

type MessageAudioProps = {
	audioUrl: string;
	posInPopUp?: boolean;
};

export const MessageAudio: React.FC<MessageAudioProps> = React.memo(({ audioUrl, posInPopUp = false }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number>(0);
	const audioControlRef = useRef<{ togglePlay: () => void }>(null);

	const handleTogglePlay = () => {
		if (audioControlRef.current) {
			audioControlRef.current.togglePlay();
		}
	};
	const handleSaveImage = () => {
		const link = document.createElement('a');
		link.href = audioUrl;
		link.download = 'audio-file.mp3';
		link.click();
		link.remove();
	};

	return (
		<>
			<MessageAudioControl
				ref={audioControlRef}
				audioUrl={audioUrl}
				setDuration={setDuration}
				setCurrentTime={setCurrentTime}
				setIsPlaying={setIsPlaying}
				isPlaying={isPlaying}
			/>
			<MessageAudioUI
				posInPopUp={posInPopUp}
				isPlaying={isPlaying}
				currentTime={currentTime}
				duration={duration}
				togglePlay={handleTogglePlay}
				handleSaveImage={handleSaveImage}
			/>
		</>
	);
});
