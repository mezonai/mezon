import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type AudioControlProps = {
	audioUrl: string;
	setDuration: (duration: number) => void;
	setCurrentTime: (currentTime: number) => void;
	setIsPlaying: (isPlaying: boolean) => void;
	isPlaying: boolean;
};

export const MessageAudioControl = forwardRef((props: AudioControlProps, ref) => {
	const { audioUrl, setDuration, setCurrentTime, setIsPlaying, isPlaying } = props;
	// const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	useImperativeHandle(ref, () => ({
		togglePlay: () => {
			if (!audioRef.current) return;
			if (isPlaying) {
				audioRef.current.pause();
				setIsPlaying(false);
			} else {
				audioRef.current
					.play()
					.then(() => setIsPlaying(true))
					.catch((error) => {
						console.error('Error while playing audio:', error);
					});
			}
		}
	}));

	const handleTimeUpdate = () => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
		}
	};

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleError = (e: Event) => {
			console.error('Audio element encountered an error:', e);
		};

		audio.addEventListener('error', handleError);

		return () => {
			audio.removeEventListener('error', handleError);
		};
	}, [audioUrl]);

	useEffect(() => {
		const audio = audioRef.current;
		return () => {
			if (audio) {
				audio.pause();
				audio.removeAttribute('src');
				audio.load();
			}
		};
	}, []);

	// The element below already has the file open, and its metadata carries the
	// duration. Reading it there costs nothing extra and, unlike fetch(), needs no
	// CORS header from the media host — a host that does not send one made every
	// clip read "0:00 / 0:00". Downloading the whole clip for its length also meant
	// a channel full of voice messages fetched all of them on render.
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const readDuration = () => {
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				setDuration(Math.floor(audio.duration));
				return true;
			}
			return false;
		};

		if (readDuration()) return;

		// A stream written without a duration in its header (webm/opus from a
		// browser recorder) reports Infinity until it is seeked to the end.
		const handleLoadedMetadata = () => {
			if (readDuration()) return;
			const onSeeked = () => {
				readDuration();
				audio.currentTime = 0;
				audio.removeEventListener('seeked', onSeeked);
			};
			audio.addEventListener('seeked', onSeeked);
			try {
				audio.currentTime = Number.MAX_SAFE_INTEGER;
			} catch {
				audio.removeEventListener('seeked', onSeeked);
			}
		};

		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		return () => {
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
		};
	}, [audioUrl, setDuration]);

	return (
		<audio
			ref={audioRef}
			src={audioUrl}
			preload="metadata"
			onEnded={() => setIsPlaying(false)}
			className="hidden"
			onTimeUpdate={handleTimeUpdate}
		/>
	);
});
