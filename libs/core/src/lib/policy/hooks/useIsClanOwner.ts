import { selectAllAccount, selectClanById } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useIsClanOwner = (clanId: string) => {
	const getClan = useSelector(selectClanById(clanId));
	const userProfile = useSelector(selectAllAccount);

	const isClanOwner = useMemo(() => {
		return getClan?.creator_id === userProfile?.user?.id;
	}, [getClan, userProfile]);
	return isClanOwner;
};
