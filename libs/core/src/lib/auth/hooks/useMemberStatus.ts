import { selectUserStatusById, useAppSelector } from '@mezon/store';
import { EUserStatus } from '@mezon/utils';
import { useAuth } from './useAuth';

export function useMemberStatus(memberId: string) {
	const memberStatus = useAppSelector((state) => selectUserStatusById(state, memberId));
	const { userProfile } = useAuth();
	return {
		status:
			userProfile?.user?.id === memberId
				? (userProfile?.user?.status as EUserStatus) || EUserStatus.ONLINE
				: memberStatus?.online
					? (memberStatus.status as EUserStatus) || EUserStatus.ONLINE
					: EUserStatus.INVISIBLE,
		user_status: userProfile?.user?.id === memberId ? userProfile?.user?.user_status : memberStatus?.user_status,
		isMobile: false,
		online:
			(userProfile?.user?.id === memberId && (userProfile?.user?.status as EUserStatus) === EUserStatus.INVISIBLE) ||
			(memberStatus?.status as EUserStatus) === EUserStatus.INVISIBLE
				? false
				: !!memberStatus?.online
	};
}
