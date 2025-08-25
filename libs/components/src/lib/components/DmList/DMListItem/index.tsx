import {
	directActions,
	directMetaActions,
	selectBuzzStateByDirectId,
	selectDirectById,
	selectDirectMemberMetaUserId,
	selectIsUnreadDMById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelMembersEntity, generateE2eId, MemberProfileType } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import BuzzBadge from '../../BuzzBadge';
import LeaveGroupModal from '../../LeaveGroupModal';
import { MemberProfile } from '../../MemberProfile';
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
			return user?.user?.metadata;
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
	return (
		<div
			ref={ref}
			style={{ height: 42 }}
			className={`flex items-center group/itemListDm relative cursor-pointer bg-item-hover h-fit px-2 rounded-[6px] w-full ${isActive ? 'bg-item-theme text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={() => {
				joinToChatAndNavigate(id, directMessage?.type as number);
			}}
		>
			<MemberProfile
				avatar={isTypeDMGroup ? 'assets/images/avatar-group.png' : (directMessage?.channel_avatar?.at(0) ?? '')}
				name={directMessage?.channel_label ?? ''}
				usernameAva={directMessage?.channel_label ?? 'Deleted Account'}
				status={{ status: directMessage.is_online?.some(Boolean), isMobile: false }}
				isHideStatus={true}
				isHideIconStatus={false}
				key={directMessage.channel_id}
				isUnReadDirect={isUnReadChannel}
				isHideAnimation={true}
				positionType={MemberProfileType.DM_LIST}
				countMember={(directMessage?.user_id?.length || 0) + 1}
				user={directMessage as ChannelMembersEntity}
				isMute={directMessage?.is_mute}
				isDM
				metaDataDM={metadata}
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
				data-e2e={generateE2eId(`chat.direct-message.chat-item.close-DM-button`)}
			>
				&times;
			</button>
		</div>
	);
}

export default memo(DMListItem, (prev, cur) => {
	return prev.id === cur.id && prev.isActive === cur.isActive;
});
