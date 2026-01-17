import { useFriends } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/utils';

type PendingFriendProps = {
	user: ChannelMembersEntity | null;
};

const PendingFriend = (props: PendingFriendProps) => {
	const { user } = props;
	const { acceptFriend, deleteFriend } = useFriends();
	const handleDefault = (event: any) => {
		event.stopPropagation();
	};
	return (
		<div className="p-2 rounded dark:bg-bgTertiary bg-[#E1E1E1] mt-2">
			<p className="dark:text-[#AEAEAE] text-colorTextLightMode text-left text-sm">{user?.user?.username} sent you a friend request.</p>
			<div className="flex gap-x-3 mt-2">
				<button
					className="rounded bg-bgSelectItem px-2 hover:bg-opacity-85 font-medium text-white"
					onClick={(e) => {
						handleDefault(e);
						if (user) {
							acceptFriend(user.user?.username || '', String(user.user?.id || ''));
						}
					}}
				>
					Accept
				</button>
				<button
					className="rounded bg-bgModifierHover px-2 hover:bg-opacity-85 font-medium text-white"
					onClick={(e) => {
						handleDefault(e);
						if (user) {
							deleteFriend(user.user?.username || '', String(user.user?.id || ''));
						}
					}}
				>
					Ignore
				</button>
			</div>
		</div>
	);
};

export default PendingFriend;
