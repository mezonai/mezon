import { IChannelMember } from '@mezon/utils';
import { useMemo } from 'react';

export function useMessageSender(user?: IChannelMember | null) {
	const avatarImg = useMemo(() => {
		return user?.user?.avatarUrl || '';
	}, [user]);

	const hasAvatar = useMemo(() => {
		return Boolean(user?.user?.avatarUrl);
	}, [user]);

	const username = useMemo(() => {
		return user?.user?.username || '';
	}, [user]);

	const avatarChar = useMemo(() => {
		return user?.user?.username?.charAt(0)?.toUpperCase() || '';
	}, [user]);

	return {
		avatarImg,
		hasAvatar,
		username,
		avatarChar
	};
}
