import { usePermissionChecker, useRoles, UserRestrictionZone } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import {
	rolesClanActions,
	selectAllRolesClan,
	selectCurrentClanId,
	selectMemberClanByUserId,
	selectRolesClanEntities,
	selectTheme,
	selectUserMaxPermissionLevel,
	useAppDispatch,
	useAppSelector,
	usersClanActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, EPermission, EVERYONE_ROLE_TITLE, generateE2eId } from '@mezon/utils';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type RoleUserProfileProps = {
	userID?: string;
};

const RoleUserProfile = ({ userID }: RoleUserProfileProps) => {
	const { t } = useTranslation('userProfile');
	const currentClanId = useSelector(selectCurrentClanId);
	const userById = useAppSelector((state) => selectMemberClanByUserId(state, userID || ''));
	const { updateRole } = useRoles();
	const RolesClan = useSelector(selectAllRolesClan);

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
				role.title !== EVERYONE_ROLE_TITLE &&
				!userById?.role_id?.includes(role.id) &&
				role.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
				(isClanOwner || Number(maxPermissionLevel) > Number(rolesClanEntity[role.id]?.max_level_permission || -1))
			);
		});
	}, [activeRolesWithoutUserRoles, searchTerm, userById?.role_id, isClanOwner, maxPermissionLevel, rolesClanEntity]);

	const dispatch = useAppDispatch();

	const updateRoleUsersList = (role: RolesClanEntity | undefined, action: 'add' | 'remove') => {
		if (!role || !userById?.user?.id) return;

		const updatedRoleUsers =
			action === 'add'
				? [...(role.role_user_list?.role_users || []), { id: userById.user.id }]
				: role.role_user_list?.role_users?.filter((user) => user.id !== userById?.user?.id) || [];

		dispatch(
			rolesClanActions.update({
				role: {
					...role,
					role_user_list: {
						...role.role_user_list,
						role_users: updatedRoleUsers
					}
				},
				clanId: currentClanId as string
			})
		);
	};

	const addRole = async (roleId: string) => {
		setIsVisible(false);
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');

		await updateRole(currentClanId || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', userIDArray || [], [], [], []);
		await dispatch(
			usersClanActions.addRoleIdUser({
				id: roleId,
				userId: userById?.user?.id as string,
				clanId: currentClanId as string
			})
		);

		updateRoleUsersList(activeRole, 'add');
	};

	const deleteRole = async (roleId: string) => {
		const activeRole = RolesClan.find((role) => role.id === roleId);
		const userIDArray = userById?.user?.id?.split(',');
		await updateRole(currentClanId || '', roleId, activeRole?.title ?? '', activeRole?.color ?? '', [], [], userIDArray || [], []);
		await dispatch(
			usersClanActions.removeRoleIdUser({
				clanId: currentClanId as string,
				id: roleId,
				userId: userById?.user?.id as string
			})
		);

		updateRoleUsersList(activeRole, 'remove');
	};
	const appearanceTheme = useSelector(selectTheme);
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
						<span className="text-xs font-medium px-1 leading-[15px]">+ {userRolesClan.length - 6}</span>
					</span>
				)}
			</div>
			{showAllRoles && userRolesClan.length > 6 && (
				<div className="mt-1 flex justify-start">
					<span
						className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-theme-input-primary hoverIconBlackImportant cursor-pointer"
						onClick={handleShowAllRoles}
					>
						<span className="text-xs font-medium px-1 leading-[15px]">{t('labels.showLess')}</span>
					</span>
				</div>
			)}
			<UserRestrictionZone policy={hasPermissionEditRole}>
				<div className="relative flex items-center justify-center border-theme-primary mt-1">
					{isVisible ? (
						<div className="absolute bottom-8 dark:bg-transparent bg-transparent p-0 max-h-60 w-full">
							<AddRolesComp addRole={addRole} filteredListRoleBySearch={filteredListRoleBySearch} setSearchTerm={setSearchTerm} />
						</div>
					) : null}
					<button
						title={t('labels.addRoles')}
						onClick={handleOpenAddRoleModal}
						className="flex gap-x-1 rounded p-1 items-center"
						data-e2e={generateE2eId('short_profile.role.button.add')}
					>
						<Icons.Plus className="size-5 select-none" />
						<p className="text-xs m-0 font-medium select-none">{t('labels.addRole')}</p>
					</button>
				</div>
			</UserRestrictionZone>
		</div>
	);
};

