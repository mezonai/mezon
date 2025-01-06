import { useChannelMembersActions } from '@mezon/core';
import {
	ChannelMembersEntity,
	notificationSettingActions,
	RolesClanEntity,
	selectActivityByUserId,
	selectAllAccount,
	selectCurrentClan,
	selectCurrentClanId,
	selectRolesClanEntities,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ActivitiesName,
	createImgproxyUrl,
	DEFAULT_ROLE_COLOR,
	EUserStatus,
	HEIGHT_PANEL_PROFILE,
	HEIGHT_PANEL_PROFILE_DM,
	MemberProfileType,
	MouseButton,
	WIDTH_CHANNEL_LIST_BOX,
	WIDTH_PANEL_PROFILE
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage, ModalUserProfile } from '../../components';
import { Coords } from '../ChannelLink';
import { directMessageValueProps } from '../DmList/DMListItem';
import { DataMemberCreate } from '../DmList/MemberListGroupChat';
import PanelMember from '../PanelMember';
import StatusUser from '../StatusUser';
import UserProfileModalInner from '../UserProfileModalInner';
import ModalRemoveMemberClan from './ModalRemoveMemberClan';

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
	userNameAva?: string;
	hideLongName?: boolean;
	isDM?: boolean;
	isMute?: boolean;
	metaDataDM?: string;
};

export enum ModalType {
	ProfileItem = 'profileItem',
	PannelMember = 'pannelMember',
	UserProfile = 'userProfile'
}

export const profileElemHeight = 358;
export const profileElemWidth = 320;

