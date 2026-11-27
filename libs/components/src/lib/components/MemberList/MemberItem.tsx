import { useMemberStatus } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { selectAccountCustomStatus } from '@mezon/store';
import { useSelector } from 'react-redux';
import { useDirectMessageContextMenu } from '../../contexts';
import { BaseMemberProfile } from '../MemberProfile/MemberProfile';
import type { ProPalette } from '../ProfileBadges';
export type MemberItemProps = {
	user: ChannelMembersEntity;

	directMessageId?: string;
	isMobile?: boolean;
	isDM?: boolean;
	isMe?: boolean;
	createId?: string;
	isPro?: boolean;
	proPalette?: ProPalette;
};

function MemberItem({ user, directMessageId, isDM = true, isMe, createId, isPro, proPalette }: MemberItemProps) {
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
				avatar={user.user?.avatar_url || ''}
				username={user.user?.display_name || user.user?.username || ''}
				userMeta={{
					online: !!userMetaById?.online || !!isMe,
					status: userMetaById?.status
				}}
				isOwner={createId === user?.user?.id}
				userStatus={isMe ? currentUserCustomStatus : status.user_status}
				isPro={isPro}
				proPalette={proPalette}
				onContextMenu={showContextMenu}
				onClick={handleClick}
			/>
		</div>
	);
}

export default MemberItem;
