import { AvatarImage, Coords, ModalRemoveMemberClan, PanelMember } from '@mezon/components';
import { useChannelMembersActions, useMemberContext, useOnClickOutside, usePermissionChecker, useRoles } from '@mezon/core';
import {
	RolesClanEntity,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectRolesClanEntities,
	selectTheme,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	usersClanActions
} from '@mezon/store';
import { HighlightMatchBold, Icons } from '@mezon/ui';
import { ChannelMembersEntity, DEFAULT_ROLE_COLOR, EPermission, EVERYONE_ROLE_ID, createImgproxyUrl } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { MouseEvent, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import RoleNameCard from './RoleNameCard';

type TableMemberItemProps = {
	userId: string;
	username: string;
	avatar: string;
	clanJoinTime?: string;
	mezonJoinTime?: string;
	displayName: string;
};

const TableMemberItem = ({ userId, username, avatar, clanJoinTime, mezonJoinTime, displayName }: TableMemberItemProps) => {
	const rolesClanEntity = useSelector(selectRolesClanEntities);

	const appearanceTheme = useSelector(selectTheme);
	const userRolesClan = useMemo(() => {
		const activeRole: Record<string, string> = {};
		let userRoleLength = 0;
		const userRoles = [];

		for (const key in rolesClanEntity) {
			const role = rolesClanEntity[key];
			const checkHasRole = rolesClanEntity[key].role_user_list?.role_users?.some((listUser) => listUser.id === userId);
			if (checkHasRole) {
				activeRole[key] = key;
				userRoleLength++;
				userRoles.push(role);
			}
		}

		userRoles.sort((a, b) => {
			const aPermission = a.max_level_permission ?? 0;
			const bPermission = b.max_level_permission ?? 0;
			return bPermission - aPermission;
		});

		return {
			usersRole: activeRole,
			length: userRoleLength,
			sortedRoles: userRoles
		};
	}, [userId, rolesClanEntity]);

	const { searchQuery } = useMemberContext();

	const [hasClanPermission] = usePermissionChecker([EPermission.manageClan]);

	const itemRef = useRef<HTMLDivElement>(null);
	const [openModalRemoveMember, setOpenModalRemoveMember] = useState<boolean>(false);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);

	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [openPanelMember, closePanelMember] = useModal(() => {
		const member: ChannelMembersEntity = {
			id: userId,
			user_id: userId,
			user: {
				username: username,
				id: userId
			}
		};
		return (
			<PanelMember coords={coords} onClose={closePanelMember} onRemoveMember={handleClickRemoveMember} isMemberChannel={true} member={member} />
		);
	}, [coords]);

	const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
		setCoords({
			mouseX: e.clientX,
			mouseY: e.clientY,
			distanceToBottom: window.innerHeight - e.clientY
		});
		openPanelMember();
	};

	useOnClickOutside(itemRef, closePanelMember);
	const handleClickRemoveMember = () => {
		setOpenModalRemoveMember(true);
	};
	const { removeMemberClan } = useChannelMembersActions();

	const handleRemoveMember = async () => {
		await removeMemberClan({ clanId: currentClanId as string, channelId: currentChannelId as string, userIds: [userId] });
		setOpenModalRemoveMember(false);
	};
	return (
		<>
			<div
				className="flex flex-row justify-between items-center h-[48px] border-b-[1px] dark:border-borderDivider border-buttonLightTertiary last:border-b-0"
				onContextMenu={handleContextMenu}
				ref={itemRef}
			>
				<div className="flex-3 p-1">
					<div className="flex flex-row gap-2 items-center">
						<AvatarImage
							alt={username}
							username={username}
							className="min-w-9 min-h-9 max-w-9 max-h-9"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
						<div className="flex flex-col">
							<p
								className="text-base font-medium font-normal"
								style={{
									color: userRolesClan.sortedRoles[0]?.color || DEFAULT_ROLE_COLOR
								}}
							>
								{HighlightMatchBold(displayName, searchQuery)}
							</p>
							<p className="text-[11px] dark:text-textDarkTheme text-textLightTheme">{HighlightMatchBold(username, searchQuery)}</p>
						</div>
					</div>
				</div>
				<div className="flex-1 p-1 text-center">
					<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-medium uppercase">{clanJoinTime ?? '-'}</span>
				</div>
				<div className="flex-1 p-1 text-center">
					<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-medium uppercase">
						{mezonJoinTime ? mezonJoinTime + ' ago' : '-'}
					</span>
				</div>
				<div className="flex-2 p-1 text-center">
					<span className={'inline-flex items-center'}>
						{userRolesClan?.length ? (
							<>
								<RoleNameCard
									roleName={userRolesClan.sortedRoles[0].title || ''}
									roleColor={userRolesClan.sortedRoles[0].color || ''}
								/>
								{userRolesClan.length > 1 && (
									<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-opacity-50 dark:text-contentTertiary text-colorTextLightMode hoverIconBlackImportant ml-1">
										<Tooltip
											overlay={
												<div
													className={
														'rounded p-1 dark:bg-bgSecondary600 bg-bgLightMode dark:!text-white !text-black flex flex-col items-start'
													}
												>
													{userRolesClan.sortedRoles.slice(1).map((userRole) => (
														<div className={'my-0.5'} key={userRole.id}>
															<RoleNameCard roleName={userRole.title || ''} roleColor={userRole.color || ''} />
														</div>
													))}
												</div>
											}
										>
											<span className="text-xs font-medium px-1 cursor-pointer" style={{ lineHeight: '15px' }}>
												+{userRolesClan.length - 1}
											</span>
										</Tooltip>
									</span>
								)}
							</>
						) : (
							'-'
						)}
						{hasClanPermission && (
							<Tooltip
								overlay={
									<div className="rounded p-1 dark:bg-bgSecondary600 bg-bgLightMode max-h-52 overflow-y-auto overflow-x-hidden scrollbar-hide">
										<div className="flex flex-col gap-1 max-w-72">
											{<ListOptionRole userId={userId} rolesClanEntity={rolesClanEntity} userRolesClan={userRolesClan} />}
										</div>
									</div>
								}
								trigger="click"
								placement="left-start"
							>
								<span
									title="Add Role"
									className="inline-flex justify-center gap-x-1 w-6 aspect-square items-center rounded dark:bg-bgSecondary600 bg-slate-300 dark:text-contentTertiary text-colorTextLightMode hoverIconBlackImportant ml-1 text-base"
								>
									+
								</span>
							</Tooltip>
						)}
					</span>
				</div>
				<div className="flex-1 p-1 text-center">
					<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-medium uppercase">Signals</span>
				</div>
			</div>
			{openModalRemoveMember && (
				<ModalRemoveMemberClan
					openModal={openModalRemoveMember}
					username={username}
					onClose={() => setOpenModalRemoveMember(false)}
					onRemoveMember={handleRemoveMember}
				/>
			)}
		</>
	);
};