export function MemberProfile({
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
	userNameAva,
	hideLongName,
	isDM,
	isMute,
	metaDataDM
}: MemberProfileProps) {
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [openModalRemoveMember, setOpenModalRemoveMember] = useState<boolean>(false);
	const { removeMemberClan } = useChannelMembersActions();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClan = useSelector(selectCurrentClan);
	const userProfile = useSelector(selectAllAccount);
	const [positionShortUser, setPositionShortUser] = useState<{ top: number; left: number } | null>(null);
	const dispatch = useAppDispatch();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const activityByUserId = useSelector(selectActivityByUserId(user?.user?.id || ''));
	const rolesClanEntity = useSelector(selectRolesClanEntities);

	const userRolesClan = useMemo(() => {
		const activeRole: Array<RolesClanEntity> = [];
		let userRoleLength = 0;
		let highestPermissionRole = null;
		let maxLevelPermission = 0;

		for (const key in rolesClanEntity) {
			const role = rolesClanEntity[key];
			const checkHasRole = role.role_user_list?.role_users?.some((listUser) => listUser.id === user?.user?.id);

			if (checkHasRole) {
				activeRole.push(role);
				userRoleLength++;

				if (role.max_level_permission !== undefined && role.max_level_permission > maxLevelPermission) {
					maxLevelPermission = role.max_level_permission;
					highestPermissionRole = role;
				}
			}
		}

		return {
			usersRole: activeRole,
			length: userRoleLength,
			highestPermissionRoleColor: highestPermissionRole?.color || activeRole[0]?.color || DEFAULT_ROLE_COLOR
		};
	}, [user?.user?.id, rolesClanEntity]);

	const activityNames: { [key: string]: string } = {
		[ActivitiesName.CODE]: 'Visual Studio Code',
		[ActivitiesName.VISUAL_STUDIO_CODE]: 'Visual Studio Code',
		[ActivitiesName.SPOTIFY]: 'Listening to Spotify',
		[ActivitiesName.LOL]: 'League of Legends'
	};

	const activityStatus = customStatus || activityNames[activityByUserId?.activity_name as string];
	const activityTitle = activityByUserId?.activity_description;

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

		if (event.button === MouseButton.LEFT) {
			// handle show profile item
			const heightPanel = isDM ? HEIGHT_PANEL_PROFILE_DM : HEIGHT_PANEL_PROFILE;
			if (window.innerHeight - event.clientY > heightPanel) {
				setPositionShortUser({
					top: event.clientY,
					left: window.innerWidth - WIDTH_CHANNEL_LIST_BOX - WIDTH_PANEL_PROFILE
				});
			} else {
				setPositionShortUser({
					top: window.innerHeight - heightPanel,
					left: window.innerWidth - WIDTH_CHANNEL_LIST_BOX - WIDTH_PANEL_PROFILE
				});
			}
			openProfileItem();
		}

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

	const handleClickRemoveMember = () => {
		setOpenModalRemoveMember(true);
		closeModal(ModalType.ProfileItem);
		closeModal(ModalType.PannelMember);
	};

	const handleRemoveMember = async () => {
		if (user) {
			const userIds = [user.user?.id ?? ''];
			await removeMemberClan({ clanId: currentClanId as string, channelId: user.channelId as string, userIds });

			setOpenModalRemoveMember(false);
		}
	};

	const isFooter = positionType === MemberProfileType.FOOTER_PROFILE;

	const isListFriend = positionType === MemberProfileType.LIST_FRIENDS;

	const isMemberDMGroup = positionType === MemberProfileType.DM_MEMBER_GROUP;

	const isMemberChannel = positionType === MemberProfileType.MEMBER_LIST;

	const isListActivity = positionType === MemberProfileType.LIST_ACTIVITY;

	const isListDm = positionType === MemberProfileType.DM_LIST;

	const isAnonymous = useMemo(
		() => (isFooter ? userProfile?.user?.id : user?.user?.id) === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID,
		[isFooter, user?.user?.id, userProfile?.user?.id]
	);

	const userName = isFooter ? userProfile?.user?.username || '' : name || '';

	const subNameRef = useRef<HTMLInputElement>(null);
	const minWidthNameMain = subNameRef.current?.offsetWidth;

	const isOwnerClanOrGroup =
		(dataMemberCreate?.createId || currentClan?.creator_id) &&
		(dataMemberCreate ? dataMemberCreate?.createId : currentClan?.creator_id) === user?.user?.id;

	const modalState = useRef({
		profileItem: false,
		pannelMember: false,
		userProfile: false
	});

	const [openProfileItem, closeProfileItem] = useModal(() => {
		if (!listProfile) return;
		modalState.current.profileItem = true;
		return (
			<div
				className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 dark:bg-black bg-gray-200 w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in`}
				style={{
					top: `${positionShortUser?.top}px`,
					left: `${positionShortUser?.left}px`
				}}
			>
				<ModalUserProfile
					onClose={closeProfileItem}
					userID={user?.id || ''}
					classBanner="rounded-tl-lg rounded-tr-lg h-[105px]"
					mode={isMemberDMGroup ? ChannelStreamMode.STREAM_MODE_GROUP : undefined}
					positionType={positionType}
					avatar={avatar}
					name={name}
					isDM={isDM}
					activityByUserId={activityByUserId}
					user={user}
				/>
			</div>
		);
	}, [positionShortUser, activityByUserId]);

	const [openPanelMember, closePanelMember] = useModal(() => {
		if (isHiddenAvatarPanel) return;
		modalState.current.pannelMember = true;
		return (
			<PanelMember
				coords={coords}
				onClose={() => closeModal(ModalType.PannelMember)}
				member={user}
				onRemoveMember={handleClickRemoveMember}
				directMessageValue={directMessageValue}
				name={name}
				isMemberDMGroup={dataMemberCreate ? true : false}
				dataMemberCreate={dataMemberCreate}
				isMemberChannel={isMemberChannel}
				onOpenProfile={openUserProfile}
			/>
		);
	}, [coords]);

	const [openUserProfile, closeUserProfile] = useModal(() => {
		modalState.current.userProfile = true;
		return (
			<UserProfileModalInner
				userId={user?.user?.id || user?.user_id?.[0]}
				directId={(user as any)?.channel_id || user?.channelId}
				onClose={() => closeModal(ModalType.UserProfile)}
				isDM={isDM}
				user={user}
			/>
		);
	});

	const closeModal = useCallback((modalType: ModalType) => {
		switch (modalType) {
			case ModalType.ProfileItem:
				closeProfileItem();
				break;
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
		closeModal(ModalType.ProfileItem);
		closeModal(ModalType.PannelMember);
		closeModal(ModalType.UserProfile);
	};

	const userStatus = useMemo(() => {
		if (isFooter && userProfile?.user?.metadata) {
			const metadata = safeJSONParse(userProfile?.user?.metadata);
			return metadata;
		}
		if (metaDataDM) {
			return metaDataDM;
		}
		if (user?.user?.metadata) {
			return user?.user?.metadata;
		}
	}, [user?.user?.id, userProfile?.user?.id, user?.user?.metadata, userProfile?.user?.metadata]);

	return (
		<div className="relative group">
			<div
				ref={panelRef}
				onMouseDown={handleMouseClick}
				className={`relative gap-[5px] flex items-center cursor-pointer rounded ${isFooter ? 'h-10 max-w-[142px]' : ''} ${classParent} ${isOffline ? 'opacity-60' : ''} ${listProfile ? '' : 'overflow-hidden'}`}
			>
				<div className="mr-[2px] relative inline-flex items-center justify-start w-8 h-8 text-lg text-white rounded-full">
					<AvatarImage
						alt={userName}
						userName={userNameAva ?? userName}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
						isAnonymous={isAnonymous}
					/>
					{isFooter && (
						<span
							className={`absolute bottom-[0px] inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white dark:bg-bgSecondary bg-bgLightMode rounded-full right-[-4px]`}
						>
							<UserStatusIcon status={userStatus?.user_status} />
						</span>
					)}
					{!isFooter && !isHideIconStatus && (
						<StatusUser
							isListDm={isListDm}
							isMemberChannel={isMemberChannel}
							isMemberDMGroup={isMemberDMGroup}
							status={status}
							directMessageValue={directMessageValue}
							userId={user?.user?.id}
							customStatus={userStatus?.user_status}
						/>
					)}
				</div>
				<div className="flex flex-col items-start h-full">
					<div
						ref={subNameRef}
						className={`absolute top-[22px] mr-5 max-w-full overflow-x-hidden transition-all duration-300 flex flex-col items-start justify-start ${isFooter ? 'ml-[2px]' : ''} ${isHideAnimation ? '' : 'group-hover:-translate-y-4'}`}
					>
						{!isHideStatus && (
							<>
								{customStatus && (isFooter || isListFriend) ? (
									<span
										className={`text-[11px] text-left dark:text-contentSecondary text-colorTextLightMode line-clamp-1 ${isFooter ? 'leading-[14px]' : ''}`}
									>
										{customStatus}
									</span>
								) : (
									<span
										className={`text-[11px] dark:text-contentSecondary text-colorTextLightMode ${isFooter ? 'leading-[18px]' : ''}`}
									>
										{!status ? 'Offline' : 'Online'}
									</span>
								)}

								<p className="text-[11px] dark:text-contentSecondary text-colorTextLightMode overflow-x-hidden whitespace-nowrap text-ellipsis text-left w-full">
									{userProfile?.user?.username}
								</p>
							</>
						)}
					</div>
					{!isHideUserName && (
						<div className={'h-full flex-col'}>
							<div className="flex flex-row items-center w-full overflow-x-hidden" style={{ minWidth: `${minWidthNameMain}px` }}>
								<p
									className={`text-base font-medium nameMemberProfile
												${isListFriend ? ' inline-flex justify-start' : ''}
									${isMemberChannel || positionType === MemberProfileType.DM_MEMBER_GROUP ? ` ${isOwnerClanOrGroup ? 'max-w-[150px]' : 'max-w-[176px]'}  whitespace-nowrap overflow-x-hidden text-ellipsis` : ''}
									${positionType === MemberProfileType.DM_LIST ? `${isOwnerClanOrGroup ? 'max-w-[150px]' : 'max-w-[176px]'} whitespace-nowrap overflow-x-hidden text-ellipsis group-hover/itemListDm:text-black dark:group-hover/itemListDm:text-white` : ''}
									${classParent === '' ? 'bg-transparent' : 'relative dark:bg-transparent bg-channelTextareaLight'}
									${isUnReadDirect && !isMute ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-channelTextLabel text-colorTextLightMode'}
									${isFooter ? 'top-0 leading-[18px] max-w-[102px] overflow-x-hidden text-ellipsis text-sm font-semibold text-black dark:text-white' : ''}
									`}
									title={name}
								>
									<span
										className={`one-line ${hideLongName && 'truncate !block'} ${isOwnerClanOrGroup && 'max-w-[140px]'} ${isListFriend ? 'dark:text-white text-black' : ''}`}
										style={isFooter || isDM ? undefined : { color: userRolesClan.highestPermissionRoleColor }}
									>
										{!isHiddenAvatarPanel && name}
									</span>
									{isListFriend && <span className="hidden group-hover/list_friends:inline">&nbsp;{userNameAva}</span>}
								</p>
								{isOwnerClanOrGroup && (
									<button className="w-[14px] h-[14px] ml-1">
										<Icons.OwnerIcon />
									</button>
								)}
							</div>
							{(customStatus || activityByUserId) && (isMemberChannel || isMemberDMGroup || isListActivity) && (
								<p
									className={`dark:text-channelTextLabel text-black w-full text-[12px] line-clamp-1 break-all ${isListActivity ? 'w-full' : 'max-w-[176px]'} `}
									title={customStatus}
								>
									{status?.status ? (isListActivity ? activityTitle : activityStatus) : customStatus}
								</p>
							)}
						</div>
					)}

					{Number(directMessageValue?.type) === ChannelType.CHANNEL_TYPE_GROUP && (
						<p className="dark:text-channelTextLabel text-colorTextLightMode text-xs">{countMember} Members</p>
					)}
				</div>
			</div>

			{openModalRemoveMember && (
				<ModalRemoveMemberClan
					openModal={openModalRemoveMember}
					username={user?.user?.username}
					onClose={() => setOpenModalRemoveMember(false)}
					onRemoveMember={handleRemoveMember}
				/>
			)}
		</div>
	);
}

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
