import { useAppParams, useFriends } from '@mezon/core';
import {
	EStateFriend,
	selectCurrentChannel,
	selectDirectById,
	selectFriendStatus,
	selectMemberClanByUserId,
	selectUserIdCurrentDm,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelIsNotThread, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';

export type ChatWelComeProp = {
	readonly name?: Readonly<string>;
	readonly avatarDM?: Readonly<string>;
	userName?: string;
	mode: number;
};

function ChatWelCome({ name, userName, avatarDM, mode }: ChatWelComeProp) {
	const { directId } = useAppParams();
	const directChannel = useAppSelector((state) => selectDirectById(state, directId));
	const currentChannel = useSelector(selectCurrentChannel);
	const selectedChannel = directId ? directChannel : currentChannel;
	const user = useSelector(selectMemberClanByUserId(selectedChannel?.creator_id as string));
	const classNameSubtext = 'dark:text-zinc-400 text-colorTextLightMode text-sm';
	const showName = <span className="font-medium">{name || userName}</span>;

	const isChannel = mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD;
	const isChannelThread = selectedChannel?.parrent_id !== ChannelIsNotThread.TRUE;
	const isDm = mode === ChannelStreamMode.STREAM_MODE_DM;
	const isDmGroup = mode === ChannelStreamMode.STREAM_MODE_GROUP;
	const isChatStream = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	return (
		<div className="flex flex-col gap-3">
			<div className="space-y-2 px-4 mb-0  flex-1 flex flex-col justify-end">
				{
					<>
						{isChannel &&
							(isChannelThread ? (
								<WelcomeChannelThread name={name} classNameSubtext={classNameSubtext} userName={user?.user?.username} />
							) : (
								<WelComeChannel
									name={name}
									classNameSubtext={classNameSubtext}
									showName={showName}
									channelPrivate={Boolean(selectedChannel?.channel_private)}
									isChatStream={isChatStream}
								/>
							))}
						{(isDm || isDmGroup) && (
							<WelComeDm
								name={name || `${selectedChannel?.creator_name}'s Groups`}
								userName={userName}
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
				className={`h-[75px] w-[75px] rounded-full dark:bg-zinc-700 flex items-center justify-center ${!isChatStream ? 'bg-bgLightModeButton pl-2' : 'bg-gray-500'}`}
			>
				{isChatStream ? (
					<Icons.Chat defaultFill="#ffffff" defaultSize="w-10 h-10 " />
				) : (
					<Icons.Hashtag defaultFill="#ffffff" defaultSize="w-10 h-10 mb-2" />
				)}
			</div>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 dark:text-white text-black" style={{ wordBreak: 'break-word' }}>
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
	userName?: string;
};

const WelcomeChannelThread = (props: WelcomeChannelThreadProps) => {
	const { name = '', classNameSubtext, userName = '' } = props;
	return (
		<>
			<div className="h-[75px] w-[75px] rounded-full bg-bgLightModeButton dark:bg-zinc-700 flex items-center justify-center pl-2">
				<Icons.ThreadIcon defaultFill="#ffffff" defaultSize="w-10 h-10" />
			</div>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 dark:text-white text-black" style={{ wordBreak: 'break-word' }}>
					{name}
				</p>
			</div>
			<p className={classNameSubtext}>
				Started by <span className="dark:text-white text-black font-medium">{userName}</span>
			</p>
		</>
	);
};

type WelComeDmProps = {
	name?: string;
	userName?: string;
	avatar?: string;
	classNameSubtext: string;
	showName: JSX.Element;
	isDmGroup: boolean;
};

const WelComeDm = (props: WelComeDmProps) => {
	const { name = '', userName = '', avatar = '', classNameSubtext, showName, isDmGroup } = props;
	const userID = useSelector(selectUserIdCurrentDm);
	const checkAddFriend = useSelector(selectFriendStatus(userID[0] || ''));

	return (
		<>
			<AvatarImage
				height={'75px'}
				alt={userName}
				userName={userName}
				className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
				srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
				src={avatar}
				classNameText="!text-4xl font-semibold"
			/>
			<div>
				<p className="text-xl md:text-3xl font-bold pt-1 dark:text-white text-black" style={{ wordBreak: 'break-word' }}>
					{name}
				</p>
			</div>
			{!isDmGroup && <p className="font-medium text-2xl dark:text-textDarkTheme text-textLightTheme">{userName}</p>}
			<div className="text-base">
				<p className={classNameSubtext}>
					{isDmGroup ? (
						<>Welcome to the beginning of the {showName} group.</>
					) : (
						<>This is the beginning of your direct message history with {showName}</>
					)}
				</p>
			</div>
			{!isDmGroup && <StatusFriend userName={userName} checkAddFriend={checkAddFriend} userID={userID[0]} />}
		</>
	);
};

type StatusFriendProps = {
	userName?: string;
	checkAddFriend?: number;
	userID: string;
};

export const StatusFriend = memo((props: StatusFriendProps) => {
	const { userName = '', checkAddFriend, userID } = props;
	const { acceptFriend, deleteFriend, addFriend } = useFriends();

	const title = useMemo(() => {
		switch (checkAddFriend) {
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
					acceptFriend(userName, userID);
					break;
				}
				deleteFriend(userName, userID);
				break;
			case EStateFriend.OTHER_PENDING:
				// return "Friend Request Sent"
				break;
			case EStateFriend.FRIEND:
				deleteFriend(userName, userID);
				break;
			default:
				addFriend({
					ids: [userID],
					usernames: [userName]
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
					className={`rounded  px-4 py-0.5 hover:bg-opacity-85 font-medium text-white ${checkAddFriend === EStateFriend.OTHER_PENDING ? 'cursor-not-allowed' : ''} ${checkAddFriend === EStateFriend.FRIEND ? 'bg-bgModifierHover' : 'bg-bgSelectItem'}`}
					onClick={() => handleOnClickButtonFriend(index)}
					key={button}
				>
					{button}
				</button>
			))}

			<button className="rounded bg-bgModifierHover px-4 py-0.5 hover:bg-opacity-85 font-medium text-white">Block</button>
		</div>
	);
});
