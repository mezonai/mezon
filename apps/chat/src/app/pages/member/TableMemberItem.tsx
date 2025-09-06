import { AvatarImage, Coords, ModalRemoveMemberClan, PanelMemberTable, UserProfileModalInner } from '@mezon/components';
import { useChannelMembersActions, useMemberContext, useOnClickOutside, usePermissionChecker, useRoles } from '@mezon/core';
import {
	RolesClanEntity,
	clansActions,
	selectCurrentChannelId,
	selectCurrentClan,
	selectCurrentClanId,
	selectRolesClanEntities,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	usersClanActions
} from '@mezon/store';
import { HighlightMatchBold, Icons } from '@mezon/ui';
import { ChannelMembersEntity, DEFAULT_ROLE_COLOR, EPermission, EVERYONE_ROLE_ID, createImgproxyUrl } from '@mezon/utils';
import { formatDistance } from 'date-fns';
import Tooltip from 'rc-tooltip';
import { MouseEvent, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import RoleNameCard from './RoleNameCard';
import TransferOwnerModal from './TransferOwnerModal';

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

		userRoles
			.map((role, index) => ({ ...role, originalIndex: index }))
			.sort((a, b) => {
				// If both roles have 'order_role', sort by its value
				if (a.order_role !== undefined && b.order_role !== undefined) {
					return a.order_role - b.order_role;
				}

				// If neither role has 'order_role', maintain their original order
				if (a.order_role === undefined && b.order_role === undefined) {
					return a.originalIndex - b.originalIndex;
				}

				// If only one role has 'order_role', prioritize it
				return a.order_role !== undefined ? -1 : 1;
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
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);

	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const [openUserProfile, closeUserProfile] = useModal(() => {
		return (
			<UserProfileModalInner
				userId={userId as string}
				onClose={closeUserProfile}
				isDM={false}
				user={{
					id: userId,
					user_id: userId,
					user: {
						id: userId,
						username: username
					}
				}}
				avatar={avatar}
			/>
		);
	}, [userId, username, avatar]);
	const dispatch = useAppDispatch();
	const handleTransferOwner = async () => {
		const response = await dispatch(clansActions.transferClan({ clanId: currentClan?.clan_id || '', new_clan_owner: userId || '' }));
		if (response) {
			toast.success('Transferred successfully!');
		}
		closeTransfer();
	};

	const member: ChannelMembersEntity = useMemo(() => {
		return {
			id: userId,
			user_id: userId,
			user: {
				username: username,
				id: userId,
				display_name: displayName,
				avatar_url: avatar
			}
		};
	}, []);

	const [openConfirmTransfer, closeTransfer] = useModal(() => {
		return <TransferOwnerModal onClose={closeTransfer} onClick={handleTransferOwner} member={member} />;
	}, []);

	const [openPanelMember, closePanelMember] = useModal(() => {
		return (
			<PanelMemberTable
				coords={coords}
				onClose={closePanelMember}
				member={member}
				onOpenProfile={openUserProfile}
				kichMember={hasClanPermission}
				handleRemoveMember={handleClickRemoveMember}
				handleTransferOwner={openConfirmTransfer}
			/>
		);
	}, [coords, openUserProfile, hasClanPermission]);

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
		openModalRemoveMember();
	};
	const { removeMemberClan } = useChannelMembersActions();

	const handleRemoveMember = async () => {
		await removeMemberClan({ clanId: currentClanId as string, channelId: currentChannelId as string, userIds: [userId] });
		closeModalRemoveMember();
	};

	const [openModalRemoveMember, closeModalRemoveMember] = useModal(() => {
		return <ModalRemoveMemberClan username={username} onClose={closeModalRemoveMember} onRemoveMember={handleRemoveMember} />;
	}, [username, handleRemoveMember]);

	const currentClan = useSelector(selectCurrentClan);

	return (
		<div
			className="flex flex-row justify-between items-center h-[48px] border-b-[1px] border-b-theme-primary last:border-b-0"
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
						<p className="text-[11px] ">{HighlightMatchBold(username, searchQuery)}</p>
					</div>
				</div>
			</div>
			<div className="flex-1 p-1 text-center">
				<span className="text-xs  font-medium uppercase">
					{clanJoinTime ? formatDistance(clanJoinTime as string, new Date(), { addSuffix: true }) : '-'}
				</span>
			</div>
			<div className="flex-1 p-1 text-center">
				<span className="text-xs  font-medium uppercase">{mezonJoinTime ? mezonJoinTime + ' ago' : '-'}</span>
			</div>
			<div className="flex-2 p-1 text-center">
				<span className={'inline-flex items-center'}>
					{userRolesClan?.length ? (
						<>
							<RoleNameCard
								roleName={userRolesClan.sortedRoles[0].title || ''}
								roleColor={userRolesClan.sortedRoles[0].color || ''}
								roleIcon={userRolesClan.sortedRoles[0].role_icon || ''}
							/>
							{userRolesClan.length > 1 && (
								<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-opacity-50  hoverIconBlackImportant ml-1">
									<Tooltip
										overlay={
											<div className={'rounded p-1  flex flex-col items-start'}>
												{userRolesClan.sortedRoles.slice(1).map((userRole) => (
													<div className={'my-0.5'} key={userRole.id}>
														<RoleNameCard
															roleName={userRole.title || ''}
															roleColor={userRole.color || ''}
															roleIcon={userRole.role_icon || ''}
														/>
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
								<div className="rounded-lg p-1 bg-theme-contexify border-theme-primary  max-h-52 overflow-y-auto overflow-x-hidden scrollbar-hide">
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
								className="inline-flex justify-center gap-x-1 w-6 aspect-square items-center rounded bg-item-theme  hoverIconBlackImportant ml-1 text-base"
							>
								+
							</span>
						</Tooltip>
					)}
				</span>
			</div>
			<div className="flex-1 p-1 text-center">
				<span className="text-xs  font-medium uppercase">Signals</span>
			</div>
		</div>
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
	const currentClanId = useSelector(selectCurrentClanId);

	const handleAddRoleMemberList = async (role: RolesClanEntity) => {
		if (userRolesClan.usersRole[role.id]) {
			await updateRole(role.clan_id || '', role.id, role.title || '', role.color || '', [], [], [userId], [], role.role_icon || '');
			return;
		}
		await updateRole(role.clan_id || '', role.id, role.title || '', role.color || '', [userId], [], [], [], role.role_icon || '');
		await dispatch(
			usersClanActions.addRoleIdUser({
				id: role.id,
				userId: userId,
				clanId: currentClanId as string
			})
		);
	};

	const roleElements = [];
	for (const key in rolesClanEntity) {
		if (key !== EVERYONE_ROLE_ID && (isClanOwner || Number(maxPermissionLevel) > Number(rolesClanEntity[key]?.max_level_permission || -1))) {
			roleElements.push(
				<div
					className="flex gap-2 items-center h-6 justify-between px-2 rounded-lg bg-item-hover cursor-pointer"
					key={key}
					onClick={() => handleAddRoleMemberList(rolesClanEntity[key])}
				>
					<div
						className="text-transparent size-3 rounded-full"
						style={{ backgroundColor: rolesClanEntity[key].color || DEFAULT_ROLE_COLOR }}
					/>
					<span className="text-xs font-medium px-1 truncate flex-1 text-theme-primary" style={{ lineHeight: '15px' }}>
						{rolesClanEntity[key].title}
					</span>
					<div className="relative flex flex-row justify-center">
						<input
							checked={!!userRolesClan.usersRole[key]}
							type="checkbox"
							className={`peer appearance-none cursor-pointer forced-colors:appearance-auto relative w-4 h-4 border-theme-primary rounded-md focus:outline-none`}
							onChange={() => handleAddRoleMemberList(rolesClanEntity[key])}
							key={key}
							// Prevent click event propagation to parent to avoid double triggering
							onClick={(e) => e.stopPropagation()}
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
