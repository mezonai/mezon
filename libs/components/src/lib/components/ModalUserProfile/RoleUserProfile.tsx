import { usePermissionChecker, useRoles, UserRestrictionZone } from '@mezon/core';
import {
	RolesClanEntity,
	selectAllRolesClan,
	selectCurrentClan,
	selectCurrentClanId,
	selectMemberClanByUserId2,
	selectRolesClanEntities,
	selectTheme,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	useAppSelector,
	usersClanActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, EPermission, EVERYONE_ROLE_ID } from '@mezon/utils';
import { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

type RoleUserProfileProps = {
	userID?: string;
};

const RoleUserProfile = ({ userID }: RoleUserProfileProps) => {
	const currentClanId = useSelector(selectCurrentClanId);
	const userById = useAppSelector((state) => selectMemberClanByUserId2(state, userID || ''));
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
				(isClanOwner || Number(maxPermissionLevel) > Number(rolesClanEntity[role.id]?.max_level_permission || -1))
			);
		});
	}, [activeRolesWithoutUserRoles, searchTerm]);

	const dispatch = useAppDispatch();

	const addRole = async (roleId: string) => {
		setIsVisible(false);
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');
		await updateRole(currentClan?.clan_id || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', userIDArray || [], [], [], []);
		await dispatch(
			usersClanActions.addRoleIdUser({
				id: roleId,
				userId: userById?.user?.id as string,
				clanId: currentClanId as string
			})
		);
	};

	const deleteRole = async (roleId: string) => {
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');
		await updateRole(currentClan?.clan_id || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', [], [], userIDArray || [], []);
		await dispatch(
			usersClanActions.removeRoleIdUser({
				clanId: currentClanId as string,
				id: roleId,
				userId: userById?.user?.id as string
			})
		);
	};
	const appearanceTheme = useSelector(selectTheme);
	const isLightMode = appearanceTheme === 'light';
	const [isVisible, setIsVisible] = useState(false);
	const [showAllRoles, setShowAllRoles] = useState(false);

	const handleOpenAddRoleModal = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setIsVisible(true);
	};
	const handleCloseAddRoleModal = () => {
		setIsVisible(false);
	};
	const handleShowAllRoles = (e: React.MouseEvent<HTMLSpanElement>) => {
		e.stopPropagation();
		setShowAllRoles(!showAllRoles);
	};
	return (
		<div className="flex flex-col" onClick={handleCloseAddRoleModal}>
			{/* {userRolesClan.length > 0 && <div className="font-bold tracking-wider text-sm pt-2">ROLES</div>} */}
			<div className={`mt-2 flex flex-wrap gap-2 ${showAllRoles ? 'max-h-[100px] thread-scroll overflow-y-auto' : ''}`}>
				{(showAllRoles ? userRolesClan : userRolesClan.slice(0, 6)).map((role, index) => (
					<RoleClanItem
						key={`${role.id}_${index}`}
						appearanceTheme={appearanceTheme}
						deleteRole={deleteRole}
						role={role}
						index={index}
						hasPermissionEditRole={hasPermissionEditRole}
					/>
				))}
				{userRolesClan.length > 6 && !showAllRoles && (
					<span
						className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-theme-input-primary hoverIconBlackImportant ml-1 cursor-pointer"
						onClick={handleShowAllRoles}
					>
						<span className="text-xs font-medium px-1" style={{ lineHeight: '15px' }}>
							+ {userRolesClan.length - 6}
						</span>
					</span>
				)}
			</div>
			{showAllRoles && userRolesClan.length > 6 && (
				<div className="mt-1 flex justify-start">
					<span
						className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-theme-input-primary hoverIconBlackImportant cursor-pointer"
						onClick={handleShowAllRoles}
					>
						<span className="text-xs font-medium px-1" style={{ lineHeight: '15px' }}>
							Show less
						</span>
					</span>
				</div>
			)}
			<UserRestrictionZone policy={hasPermissionEditRole}>
				<div className="relative flex items-center justify-center">
					{isVisible ? (
						<div className="absolute bottom-8 dark:bg-transparent bg-transparent p-0 max-h-60 w-[300px]">
							<AddRolesComp addRole={addRole} filteredListRoleBySearch={filteredListRoleBySearch} setSearchTerm={setSearchTerm} />
						</div>
					) : null}
					<button title="Add roles" onClick={handleOpenAddRoleModal} className="flex gap-x-1 rounded p-1 items-center">
						<Icons.Plus className="size-5 select-none" />
						<p className="text-xs m-0 font-medium select-none">Add Role</p>
					</button>
				</div>
			</UserRestrictionZone>
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
		<div className="w-[300px] max-h-60 dark:bg-[#323232] bg-white p-2 dark:text-white text-black overflow-y: auto rounded border border-slate-300 dark:border-slate-700 flex flex-col gap-3">
			<div className="relative w-full h-9">
				<input
					type="text"
					className="w-full border-[#1d1c1c] rounded-[5px] dark:bg-[#1d1c1c] bg-bgLightModeSecond p-2 mb-2"
					placeholder="Role"
					onChange={handleInputChange}
					onClick={(e) => e.stopPropagation()}
				/>
				<Icons.Search className="size-5 text-theme-primary absolute right-2 top-2" />
			</div>
			<div className="w-full flex-1 overflow-y-scroll overflow-x-hidden hide-scrollbar space-y-1">
				{filteredListRoleBySearch.length > 0 ? (
					filteredListRoleBySearch.map((role, index) => (
						<div
							key={index}
							className="text-base w-full rounded-[10px] p-2 bg-transparent mr-2 dark:hover:bg-gray-800 hover:bg-bgLightModeButton flex gap-2 items-center text-theme-primary"
							onClick={() => addRole(role.id)}
						>
							<div className="size-3 min-w-3 rounded-full" style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}></div>
							{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
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
		<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-item-theme  text-theme-primary hoverIconBlackImportant">
			{hasPermissionEditRole ? (
				<>
					<button
						className="p-0.5 rounded-full h-fit"
						onClick={() => deleteRole(role.id)}
						style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<span title="Remove role">
							<Icons.IconRemove className="size-2" fill={isHovered ? 'black' : role.color || DEFAULT_ROLE_COLOR} />
						</span>
					</button>
					{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
				</>
			) : (
				<>
					<div className="size-2 rounded-full" style={{ backgroundColor: role.color || DEFAULT_ROLE_COLOR }}></div>
					{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
				</>
			)}
			<span className="text-xs font-medium">{role.title}</span>
		</span>
	);
};
export default RoleUserProfile;
