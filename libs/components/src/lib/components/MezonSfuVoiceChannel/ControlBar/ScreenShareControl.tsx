import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

export const ScreenShareControl = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => {
	const { t } = useTranslation('channelVoice');
	return (
		<button
			id="btn-meet-screen"
			type="button"
			title={t(active ? 'stopScreenShare' : 'shareYourScreen')}
			aria-label={t(active ? 'stopScreenShare' : 'shareYourScreen')}
			className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-blue-500' : ''}`}
			onClick={onToggle}
		>
			{active ? <Icons.VoiceScreenShareStopIcon /> : <Icons.VoiceScreenShareIcon />}
		</button>
	);
};
