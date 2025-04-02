import { Icons } from '@mezon/ui';
import React from 'react';

type HeaderProps = {
	name?: string;
	handleShowModalClan: () => void;
	isShowModalPanelClan: boolean;
	modalRef: React.RefObject<HTMLDivElement>;
	children: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ name, handleShowModalClan, isShowModalPanelClan, modalRef, children }) => {
	return (
		<div ref={modalRef} tabIndex={-1} className={`outline-none h-[50px] relative bg-gray-950`}>
			<div className={`relative h-[50px] top-0`} onClick={handleShowModalClan}>
				<div
					className={`cursor-pointer w-full p-3 left-0 top-0 absolute flex h-heightHeader justify-between items-center gap-2 dark:bg-bgSecondary bg-bgLightSecondary dark:hover:bg-[#35373C] hover:bg-[#E2E7F6] shadow border-b-[1px] dark:border-bgTertiary border-bgLightSecondary`}
				>
					<p className="dark:text-white text-black text-base font-semibold select-none one-line">{name?.toLocaleUpperCase()}</p>
					<button className="w-6 h-8 flex flex-col justify-center">
						<Icons.ArrowDown />
					</button>
				</div>
				{isShowModalPanelClan && children}
			</div>
		</div>
	);
};

export default Header;
