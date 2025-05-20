import { ChannelMembersEntity, selectCurrentClan } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus, MemberProfileType, createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useMemo, useRef } from 'react';
import { AvatarImage } from '../../components';
import { useDirectMessageContextMenu } from '../../contexts/DirectMessageContextMenu';
import { directMessageValueProps } from '../DmList/DMListItem';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import StatusUser from '../StatusUser';

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
	directMessageValue?: directMessageValueProps;
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
};

type BaseMemberProfileProps = MemberProfileProps & {
	currentClan?: ReturnType<typeof selectCurrentClan>;
};

export const MemberProfile = (props: MemberProfileProps) => {
	return <BaseMemberProfile {...props} isDM={true} currentClan={undefined} />;
};

export const BaseMemberProfile = ({
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
	directMessageValue,
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
	currentClan
}: BaseMemberProfileProps) => {
	// Access both context menus
	const { showContextMenu, setCurrentUser } = useDirectMessageContextMenu();

	const username = name || '';

	const handleClick = (event: React.MouseEvent) => {};

	const handleContextMenu = (event: React.MouseEvent) => {
		if (user) {
			setCurrentUser(user);
			showContextMenu(event, user, directMessageValue);
		}
	};

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
				onContextMenu={handleContextMenu}
				onClick={handleClick}
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
							directMessageValue={directMessageValue}
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
								<span className={`text-[11px] text-left dark:text-contentSecondary text-colorTextLightMode line-clamp-1 `}>
									{customStatus}
								</span>
							) : (
								<span className={`text-[11px] dark:text-contentSecondary text-colorTextLightMode `}>
									{typeof userStatus === 'string' && userStatus ? userStatus : !status?.status ? 'Offline' : 'Online'}
								</span>
							)}
							<p className="text-[11px] dark:text-contentSecondary text-colorTextLightMode overflow-x-hidden whitespace-nowrap text-ellipsis text-left w-full">
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
									${positionType === MemberProfileType.DM_LIST ? `${isOwnerClanOrGroup ? 'max-w-[150px]' : 'max-w-[176px]'} whitespace-nowrap overflow-x-hidden text-ellipsis group-hover/itemListDm:text-black dark:group-hover/itemListDm:text-white` : ''}
									${classParent === '' ? 'bg-transparent' : 'relative dark:bg-transparent bg-channelTextareaLight'}
									${isUnReadDirect && !isMute ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-channelTextLabel text-colorTextLightMode'}
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
									className={`dark:text-channelTextLabel text-black w-full text-[12px] line-clamp-1 break-all max-w-[176px]`}
									title={customStatus}
								>
									{customStatus}
								</p>
							)}
						</div>
					)}
					{Number(directMessageValue?.type) === ChannelType.CHANNEL_TYPE_GROUP && (
						<p className="dark:text-channelTextLabel text-colorTextLightMode text-xs">{countMember} Members</p>
					)}
				</div>
			</div>
		</div>
	);
};

export const UserStatusIcon = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <Icons.OnlineStatus />;
		case EUserStatus.IDLE:
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px]" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <Icons.MinusCircleIcon className=" w-[10px] h-[10px]" />;
		case EUserStatus.INVISIBLE:
			return <Icons.OfflineStatus />;
		default:
			return <Icons.OnlineStatus />;
	}
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
			className={`one-line text-start ${hideLongName && 'truncate !block'} ${
				isOwnerClanOrGroup && 'max-w-[140px]'
			} ${isListFriend ? 'dark:text-white text-black' : ''}`}
		>
			{!isHiddenAvatarPanel && name}
		</span>
	);
};
