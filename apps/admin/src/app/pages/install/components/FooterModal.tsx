import { ClockIcon, LockIcon } from '@mezon/ui/lib/Icons/icons';
import { memo } from 'react';

type FooterModalProps = {
	name?: string;
	activeSince?: string;
};

const FooterModal = memo(({ name, activeSince }: FooterModalProps) => {
	return (
		<div className="text-[11px] space-y-2 p-0 bg-transparent w-full flex flex-col">
			<div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#22263a]/80 to-transparent my-1" />

			<div className="flex gap-x-2 items-start text-left">
				<LockIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />

				<p className="text-slate-500 dark:text-slate-400 leading-snug font-medium">
					The Privacy Policy and Terms of Service of{' '}
					<span
						className="inline-block align-bottom truncate overflow-hidden max-w-[120px] text-slate-900 dark:text-slate-200 font-bold"
						title={name}
					>
						{name}
					</span>
					&apos;s developer apply.
				</p>
			</div>

			<div className="flex gap-x-2 items-center text-left">
				<ClockIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
				<p className="text-slate-500 dark:text-slate-400 font-medium">
					Active since: <span className="font-bold text-slate-800 dark:text-slate-300">{activeSince}</span>
				</p>
			</div>
		</div>
	);
});

export default FooterModal;
