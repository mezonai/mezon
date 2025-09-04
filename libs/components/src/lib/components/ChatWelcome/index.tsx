import { useAppParams, useFriends } from '@mezon/core';
import {
	ChannelsEntity,
	EStateFriend,
	RootState,
	directActions,
	selectAllAccount,
	selectCurrentChannel,
	selectDirectById,
	selectFriendById,
	selectIsShowCreateThread,
	selectMemberClanByUserId,
	selectThreadCurrentChannel,
	selectUpdateDmGroupError,
	selectUpdateDmGroupLoading,
	selectUserIdCurrentDm,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useEditGroupModal } from '../../hooks/useEditGroupModal';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import ModalEditGroup from '../ModalEditGroup';

export type ChatWelComeProp = {
	readonly name?: Readonly<string>;
	readonly avatarDM?: Readonly<string>;
	readonly isPrivate?: Readonly<number>;

	username?: string;

	mode: number;
};

function ChatWelCome({ name, username, avatarDM, mode, isPrivate }: ChatWelComeProp) {
	const { directId } = useAppParams();
	const dispatch = useAppDispatch();
	const directChannel = useAppSelector((state) => selectDirectById(state, directId));
	const currentChannel = useSelector(selectCurrentChannel);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const updateDmGroupLoading = useAppSelector((state) => selectUpdateDmGroupLoading(directChannel?.channel_id || '')(state));
	const updateDmGroupError = useAppSelector((state) => selectUpdateDmGroupError(directChannel?.channel_id || '')(state));
	const editGroupModal = useEditGroupModal({
		channelId: directChannel?.channel_id,
		currentGroupName: name || directChannel?.channel_label || 'Group',
		currentAvatar: directChannel?.topic || ''
	});
	useEffect(() => {
		if (directId) {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}
	}, [directId, dispatch]);

	const handleOpenEditModal = useCallback(() => {
		editGroupModal.openEditModal();
	}, [editGroupModal]);

	const selectedChannel =
		mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP
			? directChannel
			: mode === ChannelStreamMode.STREAM_MODE_THREAD
				? threadCurrentChannel || currentChannel
				: currentChannel;

	const user = useSelector(selectMemberClanByUserId(selectedChannel?.creator_id as string));
	const preferredUserName = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';
	const classNameSubtext = 'text-theme-primary opacity-60 text-sm';
	const showName = <span className="font-medium">{name || username}</span>;

	const isChannel = mode === ChannelStreamMode.STREAM_MODE_CHANNEL;
	const isThread = mode === ChannelStreamMode.STREAM_MODE_THREAD;
	const isDm = mode === ChannelStreamMode.STREAM_MODE_DM;
	const isDmGroup = mode === ChannelStreamMode.STREAM_MODE_GROUP;
	const isChatStream = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;

	return (
		<div className="flex flex-col gap-3">
			<div className="space-y-2 px-4 mb-0  flex-1 flex flex-col justify-end">
				{
					<>
						{isChannel && (
							<WelComeChannel
								name={currentChannel?.channel_label}
								classNameSubtext={classNameSubtext}
								showName={showName}
								channelPrivate={Boolean(selectedChannel?.channel_private)}
								isChatStream={isChatStream}
							/>
						)}
						{isThread && (
							<WelcomeChannelThread
								currentThread={currentChannel}
								name={name}
								classNameSubtext={classNameSubtext}
								username={preferredUserName}
								isPrivate={isPrivate}
							/>
						)}
						{(isDm || isDmGroup) && (
							<WelComeDm
								name={isDmGroup ? name || `${selectedChannel?.creator_name}'s Groups` : name || username}
								username={username}
								avatar={isDmGroup ? directChannel?.topic : avatarDM}
								classNameSubtext={classNameSubtext}
								showName={showName}
								isDmGroup={isDmGroup}
								onEditGroup={isDmGroup ? handleOpenEditModal : undefined}
							/>
						)}
					</>
				}
			</div>

			<ModalEditGroup
				isOpen={editGroupModal.isEditModalOpen}
				onClose={editGroupModal.closeEditModal}
				onSave={editGroupModal.handleSave}
				onImageUpload={editGroupModal.handleImageUpload}
				groupName={editGroupModal.groupName}
				onGroupNameChange={editGroupModal.setGroupName}
				imagePreview={editGroupModal.imagePreview}
				className="z-[200]"
				isLoading={updateDmGroupLoading}
				error={updateDmGroupError}
			/>
		</div>
	);
}

