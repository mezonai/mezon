import { useMemberStatus } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import {
	directActions,
	directMetaActions,
	getStore,
	selectBuzzStateByDirectId,
	selectDirectById,
	selectIsUnreadDMById,
	selectLatestMessageId,
	selectStatusInVoice,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ChannelMembersEntity, EUserStatus } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
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
	const { t } = useTranslation('common');
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
		const store = getStore();
		const messageId = store ? selectLatestMessageId(store.getState(), directId) : undefined;
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp, messageId }));
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
	}, [directMessage, id, currentDmGroupId]);

	return (
		<div
			onContextMenu={handleContextMenu}
			ref={ref}
			className={`flex items-center group/itemListDm relative cursor-pointer bg-item-hover h-[42px] px-2 rounded-[6px] w-full ${isActive ? 'bg-item-theme text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={handleClickDM}
			data-e2e={generateE2eId(`chat.direct_message.chat_list`)}
		>
			<DmItemProfile
				avatar={isTypeDMGroup ? directMessage?.channel_avatar || 'assets/images/avatar-group.png' : (directMessage?.avatars?.at(-1) ?? '')}
				name={directMessage?.channel_label || ''}
				number={directMessage?.member_count || 0}
				isTypeDMGroup={isTypeDMGroup}
				highlight={isUnReadChannel || currentDmGroupId === id}
				direct={directMessage}
				t={t}
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
	direct,
	t
}: {
	highlight: boolean;
	avatar: string;
	name: string;
	number: number;
	isTypeDMGroup: boolean;
	direct: DirectEntity;
	t: (key: string) => string;
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

			{isTypeDMGroup ? (
				<div className="flex flex-col justify-center ">
					<span className="one-line text-start" data-e2e={generateE2eId(`chat.direct_message.chat_item.username`)}>
						{name}
					</span>
					<p className="opacity-60 text-theme-primary text-xs text-start">
						{number} {t('members')}
					</p>
				</div>
			) : (
				<DmInvoiceProfile name={name} directId={direct.id} userId={direct.user_ids?.[0] || ''} status={userStatus.status} />
			)}
		</div>
	);
};

const DmInvoiceProfile = memo(({ userId, directId, status, name }: { userId: string; directId: string; status: EUserStatus; name: string }) => {
	const { t } = useTranslation('memberPage');
	const checkUserInvoice = useSelector((state) => selectStatusInVoice(state, userId));
	return (
		<>
			<div
				className={`rounded-full absolute left-5 -bottom-[3px] p-[3px] inline-flex items-center justify-center gap-1 text-sm text-theme-primary`}
			>
				<UserStatusIconClan channelId={directId} userId={userId} status={status} />
			</div>

			<div className="flex flex-col justify-center">
				<span className="one-line text-start leading-4" data-e2e={generateE2eId(`chat.direct_message.chat_item.username`)}>
					{name}
				</span>
				{!!checkUserInvoice && (
					<p className="opacity-60 text-theme-primary text-xs text-start flex gap-[2px] items-center">
						<Icons.Speaker className="text-green-500 !w-[10px] !h-[10px]" /> {t('inVoice')}
					</p>
				)}
			</div>
		</>
	);
});
