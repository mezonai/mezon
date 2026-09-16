import { useEscapeKeyClose } from '@mezon/core';
import type { EVoiceInteractEvent } from '@mezon/store';
import {
	VOICE_INTERACTIVE_APPS,
	channelAppActions,
	getStore,
	selectAppInteractData,
	selectCurrentClanId,
	seletClanNameById,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { buildChannelAppLaunchUrl } from '@mezon/utils';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { useRef } from 'react';
import { useSelector } from 'react-redux';

interface SfuVoiceInteractiveMenuProps {
	channelId: string;
	onClose: () => void;
}

export const SfuVoiceInteractiveMenu = ({ channelId, onClose }: SfuVoiceInteractiveMenuProps) => {
	const interactAppData = useSelector(selectAppInteractData);

	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const handleOpenAppActive = async (event: VoiceInteractiveEvent) => {
		const app = VOICE_INTERACTIVE_APPS.find((a) => a.eventType === event.event_type);

		if (!app || !app.key || !app.url) return;

		try {
			const hashData = await dispatch(channelAppActions.generateAppUserHash({ appId: app.key })).unwrap();
			if (!hashData.web_app_data) return;

			const store = getStore();
			const state = store.getState();
			const clanId = event.clan_id ?? '';
			const params = event.params;
			const clanName = seletClanNameById(state, clanId) ?? '';
			const urlWithHash = buildChannelAppLaunchUrl(app.url, {
				webAppData: hashData.web_app_data,
				clanId,
				clanName,
				params
			});
			const id = `${app.key}`;
			dispatch(
				channelAppActions.setActiveApps({
					id,
					title: clanName ? `${app.name} — ${clanName}` : app.name,
					url: urlWithHash,
					zIndex: 9999
				})
			);
			return hashData;
		} catch (err) {
			console.error('[voice-interactive] failed to open app:', err);
			return false;
		}
	};
	const handleOpenApp = async (app: { eventType: EVoiceInteractEvent }) => {
		if (interactAppData) {
			const event = interactAppData?.find((a) => a.event_type === app.eventType);
			if (event) {
				handleOpenAppActive(event);
				onClose();
				return;
			}
		}
		try {
			const event = VOICE_INTERACTIVE_APPS.find((a) => a.eventType === app?.eventType);
			if (!event || !event.key || !event.url) return;

			// const hashData = await dispatch(channelAppActions.generateAppUserHash({ appId: event.key })).unwrap();
			// if (!hashData.web_app_data) return;

			const store = getStore();
			const state = store.getState();
			const clanId = currentClanId ?? '';
			const params = '';
			const clanName = seletClanNameById(state, clanId) ?? '';
			const urlWithHash = buildChannelAppLaunchUrl('https://www.youtube.com/', {
				webAppData: '',
				clanId,
				clanName,
				params
			});
			const id = `${event.key}`;
			dispatch(
				channelAppActions.setActiveApps({
					id,
					title: clanName ? `${event.name} — ${clanName}` : event.name,
					url: urlWithHash,
					zIndex: 9999
				})
			);
			dispatch(
				voiceActions.sendVoiceInteractiveEvent({
					event_type: app.eventType,
					clan_id: currentClanId ?? '',
					channel_id: channelId
				})
			);
			dispatch(
				channelAppActions.setAppInteractiveData({
					event_type: app.eventType,
					clan_id: currentClanId ?? '',
					voice_channel_id: channelId,
					sender_id: '',
					params: '',
					receiver_id: ''
				})
			);
		} catch (error) {
			console.error('error: ', error);
		}
		onClose();
	};
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="outline-none p-2 gap-1 flex flex-col bg-theme-setting-primary text-theme-primary overflow-hidden rounded-lg shadow-xl"
		>
			{VOICE_INTERACTIVE_APPS.map((app) => {
				const isActive = interactAppData?.some((data) => data.event_type === app.eventType);

				return (
					<div
						key={app.eventType}
						className={`relative flex justify-between gap-4 p-2 h-9 content-center text-sm rounded-lg hover:bg-zinc-700 hover:cursor-pointer ${isActive && 'border-green-400 border text-green-400 before:absolute before:top-0 before:right-0 before:rounded-lg before:h-full before:w-full before:bg-green-400/10 before:content-[""]'}`}
						onClick={() => handleOpenApp(app)}
					>
						<div className="w-20">{app.name}</div>
						{isActive && (
							<div>
								<svg width="16" height="16" viewBox="0 0 44 43" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M17.5638 5.66292C19.0564 3.59465 19.8027 2.56051 20.7566 2.26272C21.3388 2.08096 21.9625 2.08096 22.5447 2.26272C23.4985 2.56051 24.2448 3.59465 25.7375 5.66292L32.476 15L37.5354 22.0106C39.5497 24.8016 40.5568 26.1972 40.4144 27.3636C40.3284 28.0683 39.9952 28.7198 39.474 29.202C38.6116 30 36.8906 30 33.4485 30H9.85274C6.41072 30 4.6897 30 3.82725 29.202C3.3061 28.7198 2.97288 28.0683 2.88684 27.3636C2.74444 26.1972 3.75159 24.8016 5.76588 22.0106L17.5638 5.66292Z"
										fill="currentColor"
									/>
									<rect x="11.6506" y="33" width="20" height="10" rx="5" fill="currentColor" />
								</svg>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
