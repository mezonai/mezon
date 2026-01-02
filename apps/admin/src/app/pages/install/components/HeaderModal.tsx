import { memo } from 'react';

type HeaderModalProps = {
	name?: string;
	username?: string;
};

const HeaderModal = memo(({ name, username }: HeaderModalProps) => {
	return (
		<div className="p-4 pb-0 bg-[#f9fafb] text-[#111827] dark:bg-[#1e1f22] dark:text-[#d1d5db] text-center">
			<p className="text-sm font-medium">An external application</p>

			<h3 className="font-bold text-2xl text-[#facc15] mt-1 truncate max-w-[300px] mx-auto" title={name}>
				{name}
			</h3>

			<p className="text-sm mt-2">wants to access your Mezon account</p>

			<p className="text-xs mt-2">
				Signed in as <span className="font-bold text-[#16a34a]">{username}</span>
				<a href="#" className="text-[#2563eb] hover:underline ml-1">
					Not you?
				</a>
			</p>

			<hr className="my-4 border-[#d1d5db] dark:border-[#374151]" />
		</div>
	);
});

export default HeaderModal;
