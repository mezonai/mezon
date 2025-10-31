import { selectCurrentClanCreatorId } from '@mezon/store';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useCheckOwnerForUser() {
	const currentClanCreatorId = useSelector(selectCurrentClanCreatorId);

	const checkClanOwner = useCallback((userId: string) => currentClanCreatorId === userId, [currentClanCreatorId]);

	return useMemo(() => [checkClanOwner], [checkClanOwner]);
}
