import { DEFAULT_ROLE_COLOR, generateE2eId } from '@mezon/utils';
import React from 'react';

interface IRoleNameCardProps {
	roleName: string;
	roleColor: string;
	roleIcon: string;
	classNames?: string;
}

const RoleNameCard: React.FC<IRoleNameCardProps> = ({ roleName, roleColor, roleIcon, classNames }) => {
	return (
		<span
			className={`inline-flex gap-x-1 items-center text-xs rounded p-1 hoverIconBlackImportant truncate max-w-24 ${classNames} `}
			style={{ backgroundColor: `${roleColor || DEFAULT_ROLE_COLOR}50` }}
		>
			<div className="text-transparent size-3 rounded-full flex-shrink-0" style={{ backgroundColor: roleColor || DEFAULT_ROLE_COLOR }} />
			{roleIcon && <img src={roleIcon} alt="" className="size-3 flex-shrink-0" />}
			<span
				className="text-xs font-medium px-1 truncate max-w-16 leading-[15px]"
				data-e2e={generateE2eId('clan_page.member_list.role_settings.exist_role.role_name')}
			>
				{roleName}
			</span>
		</span>
	);
};

export default RoleNameCard;
