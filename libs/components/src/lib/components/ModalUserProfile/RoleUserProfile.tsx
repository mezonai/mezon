import { usePermissionChecker, useRoles, UserRestrictionZone } from '@mezon/core';
import {
	RolesClanEntity,
	selectAllRolesClan,
	selectCurrentChannelId,
	selectCurrentClan,
	selectMemberClanByUserId,
	selectRolesClanEntities,
	selectTheme,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	useAppSelector,
	usersClanActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, EPermission, EVERYONE_ROLE_ID } from '@mezon/utils';
import { Tooltip } from 'flowbite-react';
import { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

type RoleUserProfileProps = {
	userID?: string;
};

const RoleUserProfile = ({ userID }: RoleUserProfileProps) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const userById = useAppSelector(selectMemberClanByUserId(userID || currentChannelId || ''));
	const { updateRole } = useRoles();
	const RolesClan = useSelector(selectAllRolesClan);
	const currentClan = useSelector(selectCurrentClan);

	const [searchTerm, setSearchTerm] = useState('');
	const activeRoles = RolesClan.filter((role) => role.active === 1);
	const userRolesClan = useMemo(() => {
		return userById?.role_id ? RolesClan.filter((role) => userById?.role_id?.includes(role.id)) : [];
	}, [userById?.role_id, RolesClan]);

	const [hasPermissionEditRole] = usePermissionChecker([EPermission.manageClan]);
	const activeRolesWithoutUserRoles = activeRoles.filter((role) => {
		const isRoleInUserRoles = userRolesClan.some((userRole) => userRole.id === role.id);
		return !isRoleInUserRoles;
	});

	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);
	const rolesClanEntity = useSelector(selectRolesClanEntities);

	const filteredListRoleBySearch = useMemo(() => {
		return activeRolesWithoutUserRoles?.filter((role) => {
			return (
				role.id !== EVERYONE_ROLE_ID &&
				!userById.role_id?.includes(role.id) &&
				role.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
				(isClanOwner || Number(maxPermissionLevel) > Number(rolesClanEntity[role.id]?.max_level_permission))
			);
		});
	}, [activeRolesWithoutUserRoles, searchTerm]);

	const dispatch = useAppDispatch();

	const addRole = async (roleId: string) => {
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');
		await updateRole(currentClan?.clan_id || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', userIDArray || [], [], [], []);
		await dispatch(
			usersClanActions.addRoleIdUser({
				id: roleId,
				channelId: currentChannelId,
				userId: userById?.user?.id
			})
		);
	};

	const deleteRole = async (roleId: string) => {
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');
		await updateRole(currentClan?.clan_id || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', [], [], userIDArray || [], []);
		await dispatch(
			usersClanActions.removeRoleIdUser({
				id: roleId,
				channelId: currentChannelId,
				userId: userById?.user?.id
			})
		);
	};
	const appearanceTheme = useSelector(selectTheme);
	return (
		<div className="flex flex-col">
			{/* {userRolesClan.length > 0 && <div className="font-bold tracking-wider text-sm pt-2">ROLES</div>} */}
			<div className="mt-2 flex flex-wrap gap-2">
				{userRolesClan.slice(0, 6).map((role, index) => (
					<RoleClanItem
						key={`${role.id}_${index}`}
						appearanceTheme={appearanceTheme}
						deleteRole={deleteRole}
						role={role}
						index={index}
						hasPermissionEditRole={hasPermissionEditRole}
					/>
				))}
				{userRolesClan.length > 6 && (
					<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 dark:bg-bgSecondary600 bg-slate-300 dark:text-contentTertiary text-colorTextLightMode hoverIconBlackImportant ml-1">
						<Tooltip
							content={
								<div className={'flex flex-col items-start gap-1'}>
									{userRolesClan.slice(6, userRolesClan.length).map((userRole, index) => (
										<RoleClanItem
											key={`${userRole.id}_role`}
											appearanceTheme={appearanceTheme}
											deleteRole={deleteRole}
											role={userRole}
											index={index}
											hasPermissionEditRole={hasPermissionEditRole}
										/>
									))}
								</div>
							}
							trigger={'hover'}
							style={appearanceTheme === 'light' ? 'light' : 'dark'}
							className="dark:!text-white !text-black"
						>
							<span className="text-xs font-medium px-1 cursor-pointer" style={{ lineHeight: '15px' }}>
								+ {userRolesClan.length - 6}
							</span>
						</Tooltip>
					</span>
				)}
				<UserRestrictionZone policy={hasPermissionEditRole}>
					<Tooltip
						content={<AddRolesComp addRole={addRole} filteredListRoleBySearch={filteredListRoleBySearch} setSearchTerm={setSearchTerm} />}
						trigger="click"
						placement="bottom-start"
						arrow={false}
						className="dark:bg-transparent bg-transparent p-0 h-60 w-[300px]"
					>
						<Tooltip
							content="Add roles"
							trigger="hover"
							animation="duration-500"
							style={appearanceTheme === 'light' ? 'light' : 'dark'}
							className="dark:text-white text-black"
						>
							<button className="flex gap-x-1 dark:text-[#AEAEAE] text-colorTextLightMode rounded p-1 dark:bg-slate-800 bg-slate-300 items-center">
								<Icons.Plus className="size-5 select-none" />
								<p className="text-xs m-0 font-medium select-none">Add Role</p>
							</button>
						</Tooltip>
					</Tooltip>
				</UserRestrictionZone>
			</div>
		</div>
	);
};

const AddRolesComp = ({
	addRole,
	filteredListRoleBySearch,
	setSearchTerm
}: {
	addRole: (roleId: string) => void;
	filteredListRoleBySearch: RolesClanEntity[];
	setSearchTerm: Dispatch<SetStateAction<string>>;
}) => {
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	return (
		<div className="absolute w-[300px] max-h-60 dark:bg-[#323232] bg-white p-2 dark:text-white text-black overflow-y: auto rounded border border-slate-300 dark:border-slate-700 flex flex-col gap-3">
			<div className="relative w-full h-9">
				<input
					type="text"
					className="w-full border-[#1d1c1c] rounded-[5px] dark:bg-[#1d1c1c] bg-bgLightModeSecond p-2 mb-2"
					placeholder="Role"
					onChange={handleInputChange}
					onClick={(e) => e.stopPropagation()}
				/>
				<Icons.Search className="size-5 dark:text-white text-colorTextLightMode absolute right-2 top-2" />
			</div>
			<div className="w-full flex-1 overflow-y-scroll overflow-x-hidden hide-scrollbar space-y-1">
				{filteredListRoleBySearch.length > 0 ? (
					filteredListRoleBySearch.map((role, index) => (
						<div
							key={index}
							className="text-base w-full rounded-[10px] p-2 bg-transparent mr-2 dark:hover:bg-gray-800 hover:bg-bgLightModeButton flex gap-2 items-center dark:text-white text-colorTextLightMode"
							onClick={() => addRole(role.id)}
						>
							<div className="size-3 min-w-3 rounded-full" style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}></div>
							{role.title}
						</div>
					))
				) : (
					<div className="flex flex-col py-4 gap-y-4 items-center">
						<p className="font-medium dark:text-white text-black">Nope!</p>
						<p className="font-normal dark:text-zinc-400 text-colorTextLightMode">Did you make a typo?</p>
					</div>
				)}
			</div>
		</div>
	);
};

const RoleClanItem = ({
	role,
	index,
	deleteRole,
	hasPermissionEditRole,
	appearanceTheme
}: {
	role: RolesClanEntity;
	index: number;
	deleteRole: (id: string) => void;
	hasPermissionEditRole: boolean;
	appearanceTheme: string;
}) => {
	const [isHovered, setIsHovered] = useState(false);
	return (
		<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 dark:bg-slate-800 bg-slate-300 dark:text-[#AEAEAE] text-colorTextLightMode hoverIconBlackImportant">
			{hasPermissionEditRole ? (
				<button
					className="p-0.5 rounded-full h-fit"
					onClick={() => deleteRole(role.id)}
					style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<Tooltip
						content="Remove role"
						trigger="hover"
						animation="duration-500"
						style={appearanceTheme === 'light' ? 'light' : 'dark'}
						className="dark:!text-white !text-black"
					>
						<Icons.IconRemove className="size-2" fill={isHovered ? 'black' : role.color || DEFAULT_ROLE_COLOR} />
					</Tooltip>
				</button>
			) : (
				<div className="size-2 rounded-full" style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}></div>
			)}
			<span className="text-xs font-medium">{role.title}</span>
		</span>
	);
};
export default RoleUserProfile;
