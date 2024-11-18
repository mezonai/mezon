import { MemberProfile } from '@mezon/components';
import { useAppNavigation, useDirect } from '@mezon/core';
import { ChannelMembersEntity } from '@mezon/store';
import { IUserItemActivity, MemberProfileType, MetaDateStatusUser } from '@mezon/utils';

type ActivityProps = {
	user?: IUserItemActivity;
};
const ActivityListItem = ({ user }: ActivityProps) => {
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
				key={user?.user?.id}
				onClick={() => directMessageWithUser(user?.user?.id ?? '')}
				className="flex justify-between items-center cursor-pointer dark:hover:bg-gray-800 hover:bg-white rounded-lg"
			>
				<div key={user?.user?.id} className={'flex-1'}>
					<MemberProfile
						avatar={user?.user?.avatar_url ?? ''}
						name={(user?.user?.display_name || user?.user?.username) ?? ''}
						userNameAva={user?.user?.username ?? ''}
						status={{ status: user?.user?.online, isMobile: false }}
						isHideStatus={true}
						isHideIconStatus={true}
						isHideAnimation={true}
						key={user?.user?.id}
						numberCharacterCollapse={100}
						positionType={MemberProfileType.LIST_ACTIVITY}
						customStatus={(user?.user?.metadata as MetaDateStatusUser).status ?? ''}
						isDM={true}
						user={user as ChannelMembersEntity}
					/>
				</div>
			</div>
		</div>
	);
};

export default ActivityListItem;
