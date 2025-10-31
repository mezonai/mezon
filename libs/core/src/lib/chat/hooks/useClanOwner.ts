import { selectAllAccount, selectCurrentClanCreatorId } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useClanOwner() {
	const currentClanCreatorId = useSelector(selectCurrentClanCreatorId);
	const userProfile = useSelector(selectAllAccount);

	const isClanOwner = useMemo(() => {
		return currentClanCreatorId === userProfile?.user?.id;
	}, [currentClanCreatorId, userProfile]);

	return isClanOwner;
}
