import { useEscapeKeyClose, useMemberStatus, useOnClickOutside, useSettingFooter, useUserById } from '@mezon/core';
import type { ChannelMembersEntity, RootState } from '@mezon/store';
import { selectCurrentClanId, selectCurrentUserId, selectFriendById, selectModeResponsive, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { INotification } from '@mezon/utils';
import { EUserSettings, ModeResponsive } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { OpenModalProps } from '../ModalUserProfile';
import AvatarProfile from '../ModalUserProfile/AvatarProfile';
import GroupIconBanner from '../ModalUserProfile/StatusProfile/groupIconBanner';
import ItemPanel from '../PanelChannel/ItemPanel';
import { getColorAverageFromURL } from '../SettingProfile/AverageColor';
import { EActiveType } from '../SettingProfile/SettingRightProfile';
import AboutMe from './AboutMe';
import Activity from './Activity';
import MutualFriends from './MutualFriends';
import MutualServers from './MutualServers';
import ProfileTabs, { typeTab } from './ProfileTabs';

type UserProfileModalInnerProps = {
	onClose?: () => void;
	userId?: string;
	notify?: INotification;
	isDM?: boolean;
	directId?: string;
	user?: ChannelMembersEntity;
	avatar?: string;
	name?: string;
	usernameAva?: string;
	status?: { status?: boolean; isMobile?: boolean };
	customStatus?: string;
};

const initOpenModal = {
	openFriend: false,
	openOption: false
};

const UserProfileModalInner = ({
	userId,
	directId,
	notify,
	onClose,
	isDM,
	user,
	avatar,
	name,
	usernameAva,
	status,
	customStatus
}: UserProfileModalInnerProps) => {
	const { t } = useTranslation('common');
	const userProfileRef = useRef<HTMLDivElement | null>(null);
	const modeResponsive = useAppSelector(selectModeResponsive);
	const userById = useUserById(userId);
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, userById?.user?.id || userId || ''));
	const checkAddFriend = useMemo(() => {
		return infoFriend?.state;
	}, [infoFriend]);
	const [openGroupIconBanner, setGroupIconBanner] = useState<OpenModalProps>(initOpenModal);
	const [activeTab, setActiveTab] = useState<string>(typeTab.ABOUT_ME);
	const [color, setColor] = useState<string>('');
	const currentUserId = useAppSelector(selectCurrentUserId);
	const isSelf = currentUserId === userId;
	const [isOPenEditOption, setIsOPenEditOption] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const { setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile, setIsShowSettingProfileInitTab, setClanIdSettingProfile } =
		useSettingFooter();
	const displayAvatar = userById?.clan_avatar || userById?.user?.avatar_url;
	const displayUsername = name || userById?.clan_nick || userById?.user?.display_name || userById?.user?.username;
	const userStatus = useMemberStatus(userId || '');
	const currentClanId = useSelector(selectCurrentClanId);

	const handleActiveTabChange = (tabId: string) => {
		setActiveTab(tabId);
	};

	const checkUrl = (url: string | undefined) => {
		if (url !== undefined && url !== '') return true;
		return false;
	};

	useEffect(() => {
		const getColor = async () => {
			if (checkUrl(userById?.user?.avatar_url)) {
				const url = userById?.user?.avatar_url;
				const colorImg = await getColorAverageFromURL(url || '');
				if (colorImg) setColor(colorImg);
			}
		};

		getColor();
	}, [userById?.user?.avatar_url]);

	useOnClickOutside(userProfileRef, () => onClose?.());

	const handleOpenEditOption = useCallback(() => {
		setIsOPenEditOption(!isOPenEditOption);
	}, [isOPenEditOption]);

	useOnClickOutside(panelRef, () => setIsOPenEditOption(false));

	const handleKeydownESC = useCallback(() => {
		if (isOPenEditOption) {
			setIsOPenEditOption(false);
		} else if (onClose) {
			onClose();
		}
	}, [isOPenEditOption]);

	const handleOpenUserProfileSetting = () => {
		setIsShowSettingFooterInitTab(EUserSettings.PROFILES);
		setIsShowSettingProfileInitTab(EActiveType.USER_SETTING);
		setIsShowSettingFooterStatus(true);
		if (onClose) {
			onClose();
		}
	};

	const handleOpenClanProfileSetting = () => {
		setIsUserProfile(false);
		setIsShowSettingFooterInitTab(EUserSettings.PROFILES);
		setIsShowSettingProfileInitTab(EActiveType.CLAN_SETTING);
		setClanIdSettingProfile(currentClanId || '');
		setIsShowSettingFooterStatus(true);
		if (onClose) {
			onClose();
		}
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, handleKeydownESC);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="outline-none w-[100vw] h-[100vh] fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center text-theme-primary"
		>
			<div
				ref={userProfileRef}
				className="w-[600px] h-[90vh] bg-theme-setting-primary rounded-lg flex-col justify-start items-start inline-flex"
			>
				<div
					className={`relative flex justify-end w-full h-[210px] rounded-t-md ${!color && 'dark:bg-bgAvatarDark bg-bgAvatarLight'}`}
					style={{ backgroundColor: color }}
					onClick={() => setGroupIconBanner(initOpenModal)}
				>
					<div className={`rounded-tl-lg rounded-tr-lg h-[60px]  flex justify-end gap-x-2 p-2 `}>
						<GroupIconBanner
							checkAddFriend={checkAddFriend}
							openModal={openGroupIconBanner}
							setOpenModal={setGroupIconBanner}
							user={userById as ChannelMembersEntity}
						/>
					</div>
					<div className="flex absolute bottom-[-60px] w-full">
						<AvatarProfile
							avatar={avatar || displayAvatar}
							username={displayUsername || notify?.content?.username}
							userToDisplay={userById}
							customStatus={customStatus || (userStatus.user_status as string)}
							userID={userId}
							statusOnline={userStatus?.status}
							styleAvatar="w-[120px] h-[120px] rounded-full"
						/>
						{isSelf ? (
							<div className="flex items-end pr-4">
								<button
									onClick={handleOpenEditOption}
									className="relative flex items-center h-8 px-4 rounded-[3px] text-theme-primary text-theme-primary-hover"
								>
									<Icons.PenEdit />
									<span className="text-sm font-semibold one-line text-theme-primary-active">{t('userProfile.editProfile')}</span>
								</button>
								{isOPenEditOption && (
									<div
										ref={panelRef}
										className={`absolute left-[calc(100%_+_10px)] top-[38px] bg-theme-setting-primary rounded-sm p-2 z-[1] mr-2 w-fit shadow-lg outline-none`}
									>
										{modeResponsive === ModeResponsive.MODE_CLAN && (
											<ItemPanel children={t('userProfile.editClanProfile')} onClick={handleOpenClanProfileSetting} />
										)}
										<ItemPanel children={t('userProfile.editMainProfile')} onClick={handleOpenUserProfileSetting} />
									</div>
								)}
							</div>
						) : null}
					</div>
				</div>
				<div className="bg-theme-contexify pt-[60px] pb-4 px-4 rounded-b-md w-full flex-1">
					<div className="flex flex-col gap-3 h-full">
						<div className="mt-4">
							<h3 className="text-2xl font-semibold text-theme-primary">
								{name || userById?.clan_nick || userById?.user?.display_name || userById?.user?.username || notify?.content?.username}
							</h3>
							<p className="text-sm font-normal text-theme-primary">
								{usernameAva || userById?.user?.username || notify?.content?.username}
							</p>
						</div>
						<div className="flex-1 bg-theme-setting-primary rounded-lg shadow-shadowInbox">
							<ProfileTabs activeTab={activeTab} onActiveTabChange={handleActiveTabChange} />
							<div className="p-4 text-theme-primary	">
								{activeTab === typeTab.ABOUT_ME && <AboutMe createTime={userById?.user?.create_time} />}
								{activeTab === typeTab.ACTIVITY && <Activity />}
								{activeTab === typeTab.MUTUAL_FRIENDS && <MutualFriends />}
								{activeTab === typeTab.MUTUAL_SERVERS && <MutualServers />}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserProfileModalInner;
