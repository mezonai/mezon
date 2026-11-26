import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import React from 'react';
import { ClanProBadge } from '../ProfileBadges';

type HeaderProps = {
	name?: string;
	isPro?: boolean;
	handleShowModalClan: () => void;
	isShowModalPanelClan: boolean;
	modalRef: React.RefObject<HTMLDivElement>;
	children: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ name, isPro, handleShowModalClan, isShowModalPanelClan, modalRef, children }) => {
	return (
		<div ref={modalRef} tabIndex={-1} className={`outline-none h-[50px] relative border-b-theme-primary`}>
			<div className={`relative h-[50px] top-0`} onClick={handleShowModalClan}>
				<div
					className={`cursor-pointer w-full p-3 left-0 top-0 absolute flex h-heightHeader justify-between items-center gap-2 bg-item-hover `}
					data-e2e={generateE2eId('clan_page.header.title.clan_name')}
				>
					<div className="flex items-center gap-1.5 min-w-0">
						<p className="text-theme-primary-active text-base font-semibold select-none one-line min-w-0">{name?.toLocaleUpperCase()}</p>
						{isPro && <ClanProBadge className="shrink-0" />}
					</div>
					<button className="w-6 h-8 flex flex-col justify-center text-theme-primary text-theme-primary-hover group/mzi">
						<MezonIcon icon={MzIcons20.mzChevronDown} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
					</button>
				</div>
				{isShowModalPanelClan && children}
			</div>
		</div>
	);
};

export default Header;