const ListOptionRole = ({
	rolesClanEntity,
	userRolesClan,
	userId
}: {
	rolesClanEntity: Record<string, RolesClanEntity>;
	userRolesClan: {
		usersRole: Record<string, string>;
		length: number;
	};
	userId: string;
}) => {
	const dispatch = useAppDispatch();
	const { updateRole } = useRoles();
	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);

	const handleAddRoleMemberList = async (role: RolesClanEntity) => {
		if (userRolesClan.usersRole[role.id]) {
			await updateRole(role.clan_id || '', role.id, role.title || '', role.color || '', [], [], [userId], []);
			return;
		}
		await updateRole(role.clan_id || '', role.id, role.title || '', role.color || '', [userId], [], [], []);
		await dispatch(
			usersClanActions.addRoleIdUser({
				id: role.id,
				userId: userId
			})
		);
	};

	const roleElements = [];
	for (const key in rolesClanEntity) {
		if (key !== EVERYONE_ROLE_ID && (isClanOwner || Number(maxPermissionLevel) > Number(rolesClanEntity[key]?.max_level_permission || -1))) {
			roleElements.push(
				<div className="flex gap-2 items-center h-6 justify-between px-2" key={key}>
					<div
						className="text-transparent size-3 rounded-full"
						style={{ backgroundColor: rolesClanEntity[key].color || DEFAULT_ROLE_COLOR }}
					/>
					<span className="text-xs font-medium px-1 truncate flex-1" style={{ lineHeight: '15px' }}>
						{rolesClanEntity[key].title}
					</span>
					<div className="relative flex flex-row justify-center">
						<input
							checked={!!userRolesClan.usersRole[key]}
							type="checkbox"
							className={`peer appearance-none forced-colors:appearance-auto relative w-4 h-4 border dark:border-textPrimary border-gray-600 rounded-md focus:outline-none`}
							onChange={() => handleAddRoleMemberList(rolesClanEntity[key])}
							key={key}
						/>
						<Icons.Check className="absolute invisible peer-checked:visible forced-colors:hidden w-4 h-4 pointer-events-none" />
					</div>
				</div>
			);
		}
	}

	return roleElements.length ? roleElements : <span className="text-gray-500">No roles available.</span>;
};
export default TableMemberItem;
