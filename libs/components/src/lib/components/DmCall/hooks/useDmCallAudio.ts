import { audioCallActions, selectAudioBusyTone, selectAudioDialTone, selectAudioEndTone, selectAudioRingTone, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

export interface DmCallAudioHookReturn {
	isPlayDialTone: boolean;
	isPlayRingTone: boolean;
	isPlayEndTone: boolean;
	isPlayBusyTone: boolean;

	playDialTone: () => void;
	playRingTone: () => void;
	playEndTone: () => void;
	playBusyTone: () => void;
	stopAllAudio: () => void;
	stopDialTone: () => void;
	stopRingTone: () => void;
}

export const useDmCallAudio = (): DmCallAudioHookReturn => {
	const dispatch = useAppDispatch();

	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayRingTone = useSelector(selectAudioRingTone);
	const isPlayEndTone = useSelector(selectAudioEndTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);

	const dialTone = useRef(new Audio('assets/audio/dialtone.mp3'));
	const ringTone = useRef(new Audio('assets/audio/ringing.mp3'));
	const endTone = useRef(new Audio('assets/audio/endcall.mp3'));
	const busyTone = useRef(new Audio('assets/audio/busytone.mp3'));

	const playAudio = useCallback((audioRef: React.RefObject<HTMLAudioElement>, loop = true) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.loop = loop;

			setTimeout(() => {
				if (audioRef.current) {
					audioRef.current.play().catch((error) => {
						if (error.name !== 'AbortError') {
							console.error('Audio playback error:', error);
						}
					});
				}
			}, 10);
		}
	}, []);

	const stopAudio = useCallback((audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.loop = false;
		}
	}, []);

	const playDialTone = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(true));
	}, [dispatch]);

	const playRingTone = useCallback(() => {
		dispatch(audioCallActions.setIsRingTone(true));
	}, [dispatch]);

	const playEndTone = useCallback(() => {
		dispatch(audioCallActions.setIsEndTone(true));
	}, [dispatch]);

	const playBusyTone = useCallback(() => {
		dispatch(audioCallActions.setIsBusyTone(true));
	}, [dispatch]);

	const stopDialTone = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(false));
	}, [dispatch]);

	const stopRingTone = useCallback(() => {
		dispatch(audioCallActions.setIsRingTone(false));
	}, [dispatch]);

	const stopAllAudio = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
	}, [dispatch]);

	useEffect(() => {
		stopAudio(dialTone);
		stopAudio(ringTone);
		stopAudio(endTone);
		stopAudio(busyTone);

		if (isPlayDialTone) {
			playAudio(dialTone, true);
		} else if (isPlayRingTone) {
			playAudio(ringTone, true);
		} else if (isPlayEndTone) {
			playAudio(endTone, false);
		} else if (isPlayBusyTone) {
			playAudio(busyTone, true);
		}
	}, [isPlayDialTone, isPlayRingTone, isPlayEndTone, isPlayBusyTone, playAudio, stopAudio]);

	useEffect(() => {
		return () => {
			stopAudio(dialTone);
			stopAudio(ringTone);
			stopAudio(endTone);
			stopAudio(busyTone);
		};
	}, [stopAudio]);

	return {
		isPlayDialTone,
		isPlayRingTone,
		isPlayEndTone,
		isPlayBusyTone,

		playDialTone,
		playRingTone,
		playEndTone,
		playBusyTone,
		stopAllAudio,
		stopDialTone,
		stopRingTone
	};
};
