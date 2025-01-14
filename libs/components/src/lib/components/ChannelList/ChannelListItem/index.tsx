import { Avatar } from 'flowbite-react';
import React, { memo, Ref, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	clansActions,
	ISFUUsersEntity,
	selectCategoryExpandStateByCategoryId,
	selectIsUnreadChannelById,
	selectStreamMembersByChannelId,
	selectVoiceChannelMembersByChannelId,
	useAppSelector,
	UsersStreamEntity,
	VoiceEntity
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelThreads } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { ChannelLink, ChannelLinkRef } from '../../ChannelLink';
import { AvatarUserShort } from '../../ClanSettings/SettingChannel';
import ThreadListChannel, { ListThreadChannelRef } from '../../ThreadListChannel';
import UserListVoiceChannel from '../../UserListVoiceChannel';
import { IChannelLinkPermission } from '../CategorizedChannels';

type ChannelListItemProp = {
	channel: ChannelThreads;
	isActive: boolean;
	permissions: IChannelLinkPermission;
};

export type ChannelListItemRef = {
	scrollIntoChannel: (options?: ScrollIntoViewOptions) => void;
	scrollIntoThread: (threadId: string, options?: ScrollIntoViewOptions) => void;
	channelId: string;
	channelRef: ChannelLinkRef | null;
};

const ChannelListItem = React.forwardRef<ChannelListItemRef | null, ChannelListItemProp>((props, ref) => {
	const { channel, isActive, permissions } = props;

	const listThreadRef = useRef<ListThreadChannelRef | null>(null);
	const channelLinkRef = useRef<ChannelLinkRef | null>(null);

	useImperativeHandle(ref, () => ({
		scrollIntoChannel: (options: ScrollIntoViewOptions = { block: 'center' }) => {
			channelLinkRef.current?.scrollIntoView(options);
		},
		scrollIntoThread: (threadId: string, options: ScrollIntoViewOptions = { block: 'center' }) => {
			listThreadRef.current?.scrollIntoThread(threadId, options);
		},
		channelId: channel?.id,
		channelRef: channelLinkRef.current
	}));

	return (
		<ChannelLinkContent
			channel={channel}
			listThreadRef={listThreadRef}
			channelLinkRef={channelLinkRef}
			isActive={isActive}
			permissions={permissions}
		/>
	);
});

export default memo(ChannelListItem);

type ChannelLinkContentProps = {
	channel: ChannelThreads;
	listThreadRef: Ref<ListThreadChannelRef>;
	channelLinkRef: Ref<ChannelLinkRef>;
	isActive: boolean;
	permissions: IChannelLinkPermission;
};

const ChannelLinkContent: React.FC<ChannelLinkContentProps> = ({ channel, listThreadRef, channelLinkRef, isActive, permissions }) => {
	const dispatch = useDispatch();
	const isUnreadChannel = useSelector((state) => selectIsUnreadChannelById(state, channel.id));
	const voiceChannelMembers = useSelector(selectVoiceChannelMembersByChannelId(channel.id));
	const streamChannelMembers = useSelector(selectStreamMembersByChannelId(channel.id));

	const channelMemberList = useMemo(() => {
		if (channel.type === ChannelType.CHANNEL_TYPE_VOICE) return voiceChannelMembers;
		if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) return streamChannelMembers;
		return [];
	}, [channel.type, voiceChannelMembers, streamChannelMembers]);

	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, channel.category_id as string));
	const unreadMessageCount = channel?.count_mess_unread || 0;

	const handleOpenInvite = () => {
		dispatch(clansActions.toggleInvitePeople({ status: true, channelId: channel.id }));
	};

	const renderChannelLink = () => {
		return (
			<ChannelLink
				ref={channelLinkRef}
				clanId={channel?.clan_id}
				channel={channel}
				key={channel.id}
				createInviteLink={handleOpenInvite}
				isPrivate={channel.channel_private}
				isUnReadChannel={isUnreadChannel}
				numberNotification={unreadMessageCount}
				channelType={channel?.type}
				isActive={isActive}
				permissions={permissions}
			/>
		);
	};

	const [isExpandedPttMems, setIsExpendedPttMems] = useState(true);

	const togglePttMembers = () => {
		setIsExpendedPttMems(!isExpandedPttMems);
	};

	const renderChannelContent = useMemo(() => {
		if (
			channel.type !== ChannelType.CHANNEL_TYPE_VOICE &&
			channel.type !== ChannelType.CHANNEL_TYPE_STREAMING &&
			channel.type !== ChannelType.CHANNEL_TYPE_APP
		) {
			return (
				<>
					{renderChannelLink()}
					{channel.threads && <ThreadListChannel ref={listThreadRef} threads={channel.threads} isCollapsed={!isCategoryExpanded} />}
					{channelMemberList?.length > 0 && (
						<div className="flex gap-1 px-4">
							<div className="flex gap-1 h-fit">
								<Icons.InPttCall className="w-5 dark:text-channelTextLabel text-colorTextLightMode" />
								<Icons.RightFilledTriangle
									onClick={togglePttMembers}
									className={`w-3 dark:text-channelTextLabel dark:hover:text-white text-colorTextLightMode hover:text-black duration-200 ${isExpandedPttMems ? 'rotate-90' : ''}`}
								/>
							</div>
							<div className="flex-1">
								{isExpandedPttMems ? (
									<UserListVoiceChannel
										isPttList
										channelID={channel.channel_id ?? ''}
										channelType={channel?.type}
										memberList={channelMemberList}
									/>
								) : (
									<CollapsedMemberList isPttList channelMemberList={channelMemberList} />
								)}
							</div>
						</div>
					)}
				</>
			);
		}

		if (isCategoryExpanded) {
			return (
				<>
					{renderChannelLink()}
					<UserListVoiceChannel channelID={channel.channel_id ?? ''} channelType={channel?.type} memberList={channelMemberList} />
				</>
			);
		}

		return channelMemberList.length > 0 ? (
			<>
				{renderChannelLink()}
				<CollapsedMemberList channelMemberList={channelMemberList} />
			</>
		) : null;
	}, [channel.type, channel.threads, channel.channel_id, isCategoryExpanded, channelMemberList, renderChannelLink, listThreadRef]);

	return <>{renderChannelContent} </>;
};

interface ICollapsedMemberListProps {
	channelMemberList: VoiceEntity[] | UsersStreamEntity[] | ISFUUsersEntity[];
	isPttList?: boolean;
}

const CollapsedMemberList = ({ channelMemberList, isPttList }: ICollapsedMemberListProps) => {
	return (
		<Avatar.Group className={`flex gap-3 justify-start items-center ${isPttList ? 'pr-6' : 'px-6'}`}>
			{[...channelMemberList].slice(0, 5).map((member, index) => (
				<AvatarUserShort id={member.user_id || ''} key={(member.user_id || '') + index} />
			))}
			{channelMemberList && channelMemberList.length > 5 && (
				<Avatar.Counter
					total={channelMemberList?.length - 5 > 50 ? 50 : channelMemberList?.length - 5}
					className="h-6 w-6 dark:text-bgLightPrimary text-bgPrimary ring-transparent dark:bg-bgTertiary bg-bgLightTertiary dark:hover:bg-bgTertiary hover:bg-bgLightTertiary"
				/>
			)}
		</Avatar.Group>
	);
};
