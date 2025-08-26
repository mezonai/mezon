import { useRoles } from '@mezon/core';
import {
	rolesClanActions,
	roleSlice,
	selectAllRolesClan,
	selectCurrentClanId,
	selectTheme,
	setAddMemberRoles,
	setAddPermissions,
	setColorRoleNew,
	setCurrentRoleIcon,
	setNameRoleNew,
	setRemoveMemberRoles,
	setRemovePermissions,
	setSelectedPermissions,
	setSelectedRoleId,
	useAppDispatch
} from '@mezon/store';
import { ButtonLoading, Icons, InputField } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteModal } from '../DeleteRoleModal/deleteRoleModal';
import ServerSettingRoleManagement from '../SettingRoleManagement';
import ListActiveRole from './listActiveRole';

export type ModalOpenEdit = {
	handleOpen?: () => void;
};
const ServerSettingMainRoles = (props: ModalOpenEdit) => {
	const rolesClan = useSelector(selectAllRolesClan);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [openEdit, setOpenEdit] = useState<boolean>(false);
	const [selectedRoleId, setSelectedRoleID] = useState<string>('');
	const dispatchRole = useDispatch();
	const dispatch = useAppDispatch();
	const roles = useMemo(() => rolesClan.filter((role) => role.active === 1), [rolesClan]);
	const [activeRoles, setActiveRoles] = useState(roles);
	const numRoles = useMemo(() => activeRoles.length, [activeRoles]);
	const currentClanId = useSelector(selectCurrentClanId);
	const appearanceTheme = useSelector(selectTheme);
	const { createRole } = useRoles();
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleShowDeleteRoleModal = (roleId: string) => {
		setSelectedRoleID(roleId);
		setShowModal(true);
	};

	const handleRoleClick = (roleId: string) => {
		setSelectedRoleID(roleId);
		const activeRole = rolesClan.find((role) => role.id === roleId);
		const permissions = activeRole?.permission_list?.permissions;
		const permissionIds = permissions ? permissions.filter((permission) => permission.active === 1).map((permission) => permission.id) : [];
		const memberIDRoles = activeRole?.role_user_list?.role_users?.map((member) => member.id) || [];
		dispatchRole(setSelectedPermissions(permissionIds));
		dispatchRole(setNameRoleNew(activeRole?.title));
		dispatchRole(setColorRoleNew(activeRole?.color));
		dispatchRole(setSelectedRoleId(roleId));
		dispatchRole(setAddPermissions([]));
		dispatchRole(setRemovePermissions([]));
		dispatchRole(setAddMemberRoles(memberIDRoles));
		dispatchRole(setRemoveMemberRoles([]));
		dispatchRole(setCurrentRoleIcon(activeRole?.role_icon || ''));
	};

	const handleDeleteRole = async (roleId: string) => {
		await dispatch(rolesClanActions.fetchDeleteRole({ roleId, clanId: currentClanId || '' }));
	};

	const [valueSearch, setValueSearch] = useState('');
	useEffect(() => {
		setActiveRoles(roles.filter((role) => role?.title?.toLowerCase().includes(valueSearch.toLowerCase())));
	}, [valueSearch, roles]);

	const handleCreateNewRole = async () => {
		const newRole = await createRole(currentClanId || '', 'New Role', DEFAULT_ROLE_COLOR, [], []);
		dispatch(setSelectedRoleId(newRole?.id || ''));
		dispatch(setNameRoleNew('New Role'));
		dispatch(setColorRoleNew(DEFAULT_ROLE_COLOR));
		dispatch(setAddPermissions([]));
		dispatch(setAddMemberRoles([]));
		dispatch(setSelectedPermissions([]));
		dispatch(roleSlice.actions.setCurrentRoleIcon(''));
		setOpenEdit(true);
	};

	return (
		<>
			{!openEdit && (
				<>
					<p className="text-sm mb-4">Use roles to group your clan members and assign permissions.</p>
					<div
						onClick={() => {
							handleRoleClick(rolesClan.find((role) => role.slug === `everyone-${currentClanId}`)?.id || '');
							setOpenEdit(true);
						}}
						className="rounded-lg border-theme-primary bg-theme-input p-4 pr-6 flex justify-between cursor-pointer group mb-4 bg-item-hover text-theme-primary-hover"
					>
						<div className="flex gap-x-4 items-center">
							<div className=" p-1 rounded-full h-fit">
								<Icons.MemberList defaultSize="w-5 h-5" />
							</div>
							<div className="">
								<h4 className="text-base font-semibold">Default permissions</h4>
								<p className="text-xs">@everyone •&nbsp;applies to all clan members</p>
							</div>
						</div>
						<Icons.ArrowDown defaultSize="w-[20px] h-[30px] -rotate-90 " />
					</div>
					<div className="flex items-center space-x-4 ">
						<div className="w-full flex-grow">
							<InputField
								type="text"
								className="rounded-lg w-full border-theme-primary  px-2 py-1 focus:outline-none bg-theme-contexify focus:border-white-500 bg-theme-input text-base"
								placeholder="Search Roles"
								onChange={(e) => setValueSearch(e.target.value)}
							/>
						</div>
						<ButtonLoading
							className="text-[15px] bg-indigo-500 hover:bg-indigo-600 text-white py-[5px] rounded-lg px-2 text-nowrap font-medium inline-flex items-center justify-center h-[32.5px]"
							onClick={handleCreateNewRole}
							label="Create Role"
						/>
					</div>
					<p className=" text-sm mt-2">
						Members use the colour of the highest role they have on this list. Drag roles to reorder them.&nbsp;
					</p>
					<br />
					<div className={`overflow-hidden w-full `}>
						<table className="w-full divide-y  mb-10">
							<thead>
								<tr className="h-11">
									<th scope="col" className="text-xs font-bold uppercase tracking-wider w-1/2 text-left">
										Roles - {numRoles - 1}
									</th>
									<th scope="col" className="text-xs font-bold uppercase tracking-wider w-1/4 text-center">
										Members
									</th>
									<th scope="col" className="text-xs font-bold uppercase tracking-wider w-1/4 text-center"></th>
								</tr>
							</thead>
							<tbody className="divide-y ">
								{numRoles === 0 ? (
									<tr className="h-14">
										<td className=" text-[15px]">
											<p className="inline-flex gap-x-2 mt-1.5">
												<Icons.RoleIcon defaultSize="w-5 h-5 min-w-5" />
												No Roles
											</p>
										</td>
									</tr>
								) : (
									<ListActiveRole
										activeRoles={activeRoles}
										setShowModal={handleShowDeleteRoleModal}
										handleRoleClick={handleRoleClick}
										setOpenEdit={setOpenEdit}
									/>
								)}
							</tbody>
						</table>
					</div>
				</>
			)}
			{showModal && <DeleteModal handleDelete={() => handleDeleteRole(selectedRoleId)} onClose={() => setShowModal(false)} />}
			<ServerSettingRoleManagement flagOption={openEdit} handleClose={() => setOpenEdit(false)} rolesClan={rolesClan} />
		</>
	);
};

export default ServerSettingMainRoles;
