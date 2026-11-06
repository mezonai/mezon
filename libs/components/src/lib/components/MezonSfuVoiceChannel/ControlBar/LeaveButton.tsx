import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
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
			data-e2e={generateE2eId('icon.end_call')}
		>
			<MezonIcon icon={MzIcons24.mzCallEnd} className="max-md:hidden" />
			<MezonIcon icon={MzIcons20.mzCallEnd} className="hidden max-md:block" />
		</button>
	);
};
