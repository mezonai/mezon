import { useAppNavigation, useDirect, useFriends, useMarkAsRead } from '@mezon/core';
import { channelUsersActions, deleteChannel, directActions, directMetaActions, removeMemberChannel, useAppDispatch } from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { useCallback } from 'react';

interface UseMenuHandlersParams {
	userProfile: any;
	hasKeyE2ee: boolean;
	directId: string;
	openUserProfile: () => void;
	isLastOne: boolean;
}

export function useMenuHandlers({ userProfile, hasKeyE2ee, directId }: UseMenuHandlersParams) {
	const dispatch = useAppDispatch();
	const { addFriend, deleteFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();
	const { handleMarkAsReadDM } = useMarkAsRead();

	const handleDirectMessageWithUser = useCallback(
		async (user?: any) => {
			if (!user?.id) return;

			const response = await createDirectMessageWithUser(user.id, user.display_name || user.username, user.username, user.avatar_url);

			if (response?.channel_id) {
				const directDM = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directDM);
			}
		},
		[createDirectMessageWithUser, toDmGroupPageFromMainApp, navigate]
	);

	const handleMarkAsRead = useCallback(
		(directId: string) => {
			const timestamp = Date.now() / 1000;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp: timestamp }));
			handleMarkAsReadDM(directId);
		},
		[dispatch, handleMarkAsReadDM]
	);

	const handleRemoveMemberFromGroup = useCallback(
		async (userId: string, channelId: string) => {
			if (!userId || !channelId) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: channelId,
						userId: userId,
						channelType: ChannelType.CHANNEL_TYPE_GROUP
					})
				);
			} catch (error) {
				dispatch({
					type: 'ERROR_NOTIFICATION',
					payload: {
						message: 'Failed to remove member from group',
						error
					}
				});
			}
		},
		[dispatch]
	);

	const handleLeaveDmGroup = useCallback(
		async (channelId: string, isLastOne: boolean) => {
			if (!channelId) return;

			const isLeaveOrDeleteGroup = isLastOne
				? await dispatch(deleteChannel({ clanId: '', channelId: channelId, isDmGroup: true }))
				: await dispatch(removeMemberChannel({ channelId: channelId, userIds: [userProfile?.user?.id as string], kickMember: false }));

			if (!isLeaveOrDeleteGroup) {
				return;
			}

			if (directId === channelId) {
				navigate('/chat/direct/friends');
			}

			await dispatch(directActions.remove(channelId));
		},
		[dispatch, navigate, userProfile?.user?.id, directId]
	);

	const handleEnableE2ee = useCallback(
		async (directId?: string, e2ee?: number) => {
			// Commented out code - implementation placeholder
		},
		[hasKeyE2ee, dispatch]
	);

	return {
		handleDirectMessageWithUser,
		handleMarkAsRead,
		handleRemoveMemberFromGroup,
		handleLeaveDmGroup,
		handleEnableE2ee,
		addFriend,
		deleteFriend
	};
}
