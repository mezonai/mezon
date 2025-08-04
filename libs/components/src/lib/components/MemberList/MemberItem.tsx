import { useUserMetaById } from '@mezon/core';
import { ChannelMembersEntity, selectAccountCustomStatus, selectAllAccount, selectMemberCustomStatusById, useAppSelector } from '@mezon/store';
import { MemberProfileType } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import { MemberProfile } from '../MemberProfile';
import AddedByUser from './AddedByUser';
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
};

function MemberItem({ user, listProfile, isOffline, positionType, dataMemberCreate, directMessageId, name, isDM, isMobile }: MemberItemProps) {
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusById(state, user.user?.id || '', isDM));
	const userProfile = useSelector(selectAllAccount);
	const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
	const displayCustomStatus = user.user?.id === userProfile?.user?.id ? currentUserCustomStatus : userCustomStatus;
	const userMetaById = useUserMetaById(user.user?.id);

	const statusOnline = useMemo(() => {
		if (userProfile?.user?.metadata && user.user?.id === userProfile.user.id) {
			const metadata = safeJSONParse(userProfile?.user?.metadata);
			return metadata?.user_status;
		}
		if (userMetaById) {
			return userMetaById as any;
		}
	}, [user.user?.id, userMetaById, userProfile?.user?.id, userProfile?.user?.metadata]);

	const isMe = user?.user?.id === userProfile?.user?.id;

	return (
		<div>
			<MemberProfile
				numberCharacterCollapse={30}
				avatar={user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '')}
				name={name || ''}
				usernameAva={user?.user?.username}
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
			<AddedByUser groupId={directMessageId || ''} userId={user?.id} />
		</div>
	);
}

export default MemberItem;
