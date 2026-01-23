import { ClockIcon, LockIcon } from '@mezon/ui/lib/Icons/icons';
import { memo } from 'react';

type FooterModalProps = {
	name?: string;
};

const FooterModal = memo(({ name }: FooterModalProps) => {
	return (
		<div className="text-xs space-y-3 p-4 bg-[#f9fafb] dark:bg-[#1e1f22]">
			<hr className="my-3 border-[#d1d5db] dark:border-[#4b5563]" />
			<div className="flex gap-x-2 items-start">
				<LockIcon className="h-4 w-4 text-[#4b5563] dark:text-[#9ca3af]" />
				<p className="text-[#4b5563] dark:text-[#9ca3af]">
					The Privacy Policy and Terms of Service of <span className="text-[#111827] dark:text-[#d1d5db] font-semibold">{name}</span>&apos;s
					developer apply.
				</p>
			</div>
			<div className="flex gap-x-2 items-start">
				<ClockIcon className="h-4 w-4 text-[#4b5563] dark:text-[#9ca3af]" />
				<p className="text-[#4b5563] dark:text-[#9ca3af]">Active since 20 Aug 2024</p>
			</div>
		</div>
	);
});

export default FooterModal;
