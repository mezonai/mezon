import { useAppNavigation, useDirect, useFriends, useMarkAsRead } from '@mezon/core';
import {
	channelUsersActions,
	channelsActions,
	deleteChannel,
	directActions,
	directMetaActions,
	getStore,
	removeMemberChannel,
	selectDirectById,
	selectLatestMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { useCallback } from 'react';

interface UseMenuHandlersParams {
	userProfile: any;
	hasKeyE2ee: boolean;
	directId: string;
	openUserProfile: () => void;
	isLastOne?: boolean;
}

export function useMenuHandlers({ userProfile, hasKeyE2ee, directId }: UseMenuHandlersParams) {
	const dispatch = useAppDispatch();
	const { addFriend, deleteFriend, blockFriend, unBlockFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();
	const { handleMarkAsReadDM } = useMarkAsRead();
	const currentDirect = useAppSelector((state) => selectDirectById(state, directId));

	const handleDirectMessageWithUser = useCallback(
		async (user?: any) => {
			if (!user?.id) return;

			const response = await createDirectMessageWithUser(
				user.id,
				user?.user?.display_name || user?.user?.username,
				user?.user?.username,
				user?.user?.avatar_url
			);

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
			const store = getStore();
			const messageId = store ? selectLatestMessageId(store.getState(), directId) : undefined;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp, messageId }));
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
						channelId,
						userId,
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
				? await dispatch(deleteChannel({ clanId: '0', channelId, isDmGroup: true }))
				: await dispatch(removeMemberChannel({ channelId, userIds: [userProfile?.user?.id as string], kickMember: false }));

			if (!isLeaveOrDeleteGroup) {
				return;
			}

			if (directId === channelId) {
				dispatch(directActions.setDmGroupCurrentId(''));
				navigate('/chat/direct/friends');
			}

			await dispatch(directActions.remove(channelId));
		},
		[dispatch, navigate, userProfile?.user?.id, directId]
	);

	const handleEnableE2ee = useCallback(
		async (directId?: string, e2ee?: number) => {
			if (!directId || !currentDirect) return;

			const updateChannel = {
				channel_id: directId,
				channel_label: '',
				category_id: currentDirect.category_id,
				app_id: currentDirect.app_id || '',
				e2ee: !currentDirect.e2ee ? 1 : 0
			};

			await dispatch(channelsActions.updateChannel(updateChannel));
		},
		[currentDirect, dispatch]
	);

	return {
		handleDirectMessageWithUser,
		handleMarkAsRead,
		handleRemoveMemberFromGroup,
		handleLeaveDmGroup,
		handleEnableE2ee,
		addFriend,
		deleteFriend,
		blockFriend,
		unBlockFriend
	};
}