const RoleListItem = ({ role, onAddRole }: { role: RolesClanEntity; onAddRole: (roleId: string) => void }) => {
	const roleColor = role.color || DEFAULT_ROLE_COLOR;
	const roleStyle = useMemo(() => ({ backgroundColor: roleColor }) as React.CSSProperties, [roleColor]);

	return (
		<div
			className="text-base w-full  p-2 bg-transparent mr-2 bg-item-hover flex gap-2 items-center text-theme-primary"
			onClick={() => onAddRole(role.id)}
			data-e2e={generateE2eId('short_profile.role.popover.item')}
		>
			<div className="size-3 min-w-3 rounded-full" style={roleStyle}></div>
			{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
			{role.title}
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
	const { t } = useTranslation('userProfile');
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	return (
		<div className="w-[300px] max-h-60 bg-theme-setting-primary rounded-lg text-theme-primary flex flex-col gap-3">
			<div className="relative w-full h-9">
				<input
					type="text"
					className="w-full bg-theme-setting-nav rounded-tl-lg rounded-tr-lg p-2 mb-2"
					placeholder={t('labels.role')}
					onChange={handleInputChange}
					onClick={(e) => e.stopPropagation()}
				/>
				<Icons.Search className="size-5 text-theme-primary absolute right-2 top-2" />
			</div>
			<div className="w-full flex-1 overflow-y-scroll overflow-x-hidden hide-scrollbar space-y-1">
				{filteredListRoleBySearch.length > 0 ? (
					filteredListRoleBySearch.map((role, index) => <RoleListItem key={index} role={role} onAddRole={addRole} />)
				) : (
					<div className="flex flex-col py-4 gap-y-4 items-center">
						<p className="font-medium text-theme-primary-active">{t('labels.nope')}</p>
						<p className="font-normal text-theme-primary-active">{t('labels.typoError')}</p>
					</div>
				)}
			</div>
		</div>
	);
};

const RoleClanItem = ({
	role,
	index: _index,
	deleteRole,
	hasPermissionEditRole,
	appearanceTheme: _appearanceTheme
}: {
	role: RolesClanEntity;
	index: number;
	deleteRole: (id: string) => void;
	hasPermissionEditRole: boolean;
	appearanceTheme: string;
}) => {
	const { t } = useTranslation('userProfile');
	const [isHovered, setIsHovered] = useState(false);
	const roleColor = role.color || DEFAULT_ROLE_COLOR;
	const buttonStyle = useMemo(() => ({ backgroundColor: roleColor }) as React.CSSProperties, [roleColor]);

	return (
		<span className="inline-flex gap-x-1 items-center text-xs rounded p-1 bg-item-theme  text-theme-primary hoverIconBlackImportant">
			{hasPermissionEditRole ? (
				<>
					<button
						className="p-0.5 rounded-full h-fit"
						onClick={() => deleteRole(role.id)}
						style={buttonStyle}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
						data-e2e={generateE2eId('clan_page.channel_list.members.role.role_color')}
					>
						<span title={t('labels.removeRole')}>
							<Icons.IconRemove className="size-2" fill={isHovered ? 'black' : roleColor} />
						</span>
					</button>
					{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
				</>
			) : (
				<>
					<div className="size-2 rounded-full" style={buttonStyle}></div>
					{role?.role_icon && <img src={role.role_icon} alt="" className={'size-3'} />}
				</>
			)}
			<span
				className="text-xs font-medium truncate overflow-hidden max-w-[120px] whitespace-nowrap"
				title={role.title}
				data-e2e={generateE2eId('clan_page.channel_list.members.role.role_name')}
			>
				{' '}
				{role.title}{' '}
			</span>
		</span>
	);
};
export default RoleUserProfile;
