import {
	friendsActions,
	requestAddFriendParam,
	selectAllFriends,
	selectDmGroupCurrentId,
	selectGrouplMembers,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

// check later
export function useFriends() {
	const friends = useSelector(selectAllFriends);
	const currentDM = useSelector(selectDmGroupCurrentId);
	const groupDmMember = useAppSelector((state) => selectGrouplMembers(state, currentDM as string));
	const numberMemberInDmGroup = useMemo(() => groupDmMember.length, [groupDmMember]);
	const dispatch = useAppDispatch();

	const quantityPendingRequest = useMemo(() => {
		return friends.filter((obj) => obj.state === 2).length || 0;
	}, [friends]);

	const addFriend = useCallback(
		async (requestAddFriend: requestAddFriendParam) => {
			await dispatch(friendsActions.sendRequestAddFriend(requestAddFriend));
		},
		[dispatch]
	);

	const acceptFriend = useCallback(
		(username: string, id: string) => {
			const body = {
				usernames: [username],
				ids: [id]
			};
			dispatch(friendsActions.sendRequestAddFriend(body));
		},
		[dispatch]
	);

	const deleteFriend = useCallback(
		(username: string, id: string) => {
			const body = {
				usernames: [username],
				ids: [id]
			};
			dispatch(friendsActions.sendRequestDeleteFriend(body));
		},
		[dispatch]
	);

	const blockFriend = useCallback(
		(username: string, id: string) => {
			const body = {
				usernames: [username],
				ids: [id]
			};
			dispatch(friendsActions.sendRequestBlockFriend(body));
		},
		[dispatch]
	);

	const unBlockFriend = useCallback(
		(username: string, id: string) => {
			const body = {
				usernames: [username],
				ids: [id]
			};
			dispatch(friendsActions.sendRequestDeleteFriend(body));
		},
		[dispatch]
	);

	const filteredFriends = useCallback(
		(searchTerm: string, isAddMember?: boolean) => {
			if (isAddMember) {
				return friends.filter((friend) => {
					if (friend.user?.display_name?.toUpperCase().includes(searchTerm) || friend.user?.username?.toUpperCase().includes(searchTerm)) {
						if (!Object.values(groupDmMember)?.some((user) => user.id === friend.id)) {
							return friend;
						}
					}
				});
			}
			return friends.filter(
				(friend) => friend.user?.display_name?.toUpperCase().includes(searchTerm) || friend.user?.username?.toUpperCase().includes(searchTerm)
			);
		},
		[friends]
	);

	return useMemo(
		() => ({
			friends,
			quantityPendingRequest,
			addFriend,
			acceptFriend,
			deleteFriend,
			blockFriend,
			unBlockFriend,
			filteredFriends,
			numberMemberInDmGroup
		}),
		[friends, quantityPendingRequest, addFriend, acceptFriend, deleteFriend, blockFriend, unBlockFriend, filteredFriends]
	);
}
