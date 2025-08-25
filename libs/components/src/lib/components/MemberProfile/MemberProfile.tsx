import { ChannelMembersEntity, selectCurrentClan } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus, MemberProfileType, UserStatus, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useMemo, useRef } from 'react';
import { AvatarImage } from '../../components';
import { useDirectMessageContextMenu } from '../../contexts/DirectMessageContextMenu';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import StatusUser, { StatusUser2 } from '../StatusUser';

export type MemberProfileProps = {
	avatar: string;
	name: string;
	status?: { status?: boolean; isMobile?: boolean };
	customStatus?: string;
	isHideStatus?: boolean;
	isHideIconStatus?: boolean;
	numberCharacterCollapse?: number;
	textColor?: string;
	isHideUserName?: boolean;
	classParent?: string;
	user?: ChannelMembersEntity;
	listProfile?: boolean;
	isOffline?: boolean;
	isHideAnimation?: boolean;
	isUnReadDirect?: boolean;
	isMemberGroupDm?: boolean;
	positionType?: MemberProfileType;
	countMember?: number;
	dataMemberCreate?: DataMemberCreate;
	isHiddenAvatarPanel?: boolean;
	usernameAva?: string;
	hideLongName?: boolean;
	isDM?: boolean;
	isMute?: boolean;
	metaDataDM?: any;
	statusOnline?: any;
	onClick?: (event: React.MouseEvent) => void;
};

type BaseMemberProfileProps = MemberProfileProps & {
	currentClan?: ReturnType<typeof selectCurrentClan>;
	onContextMenu?: (event: React.MouseEvent, user?: ChannelMembersEntity) => void;
	onClick?: (event: React.MouseEvent) => void;
};

