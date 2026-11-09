import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

interface NetworkWarningHintProps {
	onDismiss: () => void;
}

export const NetworkWarningHint = ({ onDismiss }: NetworkWarningHintProps) => {
	const { t } = useTranslation('channelVoice');

	return (
		<div className="pointer-events-none absolute bottom-full left-[-16px] z-30 mb-1 w-[352px] max-md:hidden">
			<div
				role="status"
				className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#fde8d7] py-3 pl-4 pr-3 text-left text-[#202124] shadow-xl"
			>
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b45309]/15 text-[#b45309]">
					<MezonIcon icon={MzIcons20.mzWarning} />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold leading-5">{t('networkWarning.title')}</p>
					<p className="text-xs leading-4 text-[#202124]/75">{t('networkWarning.body')}</p>
				</div>
				<button
					type="button"
					aria-label={t('mediaPermission.close')}
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#202124]/70 hover:bg-black/5 hover:text-[#202124]"
					onClick={onDismiss}
				>
					<MezonIcon icon={MzIcons16.mzClose} />
				</button>
			</div>
			<svg className="ml-[38px] block h-[6px] w-3 text-[#fde8d7]" viewBox="0 0 12 6" fill="currentColor" aria-hidden="true">
				<path d="M6 6 0 0h12Z" />
			</svg>
		</div>
	);
};
