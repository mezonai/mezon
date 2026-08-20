import { useEscapeKeyClose } from '@mezon/core';
import type { EVoiceInteractEvent } from '@mezon/store';
import { selectCurrentClanId, useAppDispatch, VOICE_INTERACTIVE_APPS, voiceActions } from '@mezon/store';
import { useRef } from 'react';
import { useSelector } from 'react-redux';

interface VoiceInteractiveMenuProps {
	channelId: string;
	onClose: () => void;
}

const VoiceInteractiveMenu = ({ channelId, onClose }: VoiceInteractiveMenuProps) => {
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const handleOpenApp = (app: { eventType: EVoiceInteractEvent }) => {
		dispatch(
			voiceActions.sendVoiceInteractiveEvent({
				event_type: app.eventType,
				clan_id: currentClanId ?? '',
				channel_id: channelId
			})
		);
		onClose();
	};

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="outline-none flex flex-col bg-theme-setting-primary text-theme-primary overflow-hidden rounded-lg shadow-xl"
		>
			{VOICE_INTERACTIVE_APPS.map((app) => (
				<div
					key={app.eventType}
					className="p-3 h-10 content-center text-sm hover:bg-zinc-700 hover:cursor-pointer"
					onClick={() => handleOpenApp(app)}
				>
					{app.name}
				</div>
			))}
		</div>
	);
};

export default VoiceInteractiveMenu;
