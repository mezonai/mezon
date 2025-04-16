import { selectCategoryExpandStateByCategoryId, selectIsUnreadChannelById, selectIsUnreadThreadInChannel, useAppSelector } from '@mezon/store-mobile';
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

export enum IThreadActiveType {
	Active = 1
}

export const ChannelListItem = React.memo((props: IChannelListItemProps) => {
	const isUnRead = useAppSelector((state) => selectIsUnreadChannelById(state, props?.data?.id));
	const isChannelActive = props?.isChannelActive;
	const isHaveParentActive = props?.isHaveParentActive;
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, props?.data?.category_id as string));
	const isChannelVoice = useMemo(() => {
		return (
			props?.data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_APP
		);
	}, [props?.data?.type]);
	const hasUnread = useAppSelector((state) => selectIsUnreadThreadInChannel(state, props?.data?.threadIds || []));

	const shouldDisplay = isCategoryExpanded || isUnRead || isChannelVoice || isChannelActive || isHaveParentActive || hasUnread;

	if (!shouldDisplay) return null;
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
});
