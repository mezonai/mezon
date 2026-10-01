import { useMyRole } from '@mezon/core';
import {
	permissionRoleChannelActions,
	selectAllPermissionRoleChannel,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectEntitesUserClans,
	selectIsPermissionRoleChannelLoading,
	selectPermissionChannel,
	selectRawDataUserGroup,
	selectRolesByChannelId,
	selectUserChannelIds,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiPermissionUpdate } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { channelUserProfiles, permissionMemberRow } from '../permissionMemberList';
import { TypeChoose } from './ItemPermission';
import ListPermission from './ListPermission';
import type { PermissionEntityRow } from './ListRoleMember';
import ListRoleMember from './ListRoleMember';

export const ENTITY_TYPE = {
	ROLE: 0,
	USER: 1
} as const;

/** How long a load may run before the table admits to loading, so a fast answer never flashes a loading state. */
const LOADING_REVEAL_DELAY_MS = 250;

type SelectedEntity = { id: string; type: number };

type MainPermissionManageProps = {
	channelId: string;
	setIsPrivateChannel: React.Dispatch<React.SetStateAction<boolean>>;
	setPermissionsListHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
	saveTriggerRef: React.MutableRefObject<(() => Promise<void> | void) | null>;
	resetTriggerRef: React.MutableRefObject<(() => void) | null>;
	isSaving: boolean;
};

