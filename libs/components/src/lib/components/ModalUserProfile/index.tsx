import {
	useAppNavigation,
	useAuth,
	useDirect,
	useEscapeKeyClose,
	useFormatDate,
	useMemberStatus,
	useOnClickOutside,
	useSendInviteMessage,
	useSettingFooter,
	useUserById
} from '@mezon/core';
import type { RootState } from '@mezon/store';
import { EStateFriend, selectAllAccount, selectChannelByChannelId, selectFriendById, selectStatusInVoice, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ChannelMembersEntity, IMessageWithUser } from '@mezon/utils';
import { EUserStatus } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { RefObject } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
	const userInvoice = useSelector((state) => selectStatusInVoice(state, userID as string));
	const status = useMemberStatus(userID || '');
	const userById = useUserById(userID);
	const userStatusById = useMemberStatus(userID || '');
	const userStatus = useMemo(() => {
		if (userID === userId) {
			return {
				status: userProfile?.user?.status || EUserStatus.ONLINE,
				user_status: userProfile?.user?.user_status || ''
			};
		}
		return userStatusById;
	}, [userStatusById]);

	const modalRef = useRef<boolean>(false);
	const onLoading = useRef<boolean>(false);

	const date = new Date(userById?.user?.create_time as string | Date);
	const { timeFormatted } = useFormatDate({ date });

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
	const isBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK;
	}, [userById?.user?.id, infoFriend]);
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
				{userInvoice && !isFooterProfile && !isDM && <MemberInVoiceButton channelId={userInvoice} />}
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
				customStatus={status.user_status}
				isAnonymous={checkAnonymous}
				userID={userID}
				positionType={positionType}
				isFooterProfile={isFooterProfile}
				statusOnline={userStatus?.status as EUserStatus}
			/>
			<div className="px-[16px]">
				<div className=" w-full border-theme-primary p-2 my-[16px] text-theme-primary shadow rounded-[10px] flex flex-col text-justify bg-item-theme">
					<div>
						<p className="font-semibold tracking-wider text-lg one-line text-theme-primary-active my-0 truncate">
							{isUserRemoved
								? t('labels.unknownUser')
								: checkAnonymous
									? t('labels.anonymous')
									: userById?.clan_nick ||
										userById?.user?.display_name ||
										userById?.user?.username ||
										message?.display_name ||
										message?.username}
						</p>
						<p className="text-base font-semibold tracking-wide text-theme-primary my-0 truncate">
							{isUserRemoved ? t('labels.unknownUser') : usernameShow}
						</p>
					</div>

					{checkAddFriend === EStateFriend.MY_PENDING && !showPopupLeft && <PendingFriend user={userById as ChannelMembersEntity} />}

					{mode !== 4 && mode !== 3 && !isFooterProfile && (
						<UserDescription
							title={t(`labels.${ETileDetail.AboutMe}`)}
							detail={checkUser ? (userProfile?.user?.about_me as string) : (userById?.user?.about_me as string)}
						/>
					)}
					{mode !== 4 && mode !== 3 && !isFooterProfile && (
						<UserDescription title={t(`labels.${ETileDetail.MemberSince}`)} detail={timeFormatted} />
					)}

					{isFooterProfile ? (
						<StatusProfile userById={userProfile?.user as ChannelMembersEntity} isDM={isDM} modalRef={modalRef} onClose={onClose} />
					) : (
						mode !== 4 && mode !== 3 && !hiddenRole && userById && <RoleUserProfile userID={userID} />
					)}

					{userID !== '0' && !hiddenRole && !checkAnonymous && !isUserRemoved && !isBlockUser ? (
						userProfile?.user?.username ? (
							<div className="w-full items-center mt-2">
								<input
									type="text"
									className={`w-full border-theme-primary text-theme-primary color-text-secondary rounded-[5px] bg-theme-contexify p-[5px] `}
									placeholder={t('placeholders.messageUser', {
										username: userById?.clan_nick || userById?.user?.display_name || userById?.user?.username
									})}
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

const MemberInVoiceButton = ({ channelId }: { channelId: string }) => {
	const channelData = useSelector((state) => selectChannelByChannelId(state, channelId));
	const navigate = useNavigate();

	const handleNavigateRoom = useCallback(() => {
		if (channelData?.clan_id && channelData?.channel_id) {
			navigate(`/chat/clans/${channelData?.clan_id}/channels/${channelData?.channel_id}`);
		}
	}, [channelId]);

	return (
		<div
			className="group flex min-w-8 w-fit h-8 items-center text-sm justify-end bg bg-buttonMore hover:bg-buttonMoreHover cursor-pointer py-1 px-2 text-white rounded-full"
			onClick={handleNavigateRoom}
			data-e2e="invoice-button-component"
		>
			<div className="opacity-0 truncate w-0 group-hover:animate-expand flex items-center justify-center leading-4 font-medium">
				{channelData?.channel_label}
			</div>
			<Icons.Speaker defaultSize="w-[14px] h-[14px] text-green-500 pointer-events-none" />
		</div>
	);
};

export default memo(ModalUserProfile);
