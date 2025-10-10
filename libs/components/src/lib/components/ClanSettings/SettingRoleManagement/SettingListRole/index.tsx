import { useDragAndDropRole } from '@mezon/core';
import {
	RolesClanEntity,
	getIsShow,
	getNewColorRole,
	getNewNameRole,
	getSelectedRoleId,
	getStore,
	roleSlice,
	rolesClanActions,
	selectCurrentClanId,
	selectTheme,
	setAddMemberRoles,
	setColorRoleNew,
	setNameRoleNew,
	setSelectedPermissions,
	setSelectedRoleId,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, EDragBorderPosition } from '@mezon/utils';
import { ApiUpdateRoleOrderRequest } from 'mezon-js/api.gen';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ModalSaveChanges from '../../ClanSettingOverview/ModalSaveChanges';

type closeEditRole = {
	RolesClan: RolesClanEntity[];
	handleClose: () => void;
	handleUpdateUser: () => Promise<void>;
};
const SettingListRole = (props: closeEditRole) => {
	const { t } = useTranslation('clanRoles');
	const { RolesClan, handleClose, handleUpdateUser } = props;
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const isChange = useSelector(getIsShow);

	const clickRole = useSelector(getSelectedRoleId);
	const [clickedRole, setClickedRole] = useState<null | string>(clickRole);
	const nameRoleNew = useSelector(getNewNameRole);
	const colorRoleNew = useSelector(getNewColorRole);
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
	} = useDragAndDropRole<RolesClanEntity>(RolesClan);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [openSaveChangesModal, closeSaveChangesModal] = useModal(() => {
		return <ModalSaveChanges onSave={handleUpdateRolesOrder} onReset={resetRolesList} isLoading={isLoading} />;
	}, [isLoading]);

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
					setRolesList(RolesClan);
				})
				.finally(() => {
					setIsLoading(false);
				});

			return currentRoles;
		});
	};

	const isNewRole = clickedRole === t('roleManagement.newRoleDefault');
	const handleRoleClick = (roleId: string) => {
		if (!isChange || isNewRole) {
			if (isNewRole) handleUpdateUser();
			const activeRole = RolesClan.find((role) => role.id === roleId);
			const memberIDRoles = activeRole?.role_user_list?.role_users?.map((member) => member.id) || [];

			const permissionsRole = activeRole?.permission_list;
			const permissions = permissionsRole?.permissions?.filter((permission) => permission.active === 1) || [];
			const permissionIds = permissions.map((permission) => permission.id) || [];

			dispatch(setNameRoleNew(activeRole?.title));
			dispatch(setColorRoleNew(activeRole?.color));
			dispatch(setAddMemberRoles(memberIDRoles));
			dispatch(setSelectedPermissions(permissionIds));
			setClickedRole(roleId);
			dispatch(setSelectedRoleId(roleId));
			dispatch(roleSlice.actions.setCurrentRoleIcon(activeRole?.role_icon || ''));
		}
	};

	const containerRef = useRef<HTMLDivElement>(null);
	const newRoleRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setClickedRole(clickRole);
	}, [clickRole]);

	useEffect(() => {
		if (isNewRole && newRoleRef.current) {
			dispatch(setSelectedPermissions([]));
			newRoleRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
		}
	}, [clickedRole, dispatch, isNewRole]);

	useEffect(() => {
		hasChanged ? openSaveChangesModal() : closeSaveChangesModal();
	}, [hasChanged]);

	return (
		<div className="w-1/3 pr-3 flex flex-col mb-20">
			<div className="font-semibold mb-4 flex cursor-pointer" onClick={() => handleClose()}>
				<div className="rotate-90 -ml-[10px] text-theme-primary-active">
					<Icons.ArrowDown />
				</div>
				<div className="tracking-wide text-base text-theme-primary" role="button">
					{t('roleManagement.back')}
				</div>
			</div>
			<div
				ref={containerRef}
				className={`overflow-y-scroll flex flex-col gap-y-2 hide-scrollbar  ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
			>
				{rolesList.map((role, index) => (
					<div
						key={role.id}
						className={`cursor-grab
						${
							hoveredIndex === index
								? dragBorderPosition === EDragBorderPosition.BOTTOM
									? '!border-b-2 !border-b-green-500'
									: '!border-t-2 !border-t-green-500'
								: ''
						}`}
						draggable
						onDragStart={() => handleDragStart(index)}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onDragEnter={() => handleDragEnter(index)}
					>
						<ItemRole
							title={role.title || ''}
							color={role.color || ''}
							onHandle={() => handleRoleClick(role.id)}
							isChoose={clickedRole === role.id}
							iconUrl={role.role_icon}
						/>
					</div>
				))}
				{isNewRole && (
					<ItemRole ref={newRoleRef} title={nameRoleNew ?? t('roleManagement.newRoleDefault')} color={colorRoleNew ?? ''} isChoose />
				)}
			</div>
		</div>
	);
};

export default SettingListRole;

type ItemRoleProps = {
	title: string;
	color: string;
	isChoose?: boolean;
	onHandle?: () => void;
	iconUrl?: string;
};

const ItemRole = forwardRef<HTMLDivElement, ItemRoleProps>(({ title, color, isChoose, onHandle, iconUrl }, ref) => {
	return (
		<div ref={ref} onClick={onHandle}>
			<button
				className={`w-full py-1.5 px-[10px] text-[15px] bg-item-theme-hover font-medium inline-flex gap-x-2 items-center rounded text-theme-primary
					${isChoose ? 'bg-theme-primary-active bg-item-theme ' : ''}
				`}
			>
				<div className="size-3 rounded-full min-w-3" style={{ backgroundColor: color || DEFAULT_ROLE_COLOR }}></div>
				{iconUrl && <img src={iconUrl} alt="" className={'w-5 h-5'} />}

				<span className="one-line">{title}</span>
			</button>
		</div>
	);
});
