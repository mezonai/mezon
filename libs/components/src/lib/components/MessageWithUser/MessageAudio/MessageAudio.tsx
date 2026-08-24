import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageAudioControl } from './MessageAudioControl';
import { MessageAudioUI } from './MessageAudioUI';

type MessageAudioProps = {
	audioUrl: string;
	posInPopUp?: boolean;
	/** The row exists but the object is not on the CDN yet. */
	isPresignPending?: boolean;
};

function AudioUploadingPill() {
	const { t } = useTranslation('media');
	return (
		<div className="mt-[10px] flex items-center gap-2 rounded-lg bg-item-theme border-theme-primary px-3 py-3 w-fit">
			<div className="w-4 h-4 border-2 border-textSecondary800 dark:border-textSecondary border-t-transparent rounded-full animate-spin" />
			<span className="text-xs text-theme-primary">{t('attachment.uploading')}</span>
		</div>
	);
}

export const MessageAudio: React.FC<MessageAudioProps> = React.memo(({ audioUrl, posInPopUp = false, isPresignPending = false }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number>(0);
	const audioControlRef = useRef<{ togglePlay: () => void }>(null);

	const handleTogglePlay = () => {
		if (audioControlRef.current) {
			audioControlRef.current.togglePlay();
		}
	};
	const handleSaveImage = async () => {
		try {
			const res = await fetch(audioUrl);
			if (!res.ok) throw new Error('Cannot fetch file');

			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = 'audio-file.mp3';
			document.body.appendChild(link);
			link.click();
			link.remove();

			URL.revokeObjectURL(blobUrl);
		} catch (err) {
			console.error('Download failed:', err);
		}
	};

	// After the hooks above, so the early return cannot change their order.
	if (isPresignPending) {
		return <AudioUploadingPill />;
	}

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
