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
import type { FlowerCelebrationHandle } from '../../MyVideoConference/Reaction/flowerCelebration';

interface ActiveApp {
	id: string;
	title: string;
	url: string;
}

export function useVoiceInteractiveListener(channelId?: string) {
	const dispatch = useAppDispatch();
	const { clientRef } = useMezon();
	const [activeApps, setActiveApps] = useState<ActiveApp[]>([]);
	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const playerRef = useRef<FlowerCelebrationHandle | null>(null);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const closeApp = (id: string) => {
		setActiveApps((prev) => prev.filter((a) => a.id !== id));
	};

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
		const socket = clientRef.current;
		if (!socket || !channelId) return;

		const handler = async (event: VoiceInteractiveEvent) => {
			if (event.voice_channel_id !== channelId) return;
			if (event.event_type === EVoiceInteractEvent.SENT_FLOWERS) {
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
				const channel = selectChannelByIdAndClanId(state, clanId, channelId);
				const clanName = seletClanNameById(state, clanId) ?? '';
				const urlWithHash = buildChannelAppLaunchUrl(app.url, {
					webAppData: hashData.web_app_data,
					clanId,
					clanName
				});

				const id = `${app.key}-${Date.now()}`;
				setActiveApps((prev) => [...prev, { id, title: clanName ? `${app.name} — ${channel.channel_label}` : app.name, url: urlWithHash }]);
			} catch (err) {
				console.error('[voice-interactive] failed to open app:', err);
			}
		};

		socket.onvoiceinteractiveevent = handler;
		return () => {
			if (socket.onvoiceinteractiveevent === handler) {
				socket.onvoiceinteractiveevent = () => {
					return;
				};
			}
		};
	}, [clientRef, channelId, dispatch]);

	return { activeApps, closeApp, currentSender, senderQueueRef, showNextSender, playerRef, senderTimeoutRef, isShowingSenderRef };
}
