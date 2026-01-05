import { useMyRole } from '@mezon/core';
import {
	permissionRoleChannelActions,
	selectAllPermissionRoleChannel,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectEntitesUserClans,
	selectPermissionChannel,
	selectRolesByChannelId,
	selectUserChannelIds,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiPermissionUpdate } from 'mezon-js/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TypeChoose } from './ItemPermission';
import type { ListPermissionHandle } from './ListPermission';
import ListPermission from './ListPermission';
import ListRoleMember from './ListRoleMember';

export const ENTITY_TYPE = {
	ROLE: 0,
	USER: 1
} as const;

type MainPermissionManageProps = {
	channelId: string;
	setIsPrivateChannel: React.Dispatch<React.SetStateAction<boolean>>;
	setPermissionsListHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
	saveTriggerRef: React.MutableRefObject<(() => void) | null>;
	resetTriggerRef: React.MutableRefObject<(() => void) | null>;
};

const MainPermissionManage: React.FC<MainPermissionManageProps> = ({
	channelId,
	setIsPrivateChannel,
	setPermissionsListHasChanged,
	saveTriggerRef,
	resetTriggerRef
}) => {
	const [permissions, setPermissions] = useState<{ [key: string]: number }>({});
	const permissionsLength = useMemo(() => {
		return Object.keys(permissions).length;
	}, [permissions]);
	const [currentRoleId, setCurrentRoleId] = useState<{ id: string; type: number }>();
	const listPermission = useSelector(selectPermissionChannel);
	const listPermissionRoleChannel = useAppSelector((state) =>
		selectAllPermissionRoleChannel(
			state,
			channelId,
			currentRoleId?.type === ENTITY_TYPE.ROLE ? currentRoleId.id : undefined,
			currentRoleId?.type === ENTITY_TYPE.USER ? currentRoleId.id : undefined
		)
	);
	const rolesClan = useSelector(selectAllRolesClan);
	const rolesInChannel = useSelector(selectRolesByChannelId(channelId));
	const userIds = useSelector((state) => selectUserChannelIds(state, channelId));
	const currentClanId = useSelector(selectCurrentClanId);
	const usersClanEntities = useSelector(selectEntitesUserClans);
	const usersClan = useSelector(selectAllUserClans);
	const combinedArray = useMemo(
		() => [
			...rolesInChannel.map((role) => ({
				id: role.id,
				title: role.title,
				type: ENTITY_TYPE.ROLE
			})),
			...userIds.map((id) => ({
				id: usersClanEntities[id]?.id,
				title: usersClanEntities[id]?.user?.username,
				type: ENTITY_TYPE.USER
			}))
		],
		[rolesInChannel, userIds, usersClanEntities]
	);

	const { maxPermissionId } = useMyRole();
	const dispatch = useAppDispatch();

	const rolesNotInChannel = useMemo(() => {
		const roleInChannelIds = new Set(rolesInChannel.map((roleInChannel) => roleInChannel.id));
		return rolesClan.filter((role) => !roleInChannelIds.has(role.id));
	}, [rolesClan, rolesInChannel]);

	const listPermissionRef = useRef<ListPermissionHandle>(null);

	const handleSelect = useCallback(
		(id: string, option: number, active?: boolean) => {
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
		[listPermissionRoleChannel, permissions]
	);

	const handleSelectRole = useCallback(
		(id: string, type: number) => {
			setPermissions({});
			setCurrentRoleId({ id, type });
			listPermissionRef.current?.reset();
		},
		[setCurrentRoleId]
	);

	useEffect(() => {
		if (!currentRoleId && combinedArray.length > 0) {
			const firstItem = combinedArray[0];
			handleSelectRole(firstItem.id, firstItem.type);
		}
	}, [combinedArray, currentRoleId, handleSelectRole]);

	const handleReset = () => {
		setPermissions({});
		listPermissionRef.current?.reset();
	};

	resetTriggerRef.current = handleReset;

	const handleSave = async (id: string, permissionsArray: ApiPermissionUpdate[], type: number) => {
		setPermissions({});
		const intersection = listPermission.filter((x) => {
			return !permissionsArray.some((y) => x.id === y.permission_id);
		});
		intersection.forEach((p) => {
			const matchingRoleChannel = listPermissionRoleChannel?.permission_role_channel?.find((roleChannel) => roleChannel.permission_id === p.id);
			permissionsArray.push({
				permission_id: p.id,
				slug: p.slug,
				type: matchingRoleChannel ? (matchingRoleChannel.active ? TypeChoose.Tick : TypeChoose.Remove) : TypeChoose.Or
			});
		});
		if (type === ENTITY_TYPE.ROLE) {
			await dispatch(
				permissionRoleChannelActions.setPermissionRoleChannel({
					channelId,
					roleId: id || '',
					permission: permissionsArray,
					maxPermissionId,
					userId: '',
					clanId: currentClanId || ''
				})
			);
		} else {
			await dispatch(
				permissionRoleChannelActions.setPermissionRoleChannel({
					channelId,
					roleId: '',
					permission: permissionsArray,
					maxPermissionId,
					userId: id || '',
					clanId: currentClanId || ''
				})
			);
		}
	};

	useEffect(() => {
		const hasPermissionsListChanged = permissionsLength !== 0;
		setPermissionsListHasChanged(hasPermissionsListChanged);
	}, [permissions, permissionsLength, setPermissionsListHasChanged]);

	useEffect(() => {
		const permissionsArray: ApiPermissionUpdate[] = [];
		for (const permission_id in permissions) {
			permissionsArray.push({
				permission_id,
				type: permissions[permission_id],
				slug: listPermission.filter((p) => p.id === permission_id).at(0)?.slug
			});
		}
		saveTriggerRef.current = async () => {
			await handleSave(currentRoleId?.id || '', permissionsArray, currentRoleId?.type || 0);
		};
	}, [permissions, currentRoleId]);

	return (
		combinedArray.length > 0 && (
			<div className="flex mt-4 gap-x-4">
				<ListRoleMember
					listManageInChannel={combinedArray}
					listManageNotInChannel={rolesNotInChannel}
					usersClan={usersClan}
					channelId={channelId}
					onSelect={handleSelectRole}
					canChange={permissionsLength === 0}
				/>
				<ListPermission
					channelId={channelId}
					listPermission={listPermission}
					onSelect={handleSelect}
					currentRoleId={currentRoleId}
					ref={listPermissionRef}
				/>
			</div>
		)
	);
};

export default MainPermissionManage;
