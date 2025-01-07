import { selectMemberCustomStatusById, selectMemberStatusById, useAppSelector } from '@mezon/store';
import { useAuth } from './useAuth';

export function useMemberStatus(memberId: string) {
	const memberStatus = useAppSelector((state) => selectMemberStatusById(state, memberId));
	const myProfile = useAuth();
	const isMe = memberId === myProfile?.userId;
	return {
		status: isMe ? true : memberStatus.status,
		isMobile: memberStatus.isMobile
	};
}

export function useMemberCustomStatus(memberId: string, isDM?: boolean) {
	const memberStatus = useAppSelector((state) => selectMemberCustomStatusById(state, memberId, isDM));
	return memberStatus;
}