export default ChatWelCome;

type WelComeChannelProps = {
	name?: string;
	classNameSubtext: string;
	showName: JSX.Element;
	channelPrivate: boolean;
	isChatStream?: boolean;
};

const WelComeChannel = (props: WelComeChannelProps) => {
	const { name = '', classNameSubtext, showName, channelPrivate, isChatStream } = props;
	return (
		<>
			<div
				className={`h-[75px] w-[75px] rounded-full text-theme-primary-active  flex items-center justify-center ${!isChatStream ? 'bg-theme-primary' : ''}`}
			>
				{isChatStream ? <Icons.Chat defaultSize="w-10 h-10 " /> : <Icons.Hashtag defaultSize="w-10 h-10" />}
			</div>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary-active" style={{ wordBreak: 'break-word' }}>
					Welcome to #{name}
				</p>
			</div>
			<p className={classNameSubtext}>
				This is the start of the #{showName} {channelPrivate ? 'private' : ''} channel
			</p>
		</>
	);
};

type WelcomeChannelThreadProps = {
	name?: string;
	classNameSubtext: string;
	username?: string;
	currentThread: ChannelsEntity | null;
	isPrivate?: number;
};

const WelcomeChannelThread = (props: WelcomeChannelThreadProps) => {
	const { name = '', classNameSubtext, username = '', currentThread, isPrivate } = props;
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentThread?.id as string));
	return (
		<>
			<div className="h-[75px] w-[75px] rounded-full bg-item-theme text-theme-primary flex items-center justify-center ">
				{isPrivate === ChannelStatusEnum.isPrivate ? (
					<Icons.ThreadIconLocker className="w-10 h-10" />
				) : (
					<Icons.ThreadIcon defaultSize="w-10 h-10" />
				)}
			</div>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary-active" style={{ wordBreak: 'break-word' }}>
					{isShowCreateThread ? name : currentThread?.channel_label}
				</p>
			</div>
			<p className={classNameSubtext}>
				Started by <span className="text font-medium">{username}</span>
			</p>
		</>
	);
};

type WelComeDmProps = {
	name?: string;
	username?: string;

	avatar?: string;
	classNameSubtext: string;
	showName: JSX.Element;
	isDmGroup: boolean;
	onEditGroup?: () => void;
};

const WelComeDm = (props: WelComeDmProps) => {
	const { name = '', username = '', avatar = '', classNameSubtext, showName, isDmGroup, onEditGroup } = props;

	const userID = useSelector(selectUserIdCurrentDm);
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, userID?.[0] || ''));
	const checkAddFriend = useMemo(() => {
		return infoFriend?.state;
	}, [infoFriend]);

	return (
		<>
			<AvatarImage
				height={'75px'}
				alt={username}
				username={username}
				className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
				srcImgProxy={avatar || ''}
				src={avatar}
				classNameText="!text-4xl font-semibold"
			/>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary-active" style={{ wordBreak: 'break-word' }}>
					{name}
				</p>
			</div>
			{!isDmGroup && <p className="font-medium text-2xl text-theme-primary">{username}</p>}
			<div className="text-base">
				<p className={classNameSubtext}>
					{isDmGroup ? (
						<>Welcome to the beginning of the {showName} group.</>
					) : (
						<>This is the beginning of your direct message history with {showName}</>
					)}
				</p>
			</div>
			{isDmGroup && onEditGroup && (
				<button
					onClick={onEditGroup}
					className="inline-flex items-center gap-2 px-3 py-2 mt-2 bg-item-theme  text-theme-primary text-sm font-medium rounded-md transition-all duration-150 hover:shadow-lg hover:scale-[1.02] group w-fit"
					title="Edit Group"
					data-e2e={generateE2eId(`chat.direct_message.edit_group.button`)}
				>
					<svg
						className="w-4 h-4 transition-transform group-hover:scale-110 "
						viewBox="0 0 16 16"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M8.29289 3.70711L1 11V15H5L12.2929 7.70711L8.29289 3.70711Z" />
						<path d="M9.70711 2.29289L13.7071 6.29289L15.1716 4.82843C15.702 4.29799 16 3.57857 16 2.82843C16 1.26633 14.7337 0 13.1716 0C12.4214 0 11.702 0.297995 11.1716 0.828428L9.70711 2.29289Z" />
					</svg>
					Edit Group
				</button>
			)}
			{!isDmGroup && <StatusFriend username={username} checkAddFriend={checkAddFriend} userID={userID[0]} />}
		</>
	);
};

