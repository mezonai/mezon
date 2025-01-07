import { useAuth, useMemberCustomStatus } from '@mezon/core';
import { ChannelMembersEntity, selectAccountCustomStatus } from '@mezon/store';
import { MemberProfileType } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import { MemberProfile } from '../MemberProfile';
export type MemberItemProps = {
	user: ChannelMembersEntity;
	listProfile?: boolean;
	isOffline?: boolean;
	isMobile?: boolean;
	positionType?: MemberProfileType;
	dataMemberCreate?: DataMemberCreate;
	directMessageId?: string;
	name?: string;
	isDM: boolean;
	statusOnline?: any;
};

function MemberItem({
	user,
	listProfile,
	isOffline,
	positionType,
	dataMemberCreate,
	directMessageId,
	name,
	isDM,
	isMobile,
	statusOnline
}: MemberItemProps) {
	const userCustomStatus = useMemberCustomStatus(user.user?.id || '', isDM);
	const { userProfile } = useAuth();
	const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
	const displayCustomStatus = user.user?.id === userProfile?.user?.id ? currentUserCustomStatus : userCustomStatus;

	const isMe = useMemo(() => {
		return user?.user?.id === userProfile?.user?.id;
	}, [user?.user?.id, userProfile?.user?.id]);

	return (
		<MemberProfile
			numberCharacterCollapse={30}
			avatar={user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '')}
			name={name || ''}
			userNameAva={user?.user?.username}
			status={{ status: isMe ? true : !isOffline, isMobile }}
			customStatus={displayCustomStatus}
			isHideStatus={true}
			isHideIconStatus={false}
			textColor="[#AEAEAE]"
			user={user}
			listProfile={listProfile}
			isOffline={isMe ? false : isOffline}
			positionType={positionType}
			dataMemberCreate={dataMemberCreate}
			hideLongName={true}
			isDM={isDM}
			statusOnline={statusOnline}
		/>
	);
}

export default MemberItem;
