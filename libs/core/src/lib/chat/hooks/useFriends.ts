import type { requestAddFriendParam } from '@mezon/store';
import {
	EStateFriend,
	friendsActions,
	selectAllFriends,
	selectCurrentUserId,
	selectDmGroupCurrentId,
	selectMemberByGroupId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

// check later
export function useFriends() {
	const friends = useSelector(selectAllFriends);
	const currentDM = useSelector(selectDmGroupCurrentId);
	const groupDmMember = useAppSelector((state) => selectMemberByGroupId(state, currentDM as string));
	const numberMemberInDmGroup = useMemo(() => groupDmMember?.length || 0, [groupDmMember]);
	const currentUserId = useSelector(selectCurrentUserId);
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
				ids: [id],
				isAcceptingRequest: true
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
		async (username: string, id: string) => {
			const body = {
				ids: [id]
			};
			const response = await dispatch(friendsActions.sendRequestBlockFriend(body));

			if (response?.meta?.requestStatus === 'fulfilled' && currentUserId) {
				dispatch(
					friendsActions.updateFriendState({
						userId: id,
						sourceId: currentUserId
					})
				);
				return true;
			}
			throw new Error('BLOCK_FRIEND_FAILED');
		},
		[dispatch, currentUserId]
	);

	const unBlockFriend = useCallback(
		async (username: string, id: string) => {
			const body = {
				ids: [id]
			};
			const response = await dispatch(friendsActions.sendRequestUnblockFriend(body));
			if (response?.meta?.requestStatus === 'fulfilled' && currentUserId) {
				dispatch(
					friendsActions.updateFriendState({
						userId: id
					})
				);
				return true;
			}
			throw new Error('UNBLOCK_FRIEND_FAILED');
		},
		[currentUserId, dispatch]
	);

	const filteredFriends = useCallback(
		(searchTerm: string, isAddMember?: boolean) => {
			if (isAddMember) {
				return friends.filter((friend) => {
					if (friend.state === EStateFriend.BLOCK) {
						return false;
					}

					if (friend.user?.display_name?.toUpperCase().includes(searchTerm) || friend.user?.username?.toUpperCase().includes(searchTerm)) {
						if (!groupDmMember || !Object.values(groupDmMember)?.some((user) => user.id === friend.id)) {
							return friend;
						}
					}
				});
			}
			return friends.filter(
				(friend) =>
					friend.state !== EStateFriend.BLOCK &&
					(friend.user?.display_name?.toUpperCase().includes(searchTerm) || friend.user?.username?.toUpperCase().includes(searchTerm))
			);
		},
		[friends, groupDmMember]
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
		[friends, quantityPendingRequest, addFriend, acceptFriend, deleteFriend, blockFriend, unBlockFriend, filteredFriends, numberMemberInDmGroup]
	);
}
