import {
	getStore,
	selectCategoryExpandStateByCategoryId,
	selectIsUnreadChannelById,
	selectIsUnreadThreadInChannel,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import ChannelItem from '../ChannelItem';
import UserListVoiceChannel from '../ChannelListUserVoice';

interface IChannelListItemProps {
	data: any;
	isChannelActive?: boolean;
	isHaveParentActive?: boolean;
}

export enum StatusVoiceChannel {
	Active = 1,
	No_Active = 0
}

export const ChannelListItem = React.memo(
	(props: IChannelListItemProps) => {
		const isUnRead = useAppSelector((state) => selectIsUnreadChannelById(state, props?.data?.id));
		const isChannelActive = props?.isChannelActive;
		const isHaveParentActive = props?.isHaveParentActive;
		const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, props?.data?.category_id as string));
		const isChannelVoice = useMemo(() => {
			return (
				props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
				props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE ||
				props?.data?.type === ChannelType.CHANNEL_TYPE_APP
			);
		}, [props?.data?.type]);
		const hasUnread = useAppSelector((state) => selectIsUnreadThreadInChannel(state, props?.data?.threadIds || []));
		const shouldDisplay =
			isCategoryExpanded ||
			isUnRead ||
			isChannelVoice ||
			isChannelActive ||
			isHaveParentActive ||
			hasUnread ||
			props?.data?.count_mess_unread > 0;

		const isChildHaveUnRead = useMemo(() => {
			try {
				if (shouldDisplay) return true;

				if (!props?.data?.threadIds?.length) {
					return false;
				}

				const store = getStore();
				const state = store.getState(); // Get state once instead of calling function repeatedly

				return props?.data?.threadIds?.some?.((threadId: string) => selectIsUnreadChannelById(state, threadId));
			} catch (e) {
				return false;
			}
		}, [props?.data?.threadIds, shouldDisplay]);

		if (!shouldDisplay && !isChildHaveUnRead) return null;
		return (
			<>
				{!isChannelVoice && <ChannelItem data={props?.data} isUnRead={isUnRead} isActive={isChannelActive} />}
				{isChannelVoice && (
					<UserListVoiceChannel
						channelId={props?.data?.channel_id}
						isCategoryExpanded={isCategoryExpanded}
						data={props?.data}
						isUnRead={false}
						isActive={isChannelActive}
					/>
				)}
			</>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.data?.channel_label === nextProps?.data?.channel_label &&
			prevProps?.data?.channel_private === nextProps?.data?.channel_private &&
			prevProps?.data?.channel_id === nextProps?.data?.channel_id &&
			prevProps?.data?.count_mess_unread === nextProps?.data?.count_mess_unread &&
			prevProps?.isChannelActive === nextProps?.isChannelActive &&
			prevProps?.isHaveParentActive === nextProps?.isHaveParentActive
		);
	}
);
