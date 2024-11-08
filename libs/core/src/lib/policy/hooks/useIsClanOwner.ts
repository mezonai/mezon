import { selectClanById } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export const useIsClanOwner = (clanId: string) => {
	const getClan = useSelector(selectClanById(clanId));
	const { userProfile } = useAuth();

	const isClanOwner = useMemo(() => {
		return getClan?.creator_id === userProfile?.user?.id;
	}, [getClan, userProfile]);
	return isClanOwner;
};
