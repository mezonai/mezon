import {
	useAppNavigation,
	useAuth,
	useDirect,
	useEscapeKeyClose,
	useFormatDate,
	useMemberCustomStatus,
	useMemberStatus,
	useOnClickOutside,
	useSendInviteMessage,
	useSettingFooter,
	useUserById,
	useUserMetaById
} from '@mezon/core';
import type { RootState } from '@mezon/store';
import { EStateFriend, selectAccountCustomStatus, selectAllAccount, selectCurrentUserId, selectFriendById, useAppSelector } from '@mezon/store';
import type { ChannelMembersEntity, IMessageWithUser } from '@mezon/utils';
import { saveParseUserStatus } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { RefObject } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getColorAverageFromURL } from '../SettingProfile/AverageColor';
import AvatarProfile from './AvatarProfile';
import NoteUserProfile from './NoteUserProfile';
import RoleUserProfile from './RoleUserProfile';
import StatusProfile from './StatusProfile';
import GroupIconBanner from './StatusProfile/groupIconBanner';
import UserDescription from './UserDescription';
import PendingFriend from './pendingFriend';

type ModalUserProfileProps = {
	userID?: string;
	isFooterProfile?: boolean;
	classWrapper?: string;
	classBanner?: string;
	hiddenRole?: boolean;
	showNote?: boolean;
	message?: IMessageWithUser;
	showPopupLeft?: boolean;
	mode?: number;
	avatar?: string;
	positionType?: string;
	name?: string;
	status?: boolean;
	user?: ChannelMembersEntity;
	isDM?: boolean;
	userStatusProfile?: string;
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
	isUserRemoved?: boolean;
	checkAnonymous?: boolean;
	modalControlRef?: RefObject<HTMLDivElement>;
};

export type OpenModalProps = {
	openFriend: boolean;
	openOption: boolean;
};

enum ETileDetail {
	AboutMe = 'aboutMe',
	MemberSince = 'memberSince',
	Actitity = 'activity'
}