// The core member profile component with all the UI rendering logic
const MemberProfileCore = ({
	avatar,
	name,
	status,
	customStatus,
	isHideStatus,
	isHideIconStatus,
	isHideUserName,
	classParent = '',
	user,
	listProfile,
	isOffline,
	isHideAnimation,
	isUnReadDirect,
	positionType,
	countMember,
	dataMemberCreate,
	isHiddenAvatarPanel,
	usernameAva,
	hideLongName,
	isDM,
	isMute,
	metaDataDM,
	statusOnline,
	currentClan,
	onClick,
	onContextMenu
}: BaseMemberProfileProps) => {
	const username = name || '';

	const isListFriend = positionType === MemberProfileType.LIST_FRIENDS;
	const isMemberDMGroup = positionType === MemberProfileType.DM_MEMBER_GROUP;
	const isListDm = positionType === MemberProfileType.DM_LIST;
	const isAnonymous = user?.user?.id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID;

	const subNameRef = useRef<HTMLInputElement>(null);
	const minWidthNameMain = subNameRef.current?.offsetWidth;

	const isOwnerClanOrGroup =
		(dataMemberCreate?.createId || currentClan?.creator_id) &&
		(dataMemberCreate ? dataMemberCreate?.createId : currentClan?.creator_id) === user?.user?.id;

	const userStatus: EUserStatus = useMemo(() => {
		if (metaDataDM) {
			return metaDataDM?.user_status;
		}
		if (statusOnline) {
			return statusOnline;
		}
		if (user?.user?.metadata) {
			return user?.user?.metadata;
		}
	}, [metaDataDM, statusOnline, user?.user?.metadata]);

	return (
		<div className={`relative group w-full${isOffline ? ' opacity-60' : ''}`}>
			<div
				onContextMenu={onContextMenu}
				onClick={onClick}
				className={`relative gap-[9px] flex items-center cursor-pointer rounded ${classParent} ${isOffline ? 'opacity-60' : ''} ${listProfile ? '' : 'overflow-hidden'}`}
			>
				<div className="relative inline-flex items-center justify-start w-8 h-8 text-lg text-white rounded-full">
					<AvatarImage
						alt={username}
						username={usernameAva ?? username}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
						isAnonymous={isAnonymous}
					/>
					{!isHideIconStatus && (
						<StatusUser
							isListDm={isListDm}
							isDM={isDM}
							isMemberChannel={false}
							isMemberDMGroup={isMemberDMGroup}
							status={status}
							directMessageValue={{
								type: user?.type,
								userId: user?.user_id as any,
								dmID: user?.id as string
							}}
							userId={user?.user?.id}
							customStatus={userStatus}
						/>
					)}
				</div>
				<div className="flex flex-col items-start h-full w-full">
					{!isHideStatus && (
						<div
							ref={subNameRef}
							className={`absolute top-[22px] mr-5 max-w-full overflow-x-hidden transition-all duration-300 flex flex-col items-start justify-start  ${isHideAnimation ? '' : 'group-hover:-translate-y-4'}`}
						>
							{customStatus && isListFriend ? (
								<span className={`text-[11px] text-left text-theme-primary opacity-60 line-clamp-1 `}>{customStatus}</span>
							) : (
								<span className={`text-[11px] text-theme-primary opacity-60 `}>
									{typeof userStatus === 'string' && userStatus ? userStatus : !status?.status ? 'Offline' : 'Online'}
								</span>
							)}
							<p className="text-[11px] text-theme-primary opacity-60 overflow-x-hidden whitespace-nowrap text-ellipsis text-left w-full">
								{user?.user?.username}
							</p>
						</div>
					)}
					{!isHideUserName && (
						<div className={'h-full flex-col w-full'}>
							<div className="flex flex-row items-center w-full overflow-x-hidden" style={{ minWidth: `${minWidthNameMain}px` }}>
								<p
									className={`text-base font-medium nameMemberProfile
									${!isOwnerClanOrGroup && 'w-full'}
									${isListFriend ? ' inline-flex justify-start' : ''}
									${positionType === MemberProfileType.DM_MEMBER_GROUP ? ` ${isOwnerClanOrGroup ? 'max-w-[150px]' : 'max-w-[176px]'}  whitespace-nowrap overflow-x-hidden text-ellipsis` : ''}
									${positionType === MemberProfileType.DM_LIST ? `${isOwnerClanOrGroup ? 'max-w-[150px]' : 'max-w-[176px]'} whitespace-nowrap overflow-x-hidden text-ellipsis text-theme-primary-hover` : ''}
									${classParent === '' ? 'bg-transparent' : 'relative '}
									${isUnReadDirect && !isMute ? ' font-semibold text-theme-primary-active' : 'font-medium  '}
								`}
									title={name}
								>
									<UserName
										name={name}
										isHiddenAvatarPanel={isHiddenAvatarPanel}
										hideLongName={hideLongName}
										isOwnerClanOrGroup={!!isOwnerClanOrGroup}
										isListFriend={isListFriend}
										isDM={isDM}
										userId={user?.user?.id}
									/>
									{isListFriend && <span className="hidden group-hover/list_friends:inline">&nbsp;{usernameAva}</span>}
								</p>
								{isOwnerClanOrGroup && (
									<button className="w-[14px] h-[14px] ml-1">
										<Icons.OwnerIcon />
									</button>
								)}
							</div>
							{customStatus && isMemberDMGroup && (
								<p
									className={`text-theme-primary opacity-60 w-full text-[12px] line-clamp-1 break-all max-w-[176px]`}
									title={customStatus}
								>
									{customStatus}
								</p>
							)}
						</div>
					)}
					{Number(user?.type) === ChannelType.CHANNEL_TYPE_GROUP && (
						<p className="text-theme-primary opacity-60 text-xs">{countMember} Members</p>
					)}
				</div>
			</div>
		</div>
	);
};

export const MemberProfile = (props: MemberProfileProps) => {
	return <BaseMemberProfile {...props} isDM={true} currentClan={undefined} onClick={props.onClick} />;
};

