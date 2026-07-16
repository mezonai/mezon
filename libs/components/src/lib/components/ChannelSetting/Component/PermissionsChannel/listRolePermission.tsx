import { channelUsersActions, selectAllRolesClan, selectCurrentClanId, selectRolesByChannelId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { generateE2eId, DEFAULT_ROLE_COLOR } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
type ListRolePermissionProps = {
	channel: IChannel;
	selectedRoleIds: string[];
	setSelectedRoleIds?: (roleIds: string[]) => void;
};

const ListRolePermission = (props: ListRolePermissionProps) => {
	const { channel, selectedRoleIds, setSelectedRoleIds } = props;
	const { t } = useTranslation('common');
	const dispatch = useAppDispatch();
	const RolesChannel = useSelector(selectRolesByChannelId(channel.id));
	const currentClanId = useSelector(selectCurrentClanId);
	const RolesClan = useSelector(selectAllRolesClan);
	const activeChannelRoles = useMemo(
		() => RolesChannel.filter((role) => typeof role.role_channel_active === 'number' && role.role_channel_active === 1),
		[RolesChannel]
	);
	const rolesNotOnChannel = useMemo(
		() => RolesClan.filter((role) => !activeChannelRoles.some((channelRole) => channelRole.id === role.id)),
		[RolesClan, activeChannelRoles]
	);

	const listRolesInChannel = useMemo(() => {
		if (channel.channel_private === 1) {
			return activeChannelRoles;
		}
		return rolesNotOnChannel.filter((role) => props.selectedRoleIds.includes(role.id));
	}, [channel.channel_private, activeChannelRoles, rolesNotOnChannel, props.selectedRoleIds]);

	const deleteRole = async (roleId: string) => {
		setSelectedRoleIds?.(selectedRoleIds.filter((id) => id !== roleId));
		if (channel.channel_private !== 1) {
			return;
		}
		if (!activeChannelRoles.some((role) => role.id === roleId)) {
			return;
		}
		const body = {
			channelId: channel.id,
			clanId: currentClanId || '',
			roleId,
			channelType: channel.type
		};
		await dispatch(channelUsersActions.removeChannelRole(body));
	};
	return listRolesInChannel.length !== 0 ? (
		listRolesInChannel.map((role) => (
			<div
				className={`flex justify-between text-theme-primary py-2 rounded`}
				key={role.id}
				data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.role_list.role_item')}
			>
				<div className="flex gap-x-2 items-center">
					{role.role_icon ? (
						<img src={role.role_icon} alt="role icon" className="w-5 h-5 min-w-5 rounded" />
					) : (
						<Icons.RoleIcon className="w-5 h-5 min-w-5" defaultFill1={role.color || DEFAULT_ROLE_COLOR} />
					)}
					<p className="text-sm">{role.title}</p>
				</div>
				<div className="flex items-center gap-x-2">
					<p className="text-xs ">{t('role')}</p>
					<div onClick={() => deleteRole(role?.id || '')} role="button">
						<Icons.EscIcon className="size-[15px] cursor-pointer" />
					</div>
				</div>
			</div>
		))
	) : (
		<div className={`flex justify-between text-theme-primary py-2 rounded`}>
			<div className="flex gap-x-2 items-center">
				<Icons.RoleIcon className="w-5 h-5 min-w-5" />
				<p className="text-sm ">{t('noRoles')}</p>
			</div>
		</div>
	);
};

export default React.memo(ListRolePermission);