const MainPermissionManage: React.FC<MainPermissionManageProps> = ({
	channelId,
	setIsPrivateChannel,
	setPermissionsListHasChanged,
	saveTriggerRef,
	resetTriggerRef,
	isSaving
}) => {
	const { t } = useTranslation('channelSetting');
	const [permissions, setPermissions] = useState<{ [key: string]: number }>({});
	const hasPendingChanges = Object.keys(permissions).length !== 0;
	const [currentRoleId, setCurrentRoleId] = useState<SelectedEntity>();
	const [loadingRevealed, setLoadingRevealed] = useState(false);
	const listPermission = useSelector(selectPermissionChannel);
	const listPermissionRoleChannel = useAppSelector((state) =>
		selectAllPermissionRoleChannel(
			state,
			channelId,
			currentRoleId?.type === ENTITY_TYPE.ROLE ? currentRoleId.id : undefined,
			currentRoleId?.type === ENTITY_TYPE.USER ? currentRoleId.id : undefined
		)
	);
	const isLoading = useAppSelector((state) => selectIsPermissionRoleChannelLoading(state, channelId, currentRoleId?.id));
	const isLoaded = !!listPermissionRoleChannel;
	const rolesClan = useSelector(selectAllRolesClan);
	const selectRolesInChannel = useMemo(() => selectRolesByChannelId(channelId), [channelId]);
	const rolesInChannel = useSelector(selectRolesInChannel);
	const userIds = useSelector((state) => selectUserChannelIds(state, channelId));
	const channelUsers = useAppSelector((state) => selectRawDataUserGroup(state, channelId));
	const currentClanId = useSelector(selectCurrentClanId);
	const usersClanEntities = useSelector(selectEntitesUserClans);
	const usersClan = useSelector(selectAllUserClans);
	const profiles = useMemo(() => channelUserProfiles(channelUsers), [channelUsers]);
	// Members take the same row the member list above draws, identity fallback included:
	// a member the clan roster does not carry would otherwise be an untitled, unselectable row.
	const combinedArray = useMemo<PermissionEntityRow[]>(
		() => [
			...rolesInChannel.map((role) => ({
				id: role.id,
				title: role.title || '',
				subtitle: '',
				type: ENTITY_TYPE.ROLE,
				role
			})),
			...userIds.map((id) => {
				const member = permissionMemberRow(id, usersClanEntities[id], profiles[id]);
				return {
					id,
					title: member.name,
					subtitle: member.username,
					type: ENTITY_TYPE.USER,
					member
				};
			})
		],
		[rolesInChannel, userIds, usersClanEntities, profiles]
	);

	const { maxPermissionId } = useMyRole();
	const dispatch = useAppDispatch();

	const rolesNotInChannel = useMemo(() => {
		const roleInChannelIds = new Set(rolesInChannel.map((roleInChannel) => roleInChannel.id));
		return rolesClan.filter((role) => !roleInChannelIds.has(role.id));
	}, [rolesClan, rolesInChannel]);

	const usersNotInChannel = useMemo(() => {
		const userInChannelIds = new Set(userIds);
		return usersClan.filter((user) => !userInChannelIds.has(user.id));
	}, [usersClan, userIds]);

	const loadEntity = useCallback(
		(id: string, type: number) => {
			dispatch(
				permissionRoleChannelActions.fetchPermissionRoleChannel({
					channelId,
					roleId: type === ENTITY_TYPE.ROLE ? id : '',
					userId: type === ENTITY_TYPE.USER ? id : ''
				})
			);
		},
		[channelId, dispatch]
	);

	const selectEntity = useCallback(
		(id: string, type: number) => {
			setPermissions({});
			setLoadingRevealed(false);
			setCurrentRoleId({ id, type });
			loadEntity(id, type);
		},
		[loadEntity]
	);

	// Choices not saved yet pin the selection; the table says so instead of dropping them.
	const handleSelectRole = useCallback(
		(id: string, type: number) => {
			if (hasPendingChanges || currentRoleId?.id === id) {
				return;
			}
			selectEntity(id, type);
		},
		[hasPendingChanges, currentRoleId?.id, selectEntity]
	);

	useEffect(() => {
		if (currentRoleId && combinedArray.some((item) => item.id === currentRoleId.id)) {
			return;
		}
		const firstItem = combinedArray[0];
		if (firstItem) {
			selectEntity(firstItem.id, firstItem.type);
		} else if (currentRoleId) {
			setPermissions({});
			setCurrentRoleId(undefined);
		}
	}, [combinedArray, currentRoleId, selectEntity]);

	useEffect(() => {
		if (!currentRoleId || isLoaded) {
			return;
		}
		const timer = setTimeout(() => setLoadingRevealed(true), LOADING_REVEAL_DELAY_MS);
		return () => clearTimeout(timer);
	}, [currentRoleId, isLoaded]);

	const handleRetry = useCallback(() => {
		if (currentRoleId) {
			loadEntity(currentRoleId.id, currentRoleId.type);
		}
	}, [currentRoleId, loadEntity]);

	const canEdit = !isSaving && isLoaded;

	const handleSelect = useCallback(
		(id: string, option: number, active?: boolean) => {
			if (!canEdit) {
				return;
			}
			const matchingRoleChannel = listPermissionRoleChannel?.permission_role_channel?.find((roleChannel) => roleChannel.permission_id === id);

			if (active !== undefined) {
				if (matchingRoleChannel && matchingRoleChannel.active === active) {
					if (permissions[id] !== undefined) {
						const { [id]: _, ...rest } = permissions;
						setPermissions(rest);
					}
					return;
				} else {
					setPermissions((prevPermissions) => ({
						...prevPermissions,
						[id]: option
					}));
				}
			} else {
				if (matchingRoleChannel) {
					setPermissions((prevPermissions) => ({
						...prevPermissions,
						[id]: option
					}));
				} else {
					const { [id]: _, ...rest } = permissions;
					setPermissions(rest);
				}
			}
		},
		[canEdit, listPermissionRoleChannel, permissions]
	);

	const handleReset = useCallback(() => {
		setPermissions({});
	}, []);

	const handleSave = useCallback(async () => {
		if (!currentRoleId || !hasPendingChanges) {
			return;
		}
		const permissionsArray: ApiPermissionUpdate[] = Object.entries(permissions).map(([permission_id, type]) => ({
			permission_id,
			type,
			slug: listPermission.find((p) => p.id === permission_id)?.slug
		}));
		listPermission.forEach((p) => {
			if (permissions[p.id] !== undefined) {
				return;
			}
			const matchingRoleChannel = listPermissionRoleChannel?.permission_role_channel?.find((roleChannel) => roleChannel.permission_id === p.id);
			permissionsArray.push({
				permission_id: p.id,
				slug: p.slug,
				type: matchingRoleChannel ? (matchingRoleChannel.active ? TypeChoose.Tick : TypeChoose.Remove) : TypeChoose.Or
			});
		});
		const result = await dispatch(
			permissionRoleChannelActions.setPermissionRoleChannel({
				channelId,
				roleId: currentRoleId.type === ENTITY_TYPE.ROLE ? currentRoleId.id : '',
				permission: permissionsArray,
				maxPermissionId,
				userId: currentRoleId.type === ENTITY_TYPE.USER ? currentRoleId.id : '',
				clanId: currentClanId || ''
			})
		);
		// Choices stay pending until the server has taken them, so a failed save loses nothing.
		if (permissionRoleChannelActions.setPermissionRoleChannel.fulfilled.match(result) && result.payload) {
			setPermissions({});
			return;
		}
		dispatch(toastActions.addToast({ message: t('channelPermission.toast.failed'), type: 'error' }));
	}, [
		currentRoleId,
		hasPendingChanges,
		permissions,
		listPermission,
		listPermissionRoleChannel,
		channelId,
		maxPermissionId,
		currentClanId,
		dispatch,
		t
	]);

	useEffect(() => {
		setPermissionsListHasChanged(hasPendingChanges);
	}, [hasPendingChanges, setPermissionsListHasChanged]);

	useEffect(() => {
		saveTriggerRef.current = handleSave;
		resetTriggerRef.current = handleReset;
	}, [handleSave, handleReset, saveTriggerRef, resetTriggerRef]);

	const selectedTitle = combinedArray.find((item) => item.id === currentRoleId?.id)?.title;

	return (
		<div className="flex mt-4 gap-x-4">
			<ListRoleMember
				listManageInChannel={combinedArray}
				listRolesNotInChannel={rolesNotInChannel}
				listUsersNotInChannel={usersNotInChannel}
				channelId={channelId}
				selectedId={currentRoleId?.id}
				onSelect={handleSelectRole}
				onPrefetch={loadEntity}
			/>
			<ListPermission
				listPermission={listPermission}
				persisted={listPermissionRoleChannel}
				pending={permissions}
				selectedTitle={selectedTitle}
				isLoaded={isLoaded}
				isLoading={isLoading}
				loadingRevealed={loadingRevealed}
				canEdit={canEdit}
				hasPendingChanges={hasPendingChanges}
				onSelect={handleSelect}
				onRetry={handleRetry}
			/>
		</div>
	);
};

export default MainPermissionManage;
