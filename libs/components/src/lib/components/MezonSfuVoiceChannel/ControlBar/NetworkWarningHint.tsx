import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

interface NetworkWarningHintProps {
	onDismiss: () => void;
}

export const NetworkWarningHint = ({ onDismiss }: NetworkWarningHintProps) => {
	const { t } = useTranslation('channelVoice');

	return (
		<div className="pointer-events-none absolute bottom-full left-[-16px] z-30 mb-1 w-80 max-md:hidden">
			<div role="status" className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-[#fde8d7] p-4 text-left text-[#202124] shadow-xl">
				<p className="min-w-0 flex-1 text-sm leading-5">{t('networkWarning')}</p>
				<button
					type="button"
					aria-label={t('mediaPermission.close')}
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#202124]/70 hover:bg-black/5 hover:text-[#202124]"
					onClick={onDismiss}
				>
					<Icons.Close className="h-4 w-4" />
				</button>
			</div>
			<svg className="ml-[38px] block h-[6px] w-3 text-[#fde8d7]" viewBox="0 0 12 6" fill="currentColor" aria-hidden="true">
				<path d="M6 6 0 0h12Z" />
			</svg>
		</div>
	);
};
