import { ChannelMembersEntity, notificationSettingActions, selectAllAccount, selectCurrentClan, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus, MemberProfileType, MouseButton, createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../components';
import { Coords } from '../ChannelLink';
import { directMessageValueProps } from '../DmList/DMListItem';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import PanelMember from '../PanelMember';
import StatusUser from '../StatusUser';
import UserProfileModalInner from '../UserProfileModalInner';

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

export enum ModalType {
	PannelMember = 'pannelMember',
	UserProfile = 'userProfile'
}

export const profileElemHeight = 358;
export const profileElemWidth = 320;

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
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const userProfile = useSelector(selectAllAccount);
	const dispatch = useAppDispatch();
	const panelRef = useRef<HTMLDivElement | null>(null);

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		// stop open popup default of web
		window.oncontextmenu = (e) => {
			e.preventDefault();
		};

		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		// adjust mouseX if it is less than 200px(panel width) from the right edge of the browser
		const adjustedMouseX = mouseX > windowWidth - 200 ? mouseX - 200 : mouseX;

		if (event.button === MouseButton.RIGHT) {
			const distanceToBottom = windowHeight - mouseY;
			setCoords({ mouseX: adjustedMouseX, mouseY, distanceToBottom });
			if (modalState.current.pannelMember) {
				closeModal(ModalType.PannelMember);
			} else {
				if (directMessageValue) {
					await dispatch(
						notificationSettingActions.getNotificationSetting({
							channelId: directMessageValue?.dmID || ''
						})
					);
				}
				resetModalState();
				openPanelMember();
			}
		}
	};

	const isListFriend = positionType === MemberProfileType.LIST_FRIENDS;

	const isMemberDMGroup = positionType === MemberProfileType.DM_MEMBER_GROUP;

	const isListDm = positionType === MemberProfileType.DM_LIST;

	const isAnonymous = user?.user?.id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID;

	const username = name || '';

	const subNameRef = useRef<HTMLInputElement>(null);
	const minWidthNameMain = subNameRef.current?.offsetWidth;

	const isOwnerClanOrGroup =
		(dataMemberCreate?.createId || currentClan?.creator_id) &&
		(dataMemberCreate ? dataMemberCreate?.createId : currentClan?.creator_id) === user?.user?.id;

	const modalState = useRef({
		pannelMember: false,
		userProfile: false
	});

	const [openPanelMember, closePanelMember] = useModal(() => {
		if (isHiddenAvatarPanel) return;
		modalState.current.pannelMember = true;
		return (
			<PanelMember
				coords={coords}
				onClose={() => closeModal(ModalType.PannelMember)}
				member={user}
				directMessageValue={directMessageValue}
				name={name}
				isMemberDMGroup={dataMemberCreate ? true : false}
				dataMemberCreate={dataMemberCreate}
				isMemberChannel={false}
				onOpenProfile={openUserProfile}
			/>
		);
	}, [coords, user]);

	const [openUserProfile, closeUserProfile] = useModal(() => {
		modalState.current.userProfile = true;
		return (
			<UserProfileModalInner
				userId={user?.user?.id || user?.user_id?.[0]}
				directId={(user as any)?.channel_id || user?.channelId}
				onClose={() => closeModal(ModalType.UserProfile)}
				isDM={isDM}
				user={user}
				avatar={avatar}
				name={name}
				usernameAva={usernameAva}
				status={status}
				customStatus={customStatus || metaDataDM?.status}
			/>
		);
	}, [user]);

	const closeModal = useCallback((modalType: ModalType) => {
		switch (modalType) {
			case ModalType.PannelMember:
				closePanelMember();
				break;
			case ModalType.UserProfile:
				closeUserProfile();
				break;
		}
		modalState.current[modalType] = false;
	}, []);

	const resetModalState = () => {
		closeModal(ModalType.PannelMember);
		closeModal(ModalType.UserProfile);
	};

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
		<div className="relative group w-full">
			<div
				ref={panelRef}
				onMouseDown={handleMouseClick}
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
								{userProfile?.user?.username}
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
const UserName = memo(
	({ name, isHiddenAvatarPanel, hideLongName, isOwnerClanOrGroup, isListFriend, isDM, userId }: UserNameProps) => {
		return (
			<DMUserName
				name={name}
				isHiddenAvatarPanel={isHiddenAvatarPanel}
				hideLongName={hideLongName}
				isOwnerClanOrGroup={isOwnerClanOrGroup}
				isListFriend={isListFriend}
			/>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.name === nextProps.name &&
			prevProps.isHiddenAvatarPanel === nextProps.isHiddenAvatarPanel &&
			prevProps.hideLongName === nextProps.hideLongName &&
			prevProps.isOwnerClanOrGroup === nextProps.isOwnerClanOrGroup &&
			prevProps.isListFriend === nextProps.isListFriend &&
			prevProps.isDM === nextProps.isDM &&
			prevProps.userId === nextProps.userId
		);
	}
);

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
