import { VOICE_INTERACTIVE_APPS, channelAppActions, getStore, selectChannelByIdAndClanId, seletClanNameById, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { buildChannelAppLaunchUrl } from '@mezon/utils';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { useEffect, useState } from 'react';

interface ActiveApp {
	id: string;
	title: string;
	url: string;
}

export function useVoiceInteractiveListener(channelId?: string) {
	const dispatch = useAppDispatch();
	const { clientRef } = useMezon();
	const [activeApps, setActiveApps] = useState<ActiveApp[]>([]);

	const closeApp = (id: string) => {
		setActiveApps((prev) => prev.filter((a) => a.id !== id));
	};

	useEffect(() => {
		const socket = clientRef.current;
		if (!socket || !channelId) return;

		const handler = async (event: VoiceInteractiveEvent) => {
			if (event.voice_channel_id !== channelId) return;
			const app = VOICE_INTERACTIVE_APPS.find((a) => a.eventType === event.event_type);
			if (!app || !app.key || !app.url) return;

			try {
				const hashData = await dispatch(channelAppActions.generateAppUserHash({ appId: app.key })).unwrap();
				console.log('hashData: ', hashData);
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
				console.log('urlWithHash: ', urlWithHash);

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

	return { activeApps, closeApp };
}
