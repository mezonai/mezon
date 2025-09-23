import { useAuth, useDirect, useSendInviteMessage, useSettingFooter } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import {
	TOKEN_FAILED_STATUS,
	TOKEN_SUCCESS_STATUS,
	authActions,
	giveCoffeeActions,
	selectAccountCustomStatus,
	selectGroupCallJoined,
	selectInfoSendToken,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectIsJoin,
	selectShowModalCustomStatus,
	selectShowModalSendToken,
	selectStatusMenu,
	selectVoiceJoined,
	useAppDispatch,
	userClanProfileActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { EUserStatus } from '@mezon/utils';
import { ESummaryInfo, ONE_MINUTE, TypeMessage, createImgproxyUrl, formatMoney, generateE2eId, saveParseUserStatus } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIconDM } from '../MemberProfile';
import ModalCustomStatus from '../ModalUserProfile/StatusProfile/ModalCustomStatus';
import ModalSendToken from '../ModalUserProfile/StatusProfile/ModalSendToken';
import StreamInfo from '../StreamInfo';
import UpdateButton from '../UpdateButton/UpdateButton';
import { VoiceInfo } from '../VoiceChannel';
import ModalFooterProfile from './ModalFooterProfile';

export type FooterProfileProps = {
	name: string;
	status?: boolean;
	avatar: string;
	userId?: string;
	channelCurrent?: ChannelsEntity | null;
	isDM: boolean;
};

