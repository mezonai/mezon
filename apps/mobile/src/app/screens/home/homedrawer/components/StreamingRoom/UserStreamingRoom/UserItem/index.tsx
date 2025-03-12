import { size } from '@mezon/mobile-ui';
import { selectMemberClanByUserId2 } from '@mezon/store';
import { useAppSelector } from '@mezon/store-mobile';
import React from 'react';
import MezonAvatar from '../../../../../../../componentUI/MezonAvatar';

function UserItem(user) {
	const userStream = useAppSelector((state) => selectMemberClanByUserId2(state, user?.user?.user_id || ''));
	return <MezonAvatar width={size.s_50} height={size.s_50} username={userStream?.user?.username} avatarUrl={userStream?.user?.avatar_url} />;
}

export default React.memo(UserItem);
