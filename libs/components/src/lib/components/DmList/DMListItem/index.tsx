import { useMemberStatus } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import {
	directActions,
	directMetaActions,
	fetchUserChannels,
	getStoreAsync,
	selectBuzzStateByDirectId,
	selectDirectById,
	selectIsUnreadDMById,
	selectMemberByGroupId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ChannelMembersEntity } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useDirectMessageContextMenu } from '../../../contexts';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import BuzzBadge from '../../BuzzBadge';
import LeaveGroupModal from '../../LeaveGroupModal';
import { UserStatusIconClan } from '../../MemberProfile';
export type DirectMessProp = {
	id: string;
	currentDmGroupId: string;
	joinToChatAndNavigate: (DMid: string, type: number) => void;
	navigateToFriends: () => void;
	isActive: boolean;
};

export type directMessageValueProps = {
	type?: number;
	userId: string[];
	dmID: string;
	e2ee?: number;
};

function DMListItem({ id, currentDmGroupId, joinToChatAndNavigate, navigateToFriends, isActive }: DirectMessProp) {
	const dispatch = useAppDispatch();
	const directMessage = useAppSelector((state) => selectDirectById(state, id));
	const isTypeDMGroup = Number(directMessage.type) === ChannelType.CHANNEL_TYPE_GROUP;
	const isUnReadChannel = useAppSelector((state) => selectIsUnreadDMById(state, directMessage?.id as string));
	const buzzStateDM = useAppSelector((state) => selectBuzzStateByDirectId(state, directMessage?.channel_id ?? ''));

	const [openUnknown, closeUnknown] = useModal(() => {
		if (isTypeDMGroup) {
			return <LeaveGroupModal navigateToFriends={navigateToFriends} groupWillBeLeave={directMessage} onClose={closeUnknown} />;
		}
	}, [directMessage]);

	const handleCloseClick = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			if (isTypeDMGroup) {
				openUnknown();
			} else {
				handleLeave(e, directMessage.channel_id as string, currentDmGroupId);
			}
		},
		[isTypeDMGroup, directMessage.channel_id, currentDmGroupId]
	);

	const handleLeave = async (e: React.MouseEvent, directId: string, currentDmGroupId: string) => {
		e.stopPropagation();
		await dispatch(directActions.closeDirectMessage({ channel_id: directId }));
		const timestamp = Date.now() / 1000;
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp }));
		if (directId === currentDmGroupId) {
			dispatch(directActions.setDmGroupCurrentId(''));
			navigateToFriends();
		}
	};

	const ref = useRef<HTMLDivElement>(null);
	const { showContextMenu } = useDirectMessageContextMenu();
	const handleContextMenu = (event: React.MouseEvent) => {
		if (directMessage.channel_id) {
			showContextMenu(event, directMessage.channel_id, directMessage as ChannelMembersEntity);
		}
	};

	const handleClickDM = useCallback(async () => {
		joinToChatAndNavigate(id, directMessage?.type as number);

		const state = (await getStoreAsync()).getState();
		const memberDM = selectMemberByGroupId(state, id);
		if (!memberDM && directMessage?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			dispatch(
				fetchUserChannels({
					channelId: id,
					isGroup: true
				})
			);
		}
	}, [directMessage, id, currentDmGroupId]);

	return (
		<div
			onContextMenu={handleContextMenu}
			ref={ref}
			style={{ height: 42 }}
			className={`flex items-center group/itemListDm relative cursor-pointer bg-item-hover h-fit px-2 rounded-[6px] w-full ${isActive ? 'bg-item-theme text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={handleClickDM}
		>
			<DmItemProfile
				avatar={isTypeDMGroup ? directMessage?.channel_avatar || 'assets/images/avatar-group.png' : (directMessage?.avatars?.at(0) ?? '')}
				name={directMessage?.channel_label || ''}
				number={directMessage?.member_count || 0}
				isTypeDMGroup={isTypeDMGroup}
				highlight={isUnReadChannel || currentDmGroupId === id}
				direct={directMessage}
			/>
			{buzzStateDM?.isReset ? (
				<BuzzBadge
					timestamp={buzzStateDM?.timestamp as number}
					isReset={buzzStateDM?.isReset}
					channelId={directMessage.channel_id as string}
					senderId={buzzStateDM.senderId as string}
					mode={directMessage.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP}
				/>
			) : null}
			<button
				className={`group-hover/itemListDm:opacity-100 opacity-0 absolute right-2 text-gray-500 text-2xl hover:text-red-500 top-[6px]`}
				onClick={(e) => handleCloseClick(e)}
				data-e2e={generateE2eId(`chat.direct_message.chat_item.close_dm_button`)}
			>
				&times;
			</button>
		</div>
	);
}

export default memo(DMListItem, (prev, cur) => {
	return prev.id === cur.id && prev.isActive === cur.isActive;
});

const DmItemProfile = ({
	avatar,
	name,
	number,
	isTypeDMGroup,
	highlight,
	direct
}: {
	highlight: boolean;
	avatar: string;
	name: string;
	number: number;
	isTypeDMGroup: boolean;
	direct: DirectEntity;
}) => {
	const userStatus = useMemberStatus(direct.user_ids?.[0] || '');
	return (
		<div
			className={`relative flex gap-2 items-center text-theme-primary-hover  ${highlight ? 'text-theme-primary-active' : 'text-theme-primary'}`}
		>
			<AvatarImage
				alt={name}
				username={name}
				className="min-w-8 min-h-8 max-w-8 max-h-8"
				classNameText="font-semibold"
				srcImgProxy={createImgproxyUrl(avatar ?? '')}
				src={avatar}
			/>
			{!isTypeDMGroup && (
				<div className="rounded-full absolute left-5 -bottom-[3px] inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
					<UserStatusIconClan channelId={direct.id} userId={direct.user_ids?.[0] || ''} status={userStatus.status} />
				</div>
			)}

			<div className="flex flex-col justify-center ">
				<span className="one-line text-start" data-e2e={generateE2eId(`chat.direct_message.chat_item.username`)}>
					{name}
				</span>
				{isTypeDMGroup && <p className="opacity-60 text-xs text-start">{number} Members</p>}
			</div>
		</div>
	);
};
