import { EVoiceInteractEvent, channelAppActions, selectActiveApps, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { FlowerCelebrationHandle } from '../../MyVideoConference/Reaction/flowerCelebration';

const BASE_Z = 9999;

export function useSfuVoiceInteractiveListener(channelId?: string) {
	const dispatch = useAppDispatch();
	const { clientRef } = useMezon();
	const activeApps = useSelector(selectActiveApps);
	const zCounterRef = useRef(BASE_Z);
	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const playerRef = useRef<FlowerCelebrationHandle | null>(null);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const closeApp = (id: string) => {
		dispatch(channelAppActions.closeActiveApps(id));
	};

	const focusApp = useCallback((id: string) => {}, []);

	const playFlowerCelebrationSound = useCallback(() => {
		try {
			const audio = new Audio('/chat/assets/audio/give-flower.mp3');
			audio.volume = 0.5;
			audio.play().catch((err) => {
				console.error('[flower sound play error]', err);
			});
		} catch (e) {
			console.error('[flower sound error]', e);
		}
	}, []);

	const showNextSender = useCallback(() => {
		if (isShowingSenderRef.current) return;

		const event = senderQueueRef.current.shift();

		if (!event) {
			setCurrentSender(null);
			return;
		}

		isShowingSenderRef.current = true;
		setCurrentSender(event);

		senderTimeoutRef.current = window.setTimeout(() => {
			senderTimeoutRef.current = null;
			isShowingSenderRef.current = false;
			setCurrentSender(null);

			showNextSender();
		}, 2000);
	}, []);

	useEffect(() => {
		let activeSocket: typeof clientRef.current;
		let activeHandler: ((event: VoiceInteractiveEvent) => void) | undefined;

		const attachListener = () => {
			const socket = clientRef.current;
			if (!socket || !channelId || (socket === activeSocket && socket.onvoiceinteractiveevent === activeHandler)) return;

			if (activeSocket && activeHandler && activeSocket.onvoiceinteractiveevent === activeHandler) {
				activeSocket.onvoiceinteractiveevent = () => undefined;
			}

			const handler = async (event: VoiceInteractiveEvent) => {
				if (event.voice_channel_id !== channelId) return;
				if (event.event_type === EVoiceInteractEvent.SENT_FLOWERS) {
					playerRef.current?.play();
					senderQueueRef.current.push(event);
					showNextSender();
					return;
				}
				dispatch(channelAppActions.setAppInteractiveData(event));
			};

			socket.onvoiceinteractiveevent = handler;
			activeSocket = socket;
			activeHandler = handler;
		};

		attachListener();
		const intervalId = window.setInterval(attachListener, 500);
		return () => {
			window.clearInterval(intervalId);
			if (activeSocket && activeHandler && activeSocket.onvoiceinteractiveevent === activeHandler) {
				activeSocket.onvoiceinteractiveevent = () => undefined;
			}
		};
	}, [clientRef, channelId, dispatch, playFlowerCelebrationSound, showNextSender]);

	return { activeApps, closeApp, focusApp, currentSender, senderQueueRef, showNextSender, playerRef, senderTimeoutRef, isShowingSenderRef };
}
