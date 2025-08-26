import {
	directActions,
	DirectEntity,
	directMetaActions,
	selectBuzzStateByDirectId,
	selectDirectById,
	selectDirectMemberMetaUserId,
	selectIsUnreadDMById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelMembersEntity, EUserStatus, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useMemo, useRef } from 'react';
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

	const user = useAppSelector((state) => selectDirectMemberMetaUserId(state, directMessage.user_id?.at(0) || ''));

	const metadata = useMemo(() => {
		if (typeof user?.user?.metadata === 'string') {
			try {
				return safeJSONParse(user?.user?.metadata || '');
			} catch (error) {
				console.error('Error parsing JSON:', user?.user?.metadata, error);
			}
		} else if (typeof user?.user?.metadata === 'object') {
			return {
				status: user?.user?.metadata?.status,
				user_status: user?.user?.online ? user?.user?.metadata?.user_status || EUserStatus.ONLINE : EUserStatus.INVISIBLE
			};
		}
	}, [user?.user?.metadata?.user_status]);
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
			navigateToFriends();
		}
	};

	const ref = useRef<HTMLDivElement>(null);
	const { showContextMenu } = useDirectMessageContextMenu();
	const handleContextMenu = (event: React.MouseEvent) => {
		showContextMenu(event, directMessage as ChannelMembersEntity);
	};
	return (
		<div
			onContextMenu={handleContextMenu}
			ref={ref}
			style={{ height: 42 }}
			className={`flex items-center group/itemListDm relative cursor-pointer bg-item-hover h-fit px-2 rounded-[6px] w-full ${isActive ? 'bg-item-theme text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={() => {
				joinToChatAndNavigate(id, directMessage?.type as number);
			}}
		>
			<DmItemProfile
				avatar={isTypeDMGroup ? directMessage?.topic || 'assets/images/avatar-group.png' : (directMessage?.channel_avatar?.at(0) ?? '')}
				name={directMessage?.channel_label || ''}
				number={(directMessage?.user_id?.length || 0) + 1}
				isTypeDMGroup={isTypeDMGroup}
				highlight={isUnReadChannel || currentDmGroupId === id}
				userMeta={metadata}
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
	userMeta,
	direct
}: {
	highlight: boolean;
	avatar: string;
	name: string;
	number: number;
	isTypeDMGroup: boolean;
	userMeta?: any;
	direct: DirectEntity;
}) => {
	return (
		<div
			className={`relative flex gap-2 items-center text-theme-primary-hover  ${highlight ? 'text-theme-primary-active' : 'text-theme-primary'}`}
		>
			<AvatarImage
				alt={name}
				username={name}
				className="min-w-8 min-h-8 max-w-8 max-h-8"
				classNameText="font-semibold"
				srcImgProxy={avatar || ''}
				src={avatar}
			/>
			{!isTypeDMGroup && (
				<div className="rounded-full left-7 absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
					<UserStatusIconClan
						channelId={direct.id}
						userId={direct.user_id?.[0] || ''}
						status={userMeta?.user_status}
						online={userMeta?.user_status !== EUserStatus.INVISIBLE}
					/>
				</div>
			)}

			<div className="flex flex-col justify-center ">
				<span className="one-line text-start">{name}</span>
				{isTypeDMGroup && <p className="opacity-60 text-xs text-start">{number} Members</p>}
			</div>
		</div>
	);
};
