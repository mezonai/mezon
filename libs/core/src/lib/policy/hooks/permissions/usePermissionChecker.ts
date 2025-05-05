import {
	overriddenPoliciesActions,
	selectAllChannelsWithMaxPermissionEntities,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usePermissionContext } from '../../context/PermissionContext';

function usePermissionChecker(permissions: EPermission[]): boolean[];
function usePermissionChecker(permissions: Array<EPermission | EOverriddenPermission>, channelId: string, clanId?: string): boolean[];

function usePermissionChecker(permissions: string[], channelId?: string, clanId?: string) {
	const currentClanId = useSelector(selectCurrentClanId);
	const effectiveClanId = clanId && clanId !== '0' ? clanId : currentClanId || '';
	const dispatch = useAppDispatch();
	const _ = useAppSelector(selectAllChannelsWithMaxPermissionEntities);

	const { checkPermissions } = usePermissionContext();

	// Get permissions check results from context
	const results = checkPermissions(permissions, channelId, effectiveClanId);

	// Handle fetching overridden policies for channel-specific permissions
	useEffect(() => {
		if (effectiveClanId && effectiveClanId !== '0' && channelId) {
			dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: effectiveClanId, channelId }));
		}
	}, [channelId, effectiveClanId, dispatch]);

	// Return the result array where each entry represents if the user has that permission
	return results;
}

export { usePermissionChecker };
