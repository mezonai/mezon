import { MemberProfile } from '@mezon/components';
import { useAppNavigation, useDirect } from '@mezon/core';
import { ChannelMembersEntity, FriendsEntity } from '@mezon/store';
import { MemberProfileType, MetaDateStatusUser } from '@mezon/utils';

type ActivityProps = {
	friend: FriendsEntity;
};
const ActivityListItem = ({ friend }: ActivityProps) => {
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromFriendPage, navigate } = useAppNavigation();

	const directMessageWithUser = async (userId: string) => {
		const response = await createDirectMessageWithUser(userId);
		if (response.channel_id) {
			const directChat = toDmGroupPageFromFriendPage(response.channel_id, Number(response.type));
			navigate(directChat);
		}
	};

	return (
		<div className=" dark:border-borderDefault border-gray-300 group/list_friends">
			<div
				key={friend.user?.id}
				onClick={() => directMessageWithUser(friend.user?.id ?? '')}
				className="flex justify-between items-center cursor-pointer dark:hover:bg-gray-800 hover:bg-white rounded-lg"
			>
				<div key={friend.user?.id} className={'flex-1'}>
					<MemberProfile
						avatar={friend?.user?.avatar_url ?? ''}
						name={(friend?.user?.display_name || friend?.user?.username) ?? ''}
						userNameAva={friend?.user?.username ?? ''}
						status={{ status: friend.user?.online, isMobile: false }}
						isHideStatus={true}
						isHideIconStatus={true}
						isHideAnimation={true}
						key={friend.user?.id}
						numberCharacterCollapse={100}
						classParent={friend.state !== undefined && friend.state >= 1 ? '' : 'friendList h-10'}
						positionType={MemberProfileType.LIST_ACTIVITY}
						customStatus={(friend.user?.metadata as MetaDateStatusUser).status ?? ''}
						isDM={true}
						user={friend as ChannelMembersEntity}
					/>
				</div>
			</div>
		</div>
	);
};

export default ActivityListItem;