export const SimpleMemberProfile = (props: BaseMemberProfileProps) => {
	const handleClick = (event: React.MouseEvent) => {
		props.onClick?.(event);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		if (props.user && props.onContextMenu) {
			props.onContextMenu(event, props.user?.user ? (props.user?.user as ChannelMembersEntity) : props.user);
		}
	};

	return <MemberProfileCore {...props} onClick={handleClick} onContextMenu={handleContextMenu} />;
};

export const BaseMemberProfile = (props: BaseMemberProfileProps) => {
	const { showContextMenu } = useDirectMessageContextMenu();

	const handleClick = (event: React.MouseEvent) => {
		props.onClick?.(event);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		const user = props.user?.user ? (props.user?.user as ChannelMembersEntity) : props.user;

		if (props.onContextMenu && user) {
			props.onContextMenu(event, user);
			return;
		}

		if (user) {
			showContextMenu(event, user);
		}
	};

	return <MemberProfileCore {...props} onClick={handleClick} onContextMenu={handleContextMenu} />;
};

export const UserStatusIconDM = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser2 status="online" />;
		case EUserStatus.IDLE:
			return (
				<span className="flex justify-end items-end h-full">
					<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-3 h-3 bg-theme-primary p-[2px] rounded-full" />
				</span>
			);
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser2 status="dnd" />;
		case EUserStatus.INVISIBLE:
			return (
				<span className="flex justify-end items-end h-full">
					<Icons.OfflineStatus className=" w-3 h-3 bg-theme-primary p-[2px] rounded-full" />
				</span>
			);
		default:
			return <StatusUser2 status="online" />;
	}
};

export const UserStatusIcon = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser2 status="online" className="w-5 h-5 p-1" />;
		case EUserStatus.IDLE:
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-5 h-5 bg-theme-primary p-1 rounded-full" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser2 status="dnd" className="w-5 h-5 p-1" />;
		case EUserStatus.INVISIBLE:
			return <Icons.OfflineStatus className="w-5 h-5 bg-theme-primary p-1 rounded-full" />;
		default:
			return <StatusUser2 status="online" className="w-5 h-5 p-1" />;
	}
};

export const UserStatusIconClan = ({ status, online }: { status?: EUserStatus; online?: boolean }) => {
	const normalizedStatus = typeof status === 'object' && status !== null ? (status as UserStatus).status?.toUpperCase() : status?.toUpperCase();

	if (!online) {
		return <StatusUser2 status="offline" />;
	}

	switch (normalizedStatus) {
		case 'IDLE':
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px]" />;
		case 'DO NOT DISTURB':
			return <StatusUser2 status="dnd" />;
		case 'INVISIBLE':
			return <StatusUser2 status="offline" />;
	}

	if (online) {
		return <StatusUser2 status="online" />;
	}

	return <Icons.OfflineStatus />;
};
interface UserNameProps {
	name: string;
	isHiddenAvatarPanel?: boolean;
	hideLongName?: boolean;
	isOwnerClanOrGroup?: boolean;
	isListFriend?: boolean;
	isDM?: boolean;
	userId?: string;
}
const UserName = memo(({ name, isHiddenAvatarPanel, hideLongName, isOwnerClanOrGroup, isListFriend, isDM, userId }: UserNameProps) => {
	return (
		<DMUserName
			name={name}
			isHiddenAvatarPanel={isHiddenAvatarPanel}
			hideLongName={hideLongName}
			isOwnerClanOrGroup={isOwnerClanOrGroup}
			isListFriend={isListFriend}
		/>
	);
});

const DMUserName = ({
	name,
	isHiddenAvatarPanel,
	hideLongName,
	isOwnerClanOrGroup,
	isListFriend
}: Omit<UserNameProps, 'isDM' | 'isFooter' | 'userId'>) => {
	return (
		<span
			className={`one-line text-start ${hideLongName && 'truncate !block'} ${isOwnerClanOrGroup && 'max-w-[140px]'
				} ${isListFriend ? 'text-theme-primary' : ''}`}
			data-e2e={generateE2eId(`chat.direct-message.chat-item.username`)}
		>
			{!isHiddenAvatarPanel && name}
		</span>
	);
};
