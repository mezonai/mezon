import { audioCallActions, selectAudioBusyTone, selectAudioDialTone, selectAudioEndTone, selectAudioRingTone, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

export interface AudioToneType {
	DIAL: 'dial';
	RING: 'ring';
	END: 'end';
	BUSY: 'busy';
}

export const AUDIO_TONE_TYPES: AudioToneType = {
	DIAL: 'dial',
	RING: 'ring',
	END: 'end',
	BUSY: 'busy'
} as const;

export interface GroupCallAudioHookReturn {
	playDialTone: () => void;
	playRingTone: () => void;
	playEndTone: () => void;
	playBusyTone: () => void;
	stopAllAudio: () => void;
}

const AUDIO_FILES = {
	dial: '/assets/audio/dialtone.mp3',
	ring: '/assets/audio/ringing.mp3',
	end: '/assets/audio/endcall.mp3',
	busy: '/assets/audio/busytone.mp3'
};

const AUDIO_DELAY = 10;

export const useGroupCallAudio = (): GroupCallAudioHookReturn => {
	const dispatch = useAppDispatch();

	// Selectors
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayRingTone = useSelector(selectAudioRingTone);
	const isPlayEndTone = useSelector(selectAudioEndTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const dialTone = useRef<HTMLAudioElement | null>(null);
	const ringTone = useRef<HTMLAudioElement | null>(null);
	const endTone = useRef<HTMLAudioElement | null>(null);
	const busyTone = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!dialTone.current) {
			dialTone.current = new Audio(AUDIO_FILES.dial);
		}
		if (!ringTone.current) {
			ringTone.current = new Audio(AUDIO_FILES.ring);
		}
		if (!endTone.current) {
			endTone.current = new Audio(AUDIO_FILES.end);
		}
		if (!busyTone.current) {
			busyTone.current = new Audio(AUDIO_FILES.busy);
		}

		return () => {
			if (dialTone.current) {
				dialTone.current.pause();
				dialTone.current = null;
			}
			if (ringTone.current) {
				ringTone.current.pause();
				ringTone.current = null;
			}
			if (endTone.current) {
				endTone.current.pause();
				endTone.current = null;
			}
			if (busyTone.current) {
				busyTone.current.pause();
				busyTone.current = null;
			}
		};
	}, []);

	const playAudio = useCallback((audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.loop = true;

			setTimeout(() => {
				if (audioRef.current) {
					audioRef.current.play().catch(() => {
						// Handle audio playback errors silently
					});
				}
			}, AUDIO_DELAY);
		}
	}, []);

	const stopAudio = useCallback((audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.loop = false;
		}
	}, []);

	const stopAllAudio = useCallback(() => {
		stopAudio(dialTone);
		stopAudio(ringTone);
		stopAudio(endTone);
		stopAudio(busyTone);
	}, [stopAudio]);

	const playDialTone = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(true));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
	}, [dispatch]);

	const playRingTone = useCallback(() => {
		dispatch(audioCallActions.setIsRingTone(true));
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
	}, [dispatch]);

	const playEndTone = useCallback(() => {
		dispatch(audioCallActions.setIsEndTone(true));
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
	}, [dispatch]);

	const playBusyTone = useCallback(() => {
		dispatch(audioCallActions.setIsBusyTone(true));
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
	}, [dispatch]);

	const stopAllTones = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
		stopAllAudio();
	}, [dispatch, stopAllAudio]);

	// Audio playback effect
	useEffect(() => {
		stopAllAudio();

		if (isPlayDialTone) {
			playAudio(dialTone);
		} else if (isPlayRingTone) {
			playAudio(ringTone);
		} else if (isPlayEndTone) {
			if (endTone.current) {
				endTone.current.loop = false;
				setTimeout(() => {
					if (endTone.current) {
						endTone.current.play().catch(() => {});
					}
				}, AUDIO_DELAY);
			}
		} else if (isPlayBusyTone) {
			if (busyTone.current) {
				busyTone.current.loop = true;
				setTimeout(() => {
					if (busyTone.current) {
						busyTone.current.play().catch(() => {});
					}
				}, AUDIO_DELAY);
			}
		}
	}, [isPlayDialTone, isPlayRingTone, isPlayEndTone, isPlayBusyTone, playAudio, stopAllAudio]);

	useEffect(() => {
		return () => {
			stopAllAudio();
		};
	}, [stopAllAudio]);

	return {
		playDialTone,
		playRingTone,
		playEndTone,
		playBusyTone,
		stopAllAudio: stopAllTones
	};
};
