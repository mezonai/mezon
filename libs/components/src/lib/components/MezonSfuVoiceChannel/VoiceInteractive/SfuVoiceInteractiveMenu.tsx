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
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { buildChannelAppLaunchUrl, generateE2eId } from '@mezon/utils';
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

			const hashData = await dispatch(channelAppActions.generateAppUserHash({ appId: event.key })).unwrap();
			if (!hashData.web_app_data) return;

			const store = getStore();
			const state = store.getState();
			const clanId = currentClanId ?? '';
			const params = '';
			const clanName = seletClanNameById(state, clanId) ?? '';
			const urlWithHash = buildChannelAppLaunchUrl(event.url, {
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
						data-e2e={generateE2eId('clan_page.screen.voice_room.interactive_apps.item', app.name.toLowerCase())}
						className={`mz-hover relative flex justify-between gap-4 p-2 h-9 content-center text-sm rounded-lg bg-item-theme-hover hover:cursor-pointer ${isActive && 'border-green-400 border text-green-400 before:absolute before:top-0 before:right-0 before:rounded-lg before:h-full before:w-full before:bg-green-400/10 before:content-[""]'}`}
						onClick={() => handleOpenApp(app)}
					>
						<div className="w-20">{app.name}</div>
						{isActive && (
							<div>
								<MezonIcon icon={MzIcons16.mzCheck} />
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
