import type { requestAddFriendParam } from '@mezon/store';
import {
	EStateFriend,
	broadcastFriendRelationRefreshToOtherTabs,
	broadcastFriendRelationToOtherTabs,
	friendsActions,
	selectAddFriendRequestLoading,
	selectAllFriends,
	selectCurrentUserId,
	selectDmGroupCurrentId,
	selectMemberByGroupId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiUser } from 'mezon-js';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useFriends() {
	const friends = useSelector(selectAllFriends);
	const currentDM = useSelector(selectDmGroupCurrentId);
	const groupDmMember = useAppSelector((state) => selectMemberByGroupId(state, currentDM as string));
	const numberMemberInDmGroup = useMemo(() => groupDmMember?.length || 0, [groupDmMember]);
	const currentUserId = useSelector(selectCurrentUserId);
	const isAddingFriend = useSelector(selectAddFriendRequestLoading);
	const dispatch = useAppDispatch();

	const quantityPendingRequest = useMemo(() => {
		return friends.filter((obj) => obj.state === 2).length || 0;
	}, [friends]);

	const addFriend = useCallback(
		async ({ ids, usernames, isAcceptingRequest, isMobile = false, displayName, avatar }: requestAddFriendParam) => {
			const response = await dispatch(
				friendsActions.sendRequestAddFriend({
					ids,
					usernames,
					isAcceptingRequest,
					isMobile,
					displayName,
					avatar
				})
			);
			if (isMobile) return response;
		},
		[dispatch]
	);

	const acceptFriend = useCallback(
		async (username: string, id: string, isMobile = false) => {
			const body = {
				usernames: username,
				ids: id,
				isAcceptingRequest: true,
				isMobile
			};
			const response = await dispatch(friendsActions.sendRequestAddFriend(body));
			if (isMobile) return response;
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
		async (username: string, id: string, profile?: Pick<ApiUser, 'display_name' | 'avatar_url'>) => {
			const body = {
				ids: [id]
			};
			const response = await dispatch(friendsActions.sendRequestBlockFriend(body));

			if (response?.meta?.requestStatus === 'fulfilled' && currentUserId) {
				const blockState = {
					userId: id,
					state: EStateFriend.BLOCK,
					sourceId: currentUserId,
					username,
					display_name: profile?.display_name,
					avatar_url: profile?.avatar_url
				};
				dispatch(friendsActions.applyFriendBlockState(blockState));
				broadcastFriendRelationToOtherTabs(blockState);
				return true;
			}
			throw new Error('BLOCK_FRIEND_FAILED');
		},
		[dispatch, currentUserId]
	);

	const unBlockFriend = useCallback(
		async (_username: string, id: string) => {
			const body = {
				ids: [id]
			};
			const response = await dispatch(friendsActions.sendRequestUnblockFriend(body));
			if (response?.meta?.requestStatus === 'fulfilled' && currentUserId) {
				await dispatch(friendsActions.fetchListFriends({ noCache: true }));
				broadcastFriendRelationRefreshToOtherTabs(currentUserId);
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
			numberMemberInDmGroup,
			isAddingFriend
		}),
		[
			friends,
			quantityPendingRequest,
			addFriend,
			acceptFriend,
			deleteFriend,
			blockFriend,
			unBlockFriend,
			filteredFriends,
			numberMemberInDmGroup,
			isAddingFriend
		]
	);
}
