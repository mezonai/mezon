import {
	EVoiceInteractEvent,
	VOICE_INTERACTIVE_APPS,
	channelAppActions,
	getStore,
	selectChannelByIdAndClanId,
	seletClanNameById,
	useAppDispatch
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { buildChannelAppLaunchUrl } from '@mezon/utils';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowerCelebrationHandle } from '../../../VoiceChannel/MyVideoConference/Reaction/flowerCelebration';

interface ActiveApp {
	id: string;
	title: string;
	url: string;
	zIndex: number;
}

const BASE_Z = 9999;

export function useSfuVoiceInteractiveListener(channelId?: string) {
	const dispatch = useAppDispatch();
	const { clientRef } = useMezon();
	const [activeApps, setActiveApps] = useState<ActiveApp[]>([]);
	const zCounterRef = useRef(BASE_Z);
	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const playerRef = useRef<FlowerCelebrationHandle | null>(null);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const closeApp = (id: string) => {
		setActiveApps((prev) => prev.filter((a) => a.id !== id));
	};

	const focusApp = useCallback((id: string) => {
		setActiveApps((prev) => {
			const current = prev.find((a) => a.id === id);
			if (current && current.zIndex === zCounterRef.current) return prev;

			zCounterRef.current += 1;
			const newZ = zCounterRef.current;
			return prev.map((a) => (a.id === id ? { ...a, zIndex: newZ } : a));
		});
	}, []);

	const playFlowerCelebrationSound = useCallback(() => {
		try {
			const audio = new Audio('/assets/audio/bankSound.mp3');
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
					playFlowerCelebrationSound();
					playerRef.current?.play();
					senderQueueRef.current.push(event);
					showNextSender();
					return;
				}

				const app = VOICE_INTERACTIVE_APPS.find((a) => a.eventType === event.event_type);
				if (!app || !app.key || !app.url) return;

				try {
					const hashData = await dispatch(channelAppActions.generateAppUserHash({ appId: app.key })).unwrap();
					if (!hashData.web_app_data) return;

					const store = getStore();
					const state = store.getState();
					const clanId = event.clan_id ?? '';
					const params = event.params;
					const channel = selectChannelByIdAndClanId(state, clanId, channelId);
					const clanName = seletClanNameById(state, clanId) ?? '';
					const urlWithHash = buildChannelAppLaunchUrl(app.url, {
						webAppData: hashData.web_app_data,
						clanId,
						clanName,
						params
					});
					const id = `${app.key}-${Date.now()}`;
					zCounterRef.current += 1;
					setActiveApps((prev) => [
						...prev,
						{
							id,
							title: clanName ? `${app.name} — ${channel?.channel_label || ''}` : app.name,
							url: urlWithHash,
							zIndex: zCounterRef.current
						}
					]);
				} catch (err) {
					console.error('[voice-interactive] failed to open app:', err);
				}
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

	useEffect(() => {
		const handleFlowerReaction = (rawEvent: Event) => {
			const event = (rawEvent as CustomEvent<VoiceInteractiveEvent>).detail;
			if (event?.voice_channel_id !== channelId) return;
			playFlowerCelebrationSound();
			playerRef.current?.play();
			senderQueueRef.current.push(event);
			showNextSender();
		};
		window.addEventListener('mezon-sfu-flower', handleFlowerReaction);
		return () => window.removeEventListener('mezon-sfu-flower', handleFlowerReaction);
	}, [channelId, playFlowerCelebrationSound, showNextSender]);

	return { activeApps, closeApp, focusApp, currentSender, senderQueueRef, showNextSender, playerRef, senderTimeoutRef, isShowingSenderRef };
}
