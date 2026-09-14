import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

export const LeaveButton = ({ onLeave }: { onLeave: () => void }) => {
	const { t } = useTranslation('channelVoice');
	return (
		<button
			id="btn-meet-leave"
			type="button"
			title={t('disconnect')}
			aria-label={t('disconnect')}
			className={`${SFU_CONTROL_BUTTON_CLASS} !bg-[#da373c] hover:!bg-[#a12829]`}
			onClick={onLeave}
		>
			<Icons.EndCall className="h-6 w-6" />
		</button>
	);
};
