import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCategoryExpandStateByCategoryId, selectIsUnreadChannelById, selectIsUnreadThreadInChannel, useAppSelector } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import ChannelItem from '../ChannelItem';
import UserListVoiceChannel from '../ChannelListUserVoice';

interface IChannelListItemProps {
	data: any;
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
	const [channelIdActive, setChannelIdActive] = useState<string>('');
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, props?.data?.category_id as string));
	const isChannelVoice = useMemo(() => {
		return (
			props?.data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
		);
	}, [props?.data?.type]);
	const hasUnread = useAppSelector((state) => selectIsUnreadThreadInChannel(state, props?.data?.threadIds || []));

	const timeoutRef = useRef<any>();

	useEffect(() => {
		const event = DeviceEventEmitter.addListener(ActionEmitEvent.CHANNEL_ID_ACTIVE, (channelId: string) => {
			setChannelIdActive(channelId);
		});

		return () => {
			event.remove();
			timeoutRef.current && clearTimeout(timeoutRef.current);
		};
	}, [props.data.id]);

	const shouldDisplay =
		isCategoryExpanded ||
		isUnRead ||
		isChannelVoice ||
		channelIdActive === props?.data?.channel_id ||
		props?.data?.threadIds?.includes(channelIdActive) ||
		hasUnread;

	if (!shouldDisplay) return null;
	return (
		<>
			{!isChannelVoice && <ChannelItem data={props?.data} isUnRead={isUnRead} isActive={channelIdActive === props?.data?.channel_id} />}
			{isChannelVoice && (
				<UserListVoiceChannel
					channelId={props?.data?.channel_id}
					isCategoryExpanded={isCategoryExpanded}
					data={props?.data}
					isUnRead={false}
					isActive={channelIdActive === props?.data?.channel_id}
				/>
			)}
		</>
	);
});
