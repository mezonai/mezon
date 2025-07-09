import { useAppParams, useFriends } from '@mezon/core';
import {
	ChannelsEntity,
	EStateFriend,
	selectCurrentChannel,
	selectDirectById,
	selectFriendStatus,
	selectIsShowCreateThread,
	selectMemberClanByUserId,
	selectThreadCurrentChannel,
	selectUserIdCurrentDm,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';

export type ChatWelComeProp = {
	readonly name?: Readonly<string>;
	readonly avatarDM?: Readonly<string>;
	readonly isPrivate?: Readonly<number>;

	username?: string;

	mode: number;
};

function ChatWelCome({ name, username, avatarDM, mode, isPrivate }: ChatWelComeProp) {
	const { directId } = useAppParams();
	const directChannel = useAppSelector((state) => selectDirectById(state, directId));
	const currentChannel = useSelector(selectCurrentChannel);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
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
								avatar={avatarDM}
								classNameSubtext={classNameSubtext}
								showName={showName}
								isDmGroup={isDmGroup}
							/>
						)}
					</>
				}
			</div>
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
				className={`h-[75px] w-[75px] rounded-full text-theme-primary  flex items-center justify-center ${!isChatStream ? 'bg-theme-primary' : ''}`}
			>
				{isChatStream ? <Icons.Chat defaultSize="w-10 h-10 " /> : <Icons.Hashtag defaultSize="w-10 h-10" />}
			</div>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary" style={{ wordBreak: 'break-word' }}>
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
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary" style={{ wordBreak: 'break-word' }}>
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
};

const WelComeDm = (props: WelComeDmProps) => {
	const { name = '', username = '', avatar = '', classNameSubtext, showName, isDmGroup } = props;

	const userID = useSelector(selectUserIdCurrentDm);
	const checkAddFriend = useSelector(selectFriendStatus(userID[0] || ''));

	return (
		<>
			<AvatarImage
				height={'75px'}
				alt={username}
				username={username}
				className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
				srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
				src={avatar}
				classNameText="!text-4xl font-semibold"
			/>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 text-theme-primary" style={{ wordBreak: 'break-word' }}>
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
	const { acceptFriend, deleteFriend, addFriend } = useFriends();

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

	return (
		<div className="flex gap-x-2 items-center text-sm">
			{checkAddFriend === EStateFriend.MY_PENDING && (
				<p className="dark:text-contentTertiary text-colorTextLightMode">Sent you a friend request:</p>
			)}
			{title.map((button, index) => (
				<button
					className={`rounded-lg   border border-theme-primary px-4 py-0.5 font-medium  ${checkAddFriend === EStateFriend.OTHER_PENDING ? 'cursor-not-allowed' : ''} ${checkAddFriend === EStateFriend.FRIEND ? 'bg-button-secondary text-theme-primary text-theme-primary-hover' : 'bg-button-add-friend text-white'}`}
					onClick={() => handleOnClickButtonFriend(index)}
					key={button}
				>
					{button}
				</button>
			))}

			{/* {(isFriend || didIBlockUser) && (
				<button
					onClick={didIBlockUser ? handleUnblockFriend : handleBlockFriend}
					className="rounded-lg text-theme-primary-hover border border-theme-primary bg-button-secondary px-4 py-0.5 font-medium text-theme-primary"
				>
					{didIBlockUser ? 'Unblock' : 'Block'}
				</button>
			)} */}
		</div>
	);
});
