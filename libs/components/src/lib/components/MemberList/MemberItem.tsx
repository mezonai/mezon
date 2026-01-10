import { useMemberStatus } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { selectAccountCustomStatus } from '@mezon/store';
import { useSelector } from 'react-redux';
import { useDirectMessageContextMenu } from '../../contexts';
import { BaseMemberProfile } from '../MemberProfile/MemberProfile';
import AddedByUser from './AddedByUser';
export type MemberItemProps = {
	user: ChannelMembersEntity;

	directMessageId?: string;
	isMobile?: boolean;
	isDM?: boolean;
	isMe?: boolean;
	createId?: string;
};

function MemberItem({ user, directMessageId, isDM = true, isMe, createId }: MemberItemProps) {
	const userMetaById = useMemberStatus(user.id);
	const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
	const status = useMemberStatus(user?.id);
	const { showContextMenu, setCurrentUser, openProfileItem } = useDirectMessageContextMenu();
	const handleClick = (event: React.MouseEvent) => {
		setCurrentUser(user);
		openProfileItem(event, user);
	};

	return (
		<div>
			<BaseMemberProfile
				id={user?.user?.id || ''}
				user={user}
				avatar={user.user?.avatarUrl || ''}
				username={user.user?.displayName || user.user?.username || ''}
				userMeta={{
					online: !!userMetaById?.online || !!isMe,
					status: userMetaById?.status
				}}
				isOwner={createId === user?.user?.id}
				userStatus={isMe ? currentUserCustomStatus : status.userStatus}
				onContextMenu={showContextMenu}
				onClick={handleClick}
			/>
			<AddedByUser groupId={directMessageId || ''} userId={user?.id} />
		</div>
	);
}

export default MemberItem;
