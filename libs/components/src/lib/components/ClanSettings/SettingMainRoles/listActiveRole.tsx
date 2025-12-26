import { useClanOwner, useDragAndDropRole } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import { getStore, rolesClanActions, selectCurrentClanId, selectUserMaxPermissionLevel, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, EDragBorderPosition, SlugPermission, generateE2eId } from '@mezon/utils';
import type { ApiPermission, ApiUpdateRoleOrderRequest } from 'mezon-js/api.gen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ModalSaveChanges from '../ClanSettingOverview/ModalSaveChanges';

type ListActiveRoleProps = {
	activeRoles: RolesClanEntity[];
	setShowModal: (roleId: string) => void;
	setOpenEdit: React.Dispatch<React.SetStateAction<boolean>>;
	handleRoleClick: (roleId: string) => void;
};

const ListActiveRole = (props: ListActiveRoleProps) => {
	const { t } = useTranslation('clanRoles');
	const { activeRoles, handleRoleClick, setShowModal, setOpenEdit } = props;
	const isClanOwner = useClanOwner();
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const {
		rolesList,
		hoveredIndex,
		dragBorderPosition,
		handleDragStart,
		handleDragEnd,
		handleDragOver,
		handleDragEnter,
		resetRolesList,
		setRolesList,
		hasChanged
	} = useDragAndDropRole<RolesClanEntity>(activeRoles);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [openSaveChangesModal, closeSaveChangesModal] = useModal(() => {
		return <ModalSaveChanges onSave={handleUpdateRolesOrder} onReset={resetRolesList} isLoading={isLoading} />;
	}, [isLoading]);
	const dispatch = useAppDispatch();

	const handleOpenDeleteRoleModal = (e: React.MouseEvent, roleId: string) => {
		e.stopPropagation();
		setShowModal(roleId);
	};

	const handleOpenEditRole = (roleId: string) => {
		handleRoleClick(roleId);
		setOpenEdit(true);
	};

	const handleUpdateRolesOrder = () => {
		const store = getStore();
		const state = store.getState();
		const currentClanId = selectCurrentClanId(state);

		setIsLoading(true);
		setRolesList((currentRoles) => {
			const requestBody: ApiUpdateRoleOrderRequest = {
				clan_id: currentClanId || '',
				roles: currentRoles.map((role, index) => ({
					role_id: role.id,
					order: index + 1
				}))
			};

			dispatch(rolesClanActions.updateRoleOrder(requestBody))
				.then(() => {
					dispatch(rolesClanActions.setAll({ roles: currentRoles, clanId: currentClanId as string }));
				})
				.catch(() => {
					toast(t('roleManagement.failedToUpdateRoleOrder'));
					setRolesList(activeRoles);
				})
				.finally(() => {
					setIsLoading(false);
				});

			return currentRoles;
		});
	};

	useEffect(() => {
		hasChanged ? openSaveChangesModal() : closeSaveChangesModal();
	}, [hasChanged]);

	return (
		<>
			{rolesList.map((role, index) => {
				const hasPermissionEdit = isClanOwner || Number(userMaxPermissionLevel) > Number(role.max_level_permission);
				return (
					<tr
						key={role.id}
						className={`h-14 group bg-item-hover text-theme-primary-hover group cursor-grab
						${
							hoveredIndex === index
								? dragBorderPosition === EDragBorderPosition.BOTTOM
									? '!border-b-2 !border-b-green-500'
									: '!border-t-2 !border-t-green-500'
								: ''
						}`}
						onClick={() => handleOpenEditRole(role.id)}
						draggable
						onDragStart={() => handleDragStart(index)}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onDragEnter={() => handleDragEnter(index)}
					>
						<td>
							<p
								className="px-2 inline-flex gap-1 items-center text-[15px] break-all whitespace-break-spaces overflow-hidden line-clamp-2 font-medium mt-1.5"
								data-e2e={generateE2eId('clan_page.settings.role.item')}
							>
								{role.role_icon ? (
									<img src={role.role_icon} alt="" className={'size-5'} />
								) : (
									<Icons.RoleIcon defaultSize="w-5 h-[30px] min-w-5 mr-2" defaultFill={`${role.color || DEFAULT_ROLE_COLOR}`} />
								)}

								{!hasPermissionEdit && <Icons.IconLock defaultSize="size-3 text-contentTertiary" />}
								<span className="one-line" data-e2e={generateE2eId('clan_page.settings.role.item.role_name')}>
									{role.title}
								</span>
							</p>
						</td>
						<td className="text-[15px] text-center">
							{role?.slug === `everyone-${role?.clan_id}` ? (
								<p className="inline-flex gap-x-2 items-center ">{t('allMembers')}</p>
							) : (
								<p
									className="inline-flex gap-x-2 items-center "
									data-e2e={generateE2eId('clan_page.settings.role.item.member_count')}
								>
									{role.role_user_list?.role_users?.length ?? 0}
									<Icons.MemberIcon defaultSize="w-5 h-[30px] min-w-5" />
								</p>
							)}
						</td>
						<td className={` flex h-14 justify-center items-center ${role?.slug === `everyone-${role?.clan_id}` && 'ml-[2.8rem]'}`}>
							<div className="flex gap-x-2">
								<div className="text-[15px] cursor-pointer bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 group-hover:text-white">
									{hasPermissionEdit ? (
										<span title={t('roleManagement.edit')} data-e2e={generateE2eId('clan_page.settings.role.item.button.edit')}>
											<Icons.PenEdit className="size-5" />
										</span>
									) : (
										<span title={t('roleManagement.view')} data-e2e={generateE2eId('clan_page.settings.role.item.button.view')}>
											<Icons.ViewRole defaultSize="size-5" />
										</span>
									)}
								</div>
								{hasPermissionEdit && role?.slug !== `everyone-${role?.clan_id}` && (
									<div
										className={`text-[15px] cursor-pointer bg-red-500 p-2 text-white rounded-full ${hasPermissionEdit ? 'opacity-100' : 'opacity-20'}`}
										onClick={(e) => handleOpenDeleteRoleModal(e, role.id)}
									>
										<span
											title={t('roleManagement.delete')}
											data-e2e={generateE2eId('clan_page.settings.role.item.button.delete')}
										>
											<Icons.DeleteMessageRightClick defaultSize="size-5" />
										</span>
									</div>
								)}
							</div>
						</td>
					</tr>
				);
			})}
		</>
	);
};

export default ListActiveRole;

export function useCheckHasAdministrator(permissions?: ApiPermission[]) {
	return permissions?.some((permission) => permission.slug === SlugPermission.Admin && permission.active === 1);
}
