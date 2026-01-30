import type { DragEvent } from 'react';
import React, { memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	clansActions,
	selectCategoryExpandStateByCategoryId,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectIsUnreadChannelById,
	selectIsUnreadThreadInChannel,
	selectStreamMembersByChannelId,
	selectVoiceChannelMembersByChannelId,
	useAppSelector
} from '@mezon/store';
import type { ChannelThreads, IChannelMember } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import AvatarGroup, { AvatarCount } from '../../Avatar/AvatarGroup';
import type { ChannelLinkRef } from '../../ChannelLink';
import { ChannelLink } from '../../ChannelLink';
import { AvatarUserShort } from '../../ClanSettings/SettingChannel';
import UserListItem from '../../UserListVoiceChannel/UserListItemVoiceChannel';
import type { IChannelLinkPermission } from '../CategorizedChannels';

export type ChannelListItemRef = {
	channelId: string;
	channelRef: ChannelLinkRef | null;
	isInViewport: () => boolean;
};

type ChannelLinkContentProps = {
	channel: ChannelThreads;
	dragStart?: (e: DragEvent<HTMLDivElement>) => void;
	dragEnter?: (e: DragEvent<HTMLDivElement>) => void;
	isActive: boolean;
	permissions: IChannelLinkPermission;
};

const ChannelLinkContent: React.FC<ChannelLinkContentProps> = ({ channel, isActive, permissions, dragStart, dragEnter }) => {
	const dispatch = useDispatch();
	const isUnreadChannel = useSelector((state) => selectIsUnreadChannelById(state, channel.id));
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channel.id, channel.clan_id as string));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channel.id));
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const channelMemberList = useMemo(() => {
		if (channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE || channel.type === ChannelType.CHANNEL_TYPE_APP) return voiceChannelMembers;
		if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) return streamChannelMembers;
		return [];
	}, [channel.type, voiceChannelMembers, streamChannelMembers]);

	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, channel.category_id as string));

	const handleOpenInvite = () => {
		dispatch(clansActions.toggleInvitePeople({ status: true, channelId: channel.id }));
	};

	const renderChannelLink = () => {
		return (
			<ChannelLink
				clanId={channel?.clan_id}
				channel={channel}
				key={channel.channel_id}
				createInviteLink={handleOpenInvite}
				isPrivate={channel.channel_private}
				isUnReadChannel={isUnreadChannel}
				numberNotification={channel.count_mess_unread}
				channelType={channel?.type}
				isActive={isActive}
				permissions={permissions}
				dragStart={dragStart}
				dragEnter={dragEnter}
			/>
		);
	};

	const hasUnread = useAppSelector((state) => selectIsUnreadThreadInChannel(state, channel.threadIds || []));
	const isVoiceOrStreamingChannel =
		channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE ||
		channel.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		channel.type === ChannelType.CHANNEL_TYPE_APP;

	const hasMembersInVoice = isVoiceOrStreamingChannel && channelMemberList.length > 0;

	const shouldShowChannel =
		isCategoryExpanded ||
		isUnreadChannel ||
		hasUnread ||
		currentChannelId === channel.id ||
		currentChannelParentId === channel.id ||
		channel?.count_mess_unread ||
		hasMembersInVoice;

	const renderChannelContent = useMemo(() => {
		if (!shouldShowChannel) {
			return null;
		}

		if (!isVoiceOrStreamingChannel) {
			return <>{renderChannelLink()}</>;
		}

		return (
			<>
				{renderChannelLink()}
				{isCategoryExpanded ? (
					<UserListVoiceChannel channelId={channel.channel_id ?? ''} channelType={channel?.type} clanId={channel.clan_id || ''} />
				) : (
					channelMemberList.length > 0 && (
						<CollapsedMemberList channelId={channel.channel_id ?? ''} channelType={channel?.type} clanId={channel.clan_id || ''} />
					)
				)}
			</>
		);
	}, [
		shouldShowChannel,
		isVoiceOrStreamingChannel,
		isCategoryExpanded,
		channel.channel_id,
		channel.type,
		channel.clan_id,
		channelMemberList.length,
		renderChannelLink
	]);

	return <>{renderChannelContent} </>;
};

interface ICollapsedMemberListProps {
	channelId: string;
	clanId: string;
	channelType?: number;
}

const CollapsedMemberList = ({ channelId, clanId, channelType }: ICollapsedMemberListProps) => {
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId, clanId));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));
	const channelMemberList = useMemo(() => {
		if (channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE || channelType === ChannelType.CHANNEL_TYPE_APP) return voiceChannelMembers;
		if (channelType === ChannelType.CHANNEL_TYPE_STREAMING) return streamChannelMembers;
		return [];
	}, [channelType, voiceChannelMembers, streamChannelMembers]);
	return (
		<AvatarGroup className={'px-6'}>
			{[...channelMemberList].slice(0, 5).map((member, index) => (
				<AvatarUserShort id={member.user_id || ''} key={(member.user_id || '') + index} />
			))}
			{channelMemberList && channelMemberList.length > 5 && (
				<AvatarCount number={channelMemberList?.length - 5 > 99 ? 99 : channelMemberList?.length - 5} />
			)}
		</AvatarGroup>
	);
};

type UserListVoiceChannelProps = {
	readonly channelId: string;
	readonly clanId: string;
	channelType?: number;
};

function UserListVoiceChannel({ channelId, channelType, clanId }: UserListVoiceChannelProps) {
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId, clanId));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));
	const channelMemberList = useMemo(() => {
		if (channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE || channelType === ChannelType.CHANNEL_TYPE_APP) return voiceChannelMembers;
		if (channelType === ChannelType.CHANNEL_TYPE_STREAMING) return streamChannelMembers;
		return [];
	}, [channelType, voiceChannelMembers, streamChannelMembers]);

	if (channelMemberList.length === 0) {
		return null;
	}

	return channelMemberList?.map((item: IChannelMember) => {
		return (
			<div key={item.id} className={'mt-[1px]'}>
				<UserListItem user={item} />
			</div>
		);
	});
}

export default memo(ChannelLinkContent);