const ModalUserProfile = ({
	userID,
	isFooterProfile,
	classWrapper,
	classBanner,
	hiddenRole,
	showNote,
	message,
	showPopupLeft,
	mode,
	avatar,
	positionType,
	isDM,
	onClose,
	rootRef,
	isUserRemoved,
	checkAnonymous,
	modalControlRef
}: ModalUserProfileProps) => {
	const { t } = useTranslation('userProfile');

	const userProfile = useSelector(selectAllAccount);
	const { userId } = useAuth();
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const userCustomStatus = useMemberCustomStatus(userID || '', isDM);
	const userById = useUserById(userID);
	const userStatus = useMemberStatus(userID || '');
	const userMetaById = useUserMetaById(userID);
	const modalRef = useRef<boolean>(false);
	const onLoading = useRef<boolean>(false);
	const statusOnline = useMemo(() => {
		if (userProfile?.user?.metadata && userId === userID) {
			const metadata = saveParseUserStatus(userProfile?.user?.metadata);
			return metadata?.user_status;
		}
		if (userMetaById) {
			return userMetaById as any;
		}
	}, [userID, userId, userMetaById, userProfile]);

	const date = new Date(userById?.user?.create_time as string | Date);
	const { timeFormatted } = useFormatDate({ date });
	const currentUserId = useSelector(selectCurrentUserId);
	const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
	const displayCustomStatus = userID === currentUserId ? currentUserCustomStatus : userCustomStatus;
	const avatarByUserId = isDM ? userById?.user?.avatar_url : userById?.clan_avatar || userById?.user?.avatar_url;

	const [content, setContent] = useState<string>('');

	const initOpenModal = {
		openFriend: false,
		openOption: false
	};
	const [openModal, setOpenModal] = useState<OpenModalProps>(initOpenModal);

	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();

	const sendMessage = async (userId: string, display_name?: string, username?: string, avatar?: string) => {
		const response = await createDirectMessageWithUser(userId, display_name, username, avatar);
		if (response.channel_id) {
			const channelMode = ChannelStreamMode.STREAM_MODE_DM;
			sendInviteMessage(content, response.channel_id, channelMode);
			setContent('');
			const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
			navigate(directChat);
		}
		onLoading.current = false;
	};
	const handleContent = (e: React.ChangeEvent<HTMLInputElement>) => {
		setContent(e.target.value);
	};
	const checkOwner = (userIdPram: string) => {
		return userIdPram === userId;
	};

	const checkUrl = (url: string | undefined) => {
		if (url !== undefined && url !== '') return true;
		return false;
	};
	const [color, setColor] = useState<string>('');

	useEffect(() => {
		const getColor = async () => {
			if ((isFooterProfile && checkUrl(userProfile?.user?.avatar_url)) || checkUrl(message?.avatar) || checkUrl(userById?.user?.avatar_url)) {
				const url = userById?.user?.avatar_url;
				const colorImg = await getColorAverageFromURL(url || '');
				if (colorImg) setColor(colorImg);
			}
		};

		getColor();
	}, [userProfile?.user?.avatar_url, isFooterProfile, userID, message?.avatar, userById?.user?.avatar_url]);
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, userById?.user?.id || ''));
	const checkAddFriend = useMemo(() => {
		return infoFriend?.state;
	}, [infoFriend]);
	const checkUser = useMemo(() => userProfile?.user?.id === userID, [userID, userProfile?.user?.id]);

	const { setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab } = useSettingFooter();
	const openSetting = () => {
		setIsShowSettingFooterStatus(true);
		setIsShowSettingFooterInitTab('Profiles');
		onClose();
	};

	const profileRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(rootRef || profileRef, onClose);
	useOnClickOutside(rootRef || profileRef, (event) => {
		if (modalControlRef?.current && modalControlRef.current.contains(event.target as Node)) {
			return;
		}
		if (!modalRef.current) onClose();
	});

	const placeholderUserName = useMemo(() => {
		if (userById) {
			return userById?.clan_nick || userById?.user?.display_name || userById?.user?.username;
		}
		if (userID === message?.sender_id) {
			return message?.display_name || message?.username;
		}
		return message?.references?.[0].message_sender_display_name || message?.references?.[0].message_sender_username;
	}, [userById, userID]);

	const usernameShow = useMemo(() => {
		if (isFooterProfile) {
			return userProfile?.user?.username;
		}
		if (userById) {
			return userById?.user?.username;
		}
		if (checkAnonymous) {
			return 'Anonymous';
		}
		if (userID === message?.sender_id) {
			return message?.username;
		}
		return message?.references?.[0].message_sender_username;
	}, [userById, userID]);

	const handleOnKeyPress = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter' && content && onLoading.current === false) {
				if (userById) {
					sendMessage(
						userById?.user?.id || '',
						userById?.user?.display_name || userById?.user?.username,
						userById?.user?.username,
						userById.user?.avatar_url
					);
					onLoading.current = true;
					return;
				}
				sendMessage((userID === message?.sender_id ? message?.sender_id : message?.references?.[0].message_sender_id) || '');
				onLoading.current = true;
			}
		},
		[userById, content]
	);
	return (
		<div tabIndex={-1} ref={profileRef} className={`outline-none ${classWrapper}`} onClick={() => setOpenModal(initOpenModal)}>
			<div
				className={`${classBanner ? classBanner : 'rounded-tl-lg bg-indigo-400 rounded-tr-lg h-[105px]'} flex justify-end gap-x-2 p-2 `}
				style={{ backgroundColor: color }}
			>
				{!checkUser && !checkAnonymous && (
					<GroupIconBanner
						checkAddFriend={checkAddFriend}
						openModal={openModal}
						setOpenModal={setOpenModal}
						user={userById as ChannelMembersEntity}
						showPopupLeft={showPopupLeft}
						kichUser={message?.user}
					/>
				)}
			</div>
			<AvatarProfile
				avatar={avatar || avatarByUserId}
				username={(isFooterProfile && userProfile?.user?.username) || message?.username || userById?.user?.username}
				userToDisplay={isFooterProfile ? userProfile : userById}
				customStatus={displayCustomStatus}
				isAnonymous={checkAnonymous}
				userID={userID}
				positionType={positionType}
				isFooterProfile={isFooterProfile}
				userStatus={userStatus}
				statusOnline={statusOnline}
			/>
			<div className="px-[16px]">
				<div className=" w-full border-theme-primary p-2 my-[16px] text-theme-primary shadow rounded-[10px] flex flex-col text-justify bg-item-theme">
					<div>
						<p className="font-semibold tracking-wider text-xl one-line text-theme-primary-active my-0 truncate">
							{isUserRemoved
								? t('labels.unknownUser')
								: checkAnonymous
									? t('labels.anonymous')
									: userById?.clan_nick || userById?.user?.display_name || userById?.user?.username}
						</p>
						<p className="text-lg font-semibold tracking-wide text-theme-primary my-0 truncate">
							{isUserRemoved ? t('labels.unknownUser') : usernameShow}
						</p>
					</div>

					{checkAddFriend === EStateFriend.MY_PENDING && !showPopupLeft && <PendingFriend user={userById as ChannelMembersEntity} />}

					{mode !== 4 && mode !== 3 && !isFooterProfile && (
						<UserDescription title={t(`labels.${ETileDetail.AboutMe}`)} detail={userById?.user?.about_me as string} />
					)}
					{mode !== 4 && mode !== 3 && !isFooterProfile && (
						<UserDescription title={t(`labels.${ETileDetail.MemberSince}`)} detail={timeFormatted} />
					)}

					{isFooterProfile ? (
						<StatusProfile userById={userById as ChannelMembersEntity} isDM={isDM} modalRef={modalRef} onClose={onClose} />
					) : (
						mode !== 4 && mode !== 3 && !hiddenRole && userById && <RoleUserProfile userID={userID} />
					)}

					{userID !== '0' && !checkOwner(userID ?? '') && !hiddenRole && !checkAnonymous && !isUserRemoved ? (
						userById?.user?.username ? (
							<div className="w-full items-center mt-2">
								<input
									type="text"
									className={`w-full border-theme-primary text-theme-primary color-text-secondary rounded-[5px] bg-theme-contexify p-[5px] `}
									placeholder={t('placeholders.messageUser', { username: placeholderUserName })}
									value={content}
									onKeyPress={handleOnKeyPress}
									onChange={handleContent}
								/>
							</div>
						) : (
							<div className="w-full items-center mt-2">
								<div className="w-full  bg-item-theme text-theme-primary-active p-[8px] text-center italic">
									{t('labels.userNotFound')}
								</div>
							</div>
						)
					) : null}
					{showNote && (
						<>
							<div className="w-full border-b-theme-primary"></div>
							<NoteUserProfile />
						</>
					)}
					{!isFooterProfile && checkUser && (
						<button className="rounded bg-outside-footer py-2 hover:bg-opacity-50 mt-2" onClick={openSetting}>
							{t('labels.editProfile')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default memo(ModalUserProfile);
