import { useFriends } from '@mezon/core';
import { ChannelMembersEntity } from '@mezon/utils';
import { useModal } from 'react-modal-hook';
import RemoveFriendModal from '../RemoveFriendModal';

type PendingFriendProps = {
	user: ChannelMembersEntity | null;
};

const PendingFriend = (props: PendingFriendProps) => {
	const { user } = props;
	const { acceptFriend, deleteFriend } = useFriends();
	const [showRemoveFriendModal, hideRemoveFriendModal] = useModal(
		() =>
			user?.user?.username && user?.user?.id ? (
				<RemoveFriendModal
					username={user.user.username}
					onClose={hideRemoveFriendModal}
					onConfirm={() => {
						deleteFriend(user.user?.username || '', user.user?.id || '');
						hideRemoveFriendModal();
					}}
				/>
			) : null,
		[user, deleteFriend]
	);
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
							acceptFriend(user.user?.username || '', user.user?.id || '');
						}
					}}
				>
					Accept
				</button>
				<button
					className="rounded bg-bgModifierHover px-2 hover:bg-opacity-85 font-medium text-white"
					onClick={(e) => {
						handleDefault(e);
						if (user?.user?.username && user?.user?.id) {
							showRemoveFriendModal();
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
