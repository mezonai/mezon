import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

interface PushToTalkHintProps {
	active: boolean;
	onDismiss?: () => void;
}

export const PushToTalkHint = ({ active, onDismiss }: PushToTalkHintProps) => {
	const { t } = useTranslation('channelVoice');
	const accent = active ? 'text-green-400' : 'text-yellow-400';

	return (
		<div className="pointer-events-none absolute bottom-full left-[-16px] z-30 mb-[7px] w-80 max-md:hidden">
			<div className="pointer-events-auto relative rounded-lg border border-white/10 bg-zinc-800 p-4 text-left shadow-xl">
				<div className="flex items-center gap-2">
					<Icons.InPttCall className={`h-[18px] w-[18px] shrink-0 ${accent}`} />
					<span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
						{t(active ? 'pushToTalk.holdingSpace' : 'pushToTalk.holdSpace')}
					</span>
					<button
						type="button"
						aria-label="Close"
						className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
						onClick={onDismiss}
					>
						<Icons.Close className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-2 text-xs text-white/70">{t('pushToTalk.hintBody')}</p>
				<span
					aria-hidden="true"
					className="absolute -bottom-[5px] left-[40px] h-2 w-2 rotate-45 border-b border-r border-white/10 bg-zinc-800"
				/>
			</div>
		</div>
	);
};
