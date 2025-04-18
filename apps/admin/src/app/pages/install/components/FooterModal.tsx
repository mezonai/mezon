import { ClockIcon, LockIcon } from 'libs/ui/src/lib/Icons';
import { memo } from 'react';

type FooterModalProps = {
	name?: string;
};

const FooterModal = memo(({ name }: FooterModalProps) => {
	return (
		<div className="text-[#b9bbbe] text-xs space-y-3 p-4 bg-[#2b2d31]">
			<hr className="border-[#ffffff] my-3" />
			<div className="flex ">
				<LockIcon className="h-4 w-4 text-[#b9bbbe]" />
				<p className='text-[#b9bbbe]'>
					The Privacy Policy and Terms of Service of { }<span className="text-white font-semibold">{name}</span>&apos;s { }developer apply.
				</p>
			</div>
			<div className="flex items-center gap-x-2">
				<ClockIcon className="h-4 w-4 text-[#b9bbbe]" />
				<p className="text-[#b9bbbe]">Active since 20 Aug 2024</p>
			</div>
		</div>
	);
});

export default FooterModal;
