import { selectBadgeCountByClanId } from '@mezon/store';
import { Image } from '@mezon/ui';
import { IClan } from '@mezon/utils';
import { useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import NavLinkComponent from '../NavLink';

export type SidebarClanItemProps = {
	option: IClan;
	linkClan: string;
	active?: boolean;
};

const SidebarClanItem = ({ option, linkClan, active }: SidebarClanItemProps) => {
	const badgeCountClan = useSelector(selectBadgeCountByClanId(option.clan_id ?? '')) || 0;
	const location = useLocation();
	const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (location.pathname.includes(linkClan)) {
			event.preventDefault();
		}
	};
	return (
		<div className="relative">
			<NavLink to={linkClan} onClick={handleClick}>
				<NavLinkComponent active={active}>
					{option.logo ? (
						<Image
							src={option.logo || ''}
							alt={option.clan_name || ''}
							placeholder="blur"
							width={48}
							blurdataurl={option.logo}
							className="min-w-12 min-h-12 object-cover clan"
						/>
					) : (
						option.clan_name && (
							<div className="w-[48px] h-[48px] dark:bg-bgTertiary bg-bgLightMode rounded-full flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[20px] clan">
								{(option.clan_name || '').charAt(0).toUpperCase()}
							</div>
						)
					)}
				</NavLinkComponent>
			</NavLink>
			{badgeCountClan > 0 ? (
				<div className="w-[20px] h-[20px] flex items-center justify-center text-[13px] font-medium rounded-full bg-colorDanger absolute bottom-[-3px] right-[-3px] border-[2px] border-solid dark:border-bgPrimary border-white">
					{badgeCountClan > 99 ? '99+' : badgeCountClan}
				</div>
			) : null}
		</div>
	);
};

export default SidebarClanItem;