type StatusFriendProps = {
	username?: string;

	checkAddFriend?: number;
	userID: string;
};

const StatusFriend = memo((props: StatusFriendProps) => {
	const { username = '', checkAddFriend, userID } = props;
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, userID));
	const userProfile = useSelector(selectAllAccount);

	const isFriend = useMemo(() => {
		return infoFriend?.state === EStateFriend.FRIEND;
	}, [infoFriend]);
	const isBlockedByUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === userID && infoFriend?.user?.id === userProfile?.user?.id;
	}, [userProfile?.user?.id, infoFriend, userID]);
	const didIBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === userProfile?.user?.id && infoFriend?.user?.id === userID;
	}, [userProfile?.user?.id, infoFriend, userID]);
	const { acceptFriend, deleteFriend, addFriend, blockFriend, unBlockFriend } = useFriends();

	const title = useMemo(() => {
		switch (checkAddFriend) {
			case EStateFriend.BLOCK:
				return [];
			case EStateFriend.MY_PENDING:
				return ['Accept', 'Ignore'];
			case EStateFriend.OTHER_PENDING:
				return ['Friend Request Sent'];
			case EStateFriend.FRIEND:
				return ['Remove Friend'];
			default:
				return ['Add Friend'];
		}
	}, [checkAddFriend]);

	const handleOnClickButtonFriend = (index: number) => {
		switch (checkAddFriend) {
			case EStateFriend.MY_PENDING:
				if (index === 0) {
					acceptFriend(username, userID);
					break;
				}
				deleteFriend(username, userID);
				break;
			case EStateFriend.OTHER_PENDING:
				// return "Friend Request Sent"
				break;
			case EStateFriend.FRIEND:
				deleteFriend(username, userID);
				break;
			default:
				addFriend({
					ids: [userID],
					usernames: [username]
				});
		}
	};

	const handleBlockFriend = async () => {
		try {
			const isBlocked = await blockFriend(username, userID);
			if (isBlocked) {
				toast.success('User blocked successfully');
			}
		} catch (error) {
			toast.error('Failed to block user');
		}
	};

	const handleUnblockFriend = async () => {
		try {
			const isUnblocked = await unBlockFriend(username, userID);
			if (isUnblocked) {
				toast.success('User unblocked successfully');
			}
		} catch (error) {
			toast.error('Failed to unblock user');
		}
	};

	if (isBlockedByUser) {
		return null;
	}

	return (
		<div className="flex gap-x-2 items-center text-sm">
			{checkAddFriend === EStateFriend.MY_PENDING && (
				<p className="dark:text-contentTertiary text-colorTextLightMode">Sent you a friend request:</p>
			)}
			{title.map((button, index) => (
				<button
					className={`rounded-lg   border border-theme-primary px-4 py-0.5 font-medium  ${checkAddFriend === EStateFriend.OTHER_PENDING ? 'cursor-not-allowed' : ''} ${checkAddFriend === EStateFriend.FRIEND ? 'bg-button-secondary text-theme-primary text-theme-primary-hover' : 'btn-primary btn-primary-hover'}`}
					onClick={() => handleOnClickButtonFriend(index)}
					key={button}
				>
					{button}
				</button>
			))}

			{(isFriend || didIBlockUser) && (
				<button
					onClick={didIBlockUser ? handleUnblockFriend : handleBlockFriend}
					className="rounded-lg text-theme-primary-hover border border-theme-primary bg-button-secondary px-4 py-0.5 font-medium text-theme-primary"
				>
					{didIBlockUser ? 'Unblock' : 'Block'}
				</button>
			)}
		</div>
	);
});