function FooterProfile({ name, status, avatar, userId, isDM }: FooterProfileProps) {
	const dispatch = useAppDispatch();
	const showModalCustomStatus = useSelector(selectShowModalCustomStatus);
	const showModalSendToken = useSelector(selectShowModalSendToken);
	const infoSendToken = useSelector(selectInfoSendToken);
	const userStatusProfile = useSelector(selectAccountCustomStatus);
	const statusMenu = useSelector(selectStatusMenu);
	const myProfile = useAuth();
	const { t } = useTranslation(['setting']);
	const userCustomStatus: { status: string; user_status: EUserStatus } = useMemo(() => {
		const metadata = myProfile.userProfile?.user?.metadata;
		return saveParseUserStatus(metadata || '');
	}, [myProfile, myProfile.userProfile?.user?.metadata]);
	const [token, setToken] = useState<number>(0);
	const [selectedUserId, setSelectedUserId] = useState<string>('');
	const [note, setNote] = useState<string>('Transfer funds');
	const [extraAttribute, setExtraAttribute] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [userSearchError, setUserSearchError] = useState<string | null>(null);
	const [sendTokenInputsState, setSendTokenInputsState] = useState<{
		isSendTokenInputDisabled: boolean;
		isUserSelectionDisabled: boolean;
	}>({
		isSendTokenInputDisabled: false,
		isUserSelectionDisabled: false
	});
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);

	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const tokenInWallet = useMemo(() => {
		return myProfile?.userProfile?.wallet ? myProfile?.userProfile?.wallet : 0;
	}, [myProfile?.userProfile?.wallet]);

	const handleCloseModalCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
		closeSetCustomStatus();
	};

	const { setIsShowSettingFooterStatus, setIsUserProfile } = useSettingFooter();
	const openSetting = () => {
		setIsUserProfile(true);
		setIsShowSettingFooterStatus(true);
	};

	const handleCloseModalSendToken = () => {
		setIsButtonDisabled(false);
		setToken(0);
		setSelectedUserId('');
		setNote('transfer funds');
		setUserSearchError('');
		setError('');
		setSendTokenInputsState({ isSendTokenInputDisabled: false, isUserSelectionDisabled: false });
		dispatch(giveCoffeeActions.setShowModalSendToken(false));
		dispatch(giveCoffeeActions.setInfoSendToken(null));
	};

	const sendNotificationMessage = useCallback(
		async (userId: string, tokenValue: number, note: string, username?: string, avatar?: string, display_name?: string) => {
			const response = await createDirectMessageWithUser(userId, display_name, username, avatar);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Funds Transferred: ${formatMoney(tokenValue)}₫ | ${note}`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage]
	);

	const handleSaveSendToken = async (id?: string, username?: string, avatar?: string, display_name?: string) => {
		const userId = selectedUserId !== '' ? selectedUserId : id;
		if (userId === '') {
			setUserSearchError('Please select a user');
			return;
		}
		if (token <= 0) {
			setError('Your amount must be greater than zero');
			return;
		}

		if (token > Number(tokenInWallet)) {
			setError('Your amount exceeds wallet balance');
			return;
		}
		const tokenEvent: ApiTokenSentEvent = {
			sender_id: myProfile.userId as string,
			sender_name: myProfile?.userProfile?.user?.username as string,
			receiver_id: userId,
			amount: token,
			note,
			extra_attribute: infoSendToken?.extra_attribute ?? extraAttribute
		};

		setIsButtonDisabled(true);
		try {
			await dispatch(giveCoffeeActions.sendToken(tokenEvent)).unwrap();
			dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent, status: TOKEN_SUCCESS_STATUS }));
			if (id) {
				await sendNotificationMessage(id, token, note ?? '', username, avatar, display_name);
			}
		} catch (err) {
			dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent, status: TOKEN_FAILED_STATUS }));
		}
		handleCloseModalSendToken();
	};

	const handleClosePopup = () => {
		dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent: null, status: TOKEN_FAILED_STATUS }));
		handleCloseModalSendToken();
		closeModalSendToken();
	};

	const loadParamsSendTokenFromURL = () => {
		const params = new URLSearchParams(window.location.search);
		const openPopup = params.get('openPopup') === 'true';
		if (!openPopup) return;

		const tokenParam = params.get('token');
		const userIdParam = params.get('userId');
		const noteParam = params.get('note');

		if (tokenParam) setToken(Number(tokenParam));
		if (userIdParam) setSelectedUserId(userIdParam);
		if (noteParam) setNote(noteParam);

		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	useEffect(() => {
		loadParamsSendTokenFromURL();
		dispatch(authActions.checkFormatSession());
	}, []);

	useEffect(() => {
		if (showModalSendToken && infoSendToken) {
			setToken(infoSendToken.amount ?? 0);
			setSelectedUserId(infoSendToken.receiver_id ?? '');
			setNote(infoSendToken.note ?? 'Transfer funds');
			setExtraAttribute(infoSendToken.extra_attribute ?? '');
			setSendTokenInputsState({
				isSendTokenInputDisabled: infoSendToken.amount !== 0,
				isUserSelectionDisabled: infoSendToken.receiver_id !== ''
			});
			const timer = setTimeout(() => {
				handleClosePopup();
			}, ONE_MINUTE);

			return () => clearTimeout(timer);
		}
	}, [showModalSendToken, infoSendToken]);

	const rootRef = useRef<HTMLDivElement>(null);
	const modalControlRef = useRef<HTMLDivElement>(null);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const isInCall = useSelector(selectIsInCall);
	const isJoin = useSelector(selectIsJoin);
	const isVoiceJoined = useSelector(selectVoiceJoined);
	const GroupCallJoined = useSelector(selectGroupCallJoined);

	const [showProfile, setShowProfile] = useState(false);

	const [openProfileModal, closeProfileModal] = useModal(() => {
		return (
			<div ref={rootRef}>
				<ModalFooterProfile
					userId={userId ?? ''}
					avatar={avatar}
					name={name}
					isDM={isDM}
					userStatusProfile={userStatusProfile}
					rootRef={rootRef}
					modalControlRef={modalControlRef}
					onCloseModal={() => {
						setShowProfile(false);
						closeProfileModal();
					}}
				/>
			</div>
		);
	}, [userStatusProfile, rootRef.current, avatar, name, modalControlRef]);

	const handleClick = () => {
		if (!showProfile) {
			setShowProfile(true);
			openProfileModal();
		} else {
			setShowProfile(false);
			closeProfileModal();
		}
	};
	const [openSetCustomStatus, closeSetCustomStatus] = useModal(() => {
		return <ModalCustomStatus status={userCustomStatus.status || ''} name={name} onClose={handleCloseModalCustomStatus} />;
	}, [userCustomStatus.status]);

	const [openModalSendToken, closeModalSendToken] = useModal(() => {
		return (
			<ModalSendToken
				setToken={setToken}
				token={token}
				selectedUserId={selectedUserId}
				handleSaveSendToken={handleSaveSendToken}
				onClose={handleClosePopup}
				setSelectedUserId={setSelectedUserId}
				setNote={setNote}
				error={error}
				userSearchError={userSearchError}
				userId={myProfile.userId as string}
				note={note}
				sendTokenInputsState={sendTokenInputsState}
				infoSendToken={infoSendToken}
				isButtonDisabled={isButtonDisabled}
				tokenInWallet={tokenInWallet}
			/>
		);
	}, [token, selectedUserId, note, infoSendToken, isButtonDisabled, sendTokenInputsState, myProfile.userId, tokenInWallet]);

	useEffect(() => {
		if (showModalCustomStatus) {
			openSetCustomStatus();
			return;
		}
		if (showModalSendToken) {
			openModalSendToken();
		} else {
			closeModalSendToken();
		}
	}, [closeModalSendToken, openModalSendToken, openSetCustomStatus, showModalCustomStatus, showModalSendToken]);

	return (
		<div
			className={`fixed md:bottom-3 bottom-0 md:left-[12px] left-[72px] border-theme-primary md:rounded-xl shadow-lg bg-theme-surface min-h-14 w-widthChannelList md:w-widthProfile z-10 overflow-hidden ${statusMenu ? '!w-[calc(100vw_-_72px)] sbm:!w-widthProfile' : 'hidden'} sbm:block `}
			id="clan-footer"
		>
			{isInCall && <StreamInfo type={ESummaryInfo.CALL} />}
			{isJoin && <StreamInfo type={ESummaryInfo.STREAM} />}
			{(isVoiceJoined || GroupCallJoined) && <VoiceInfo />}
			{(isElectronUpdateAvailable || IsElectronDownloading) && <UpdateButton isDownloading={!isElectronUpdateAvailable} />}
			<div
				className={`flex items-center gap-2 pr-4 pl-2 py-2 font-title text-[15px]
			 font-[500]
			  transition
			 w-full group focus-visible:outline-none footer-profile  `}
			>
				<div className={`footer-profile h-10 flex-1 flex pl-2 items-center  text-theme-primary bg-item-hover rounded-md`}>
					<div ref={modalControlRef} className="cursor-pointer flex items-center gap-3 relative flex-1" onClick={handleClick}>
						<AvatarImage
							alt={''}
							username={name}
							className="min-w-8 min-h-8 max-w-8 max-h-8 flex-shrink-0"
							classNameText="font-semibold"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
						<div className="absolute bottom-0 left-0 w-[32px] h-[32px] ">
							<UserStatusIconDM status={userCustomStatus?.user_status} />
						</div>
						<div className="flex flex-col overflow-hidden flex-1">
							<p className="text-sm font-medium truncate max-w-[150px] max-sbm:max-w-[100px] text-theme-secondary">{name}</p>
							<p className="text-[11px] text-left line-clamp-1 leading-[14px] truncate max-w-[150px] max-sbm:max-w-[100px]">
								{userCustomStatus.status}
							</p>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Icons.MicIcon className="ml-auto w-[18px] h-[18px] opacity-80 text-[#f00] bg-item-hover hidden" />
					<Icons.HeadPhoneICon className="ml-auto w-[18px] h-[18px] opacity-80 text-theme-primary  bg-item-hover hidden" />
					<div
						onClick={openSetting}
						className="cursor-pointer ml-auto p-1 group/setting opacity-80  text-theme-primary bg-item-hover hover:rounded-md "
						data-e2e={generateE2eId(`user_setting.profile.button_setting`)}
						title={t('setting')}
					>
						<Icons.SettingProfile className="w-5 h-5  group-hover/setting:rotate-180 duration-500" />
					</div>
				</div>
			</div>
		</div>
	);
}

export default memo(FooterProfile, (prevProps, nextProps) => {
	return (
		prevProps.name === nextProps.name &&
		prevProps.status === nextProps.status &&
		prevProps.avatar === nextProps.avatar &&
		prevProps.userId === nextProps.userId &&
		prevProps.isDM === nextProps.isDM
	);
});
