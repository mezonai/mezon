import { memo } from 'react';

type HeaderModalProps = {
	name?: string;
	username?: string;
	isModalTry?: boolean;
};

const HeaderModal = memo(({ name, username }: HeaderModalProps) => {
	return (
		<div className="text-[#b9bbbe] bg-[#313338] p-4 pb-0">
			<p className="text-sm font-medium">An external application</p>
			<h3 className="font-bold text-2xl text-[#ffe96e] mt-1">{name}</h3>
			<p className="text-sm mt-2 text-[#dcddde]">wants to access your Mezon account</p>
			<p className="text-xs mt-2 text-[#b9bbbe]">
				Signed in as <span className="text-[#23a55a] font-bold">{username}</span>
				<a href="#" className="text-[#00aff4] hover:underline ml-1">
					Not you?
				</a>
			</p>
			<hr className="border-[#ffffff] my-4" />
		</div>
	);
});

export default HeaderModal;
