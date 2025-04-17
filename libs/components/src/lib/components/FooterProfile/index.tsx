import { useAuth, useDirect, useSendInviteMessage, useSettingFooter } from '@mezon/core';
import {
	ChannelsEntity,
	TOKEN_FAILED_STATUS,
	TOKEN_SUCCESS_STATUS,
	channelMembersActions,
	giveCoffeeActions,
	selectAccountCustomStatus,
	selectCurrentClanId,
	selectInfoSendToken,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectIsJoin,
	selectShowModalCustomStatus,
	selectShowModalSendToken,
	selectStatusMenu,
	selectTheme,
	selectUpdateToken,
	selectVoiceJoined,
	useAppDispatch,
	userClanProfileActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ESummaryInfo, EUserStatus, ONE_MINUTE, TypeMessage, createImgproxyUrl, formatMoney } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIcon } from '../MemberProfile';
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
	const currentClanId = useSelector(selectCurrentClanId);
	const showModalCustomStatus = useSelector(selectShowModalCustomStatus);
	const showModalSendToken = useSelector(selectShowModalSendToken);
	const infoSendToken = useSelector(selectInfoSendToken);
	const appearanceTheme = useSelector(selectTheme);
	const userStatusProfile = useSelector(selectAccountCustomStatus);
	const myProfile = useAuth();
	const getTokenSocket = useSelector(selectUpdateToken(myProfile?.userId as string));

	const userCustomStatus: { status: string; user_status: EUserStatus } = useMemo(() => {
		const metadata = myProfile.userProfile?.user?.metadata;
		try {
			return safeJSONParse(metadata || '{}') || '';
		} catch (e) {
			const unescapedJSON = metadata?.replace(/\\./g, (match) => {
				switch (match) {
					case '\\"':
						return '"';
					default:
						return match[1];
				}
			});
			return safeJSONParse(unescapedJSON || '{}')?.status;
		}
	}, [myProfile]);
	const [customStatus, setCustomStatus] = useState<string>(userCustomStatus.status ?? '');
	const [token, setToken] = useState<number>(0);
	const [selectedUserId, setSelectedUserId] = useState<string>('');
	const [note, setNote] = useState<string>('Transfer funds');
	const [extraAttribute, setExtraAttribute] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [userSearchError, setUserSearchError] = useState<string | null>(null);
	const [resetTimerStatus, setResetTimerStatus] = useState<number>(0);
	const [noClearStatus, setNoClearStatus] = useState<boolean>(false);
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

	const isMe = userId === myProfile?.userId;

	const tokenInWallet = useMemo(() => {
		return myProfile?.userProfile?.wallet ? safeJSONParse(myProfile?.userProfile?.wallet)?.value : 0;
	}, [myProfile?.userProfile?.wallet]);

	const handleCloseModalCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
		setCustomStatus(userCustomStatus.status ?? '');
	};

	const { setIsShowSettingFooterStatus } = useSettingFooter();
	const openSetting = () => {
		setIsShowSettingFooterStatus(true);
	};

	const handleSaveCustomStatus = () => {
		dispatch(
			channelMembersActions.updateCustomStatus({
				clanId: currentClanId ?? '',
				customStatus: customStatus,
				minutes: resetTimerStatus,
				noClear: noClearStatus
			})
		);
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
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
		async (userId: string, tokenValue: number, note: string, username?: string, avatar?: string) => {
			const response = await createDirectMessageWithUser(userId, username, avatar);
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

	const handleSaveSendToken = async (id: string, username?: string, avatar?: string) => {
		const userId = selectedUserId !== '' ? selectedUserId : id;
		if (userId === '') {
			setUserSearchError('Please select a user');
			return;
		}
		if (token <= 0) {
			setError('Your amount must be greater than zero');
			return;
		}

		if (token > Number(tokenInWallet) + Number(getTokenSocket)) {
			setError('Your amount exceeds wallet balance');
			return;
		}
		const tokenEvent: ApiTokenSentEvent = {
			sender_id: myProfile.userId as string,
			sender_name: myProfile?.userProfile?.user?.username as string,
			receiver_id: userId,
			amount: token,
			note: note,
			extra_attribute: infoSendToken?.extra_attribute ?? extraAttribute
		};

		setIsButtonDisabled(true);
		try {
			await dispatch(giveCoffeeActions.sendToken(tokenEvent)).unwrap();
			dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent: tokenEvent, status: TOKEN_SUCCESS_STATUS }));
			await sendNotificationMessage(userId, token, note ?? '', username, avatar);
		} catch (err) {
			dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent: tokenEvent, status: TOKEN_FAILED_STATUS }));
		}
		handleCloseModalSendToken();
	};

	const handleClosePopup = () => {
		dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent: null, status: TOKEN_FAILED_STATUS }));
		handleCloseModalSendToken();
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
	}, [showModalSendToken]);

	const rootRef = useRef<HTMLDivElement>(null);

	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const isInCall = useSelector(selectIsInCall);
	const isJoin = useSelector(selectIsJoin);
	const isVoiceJoined = useSelector(selectVoiceJoined);
	const statusMenu = useSelector(selectStatusMenu);

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
					onCloseModal={closeProfileModal}
				/>
			</div>
		);
	}, [userStatusProfile, rootRef.current]);

	return (
		<div
			className={`fixed bottom-0 left-[72px] min-h-14 w-widthChannelList z-10 ${statusMenu ? '!w-[calc(100vw_-_72px)] sbm:!w-widthChannelList' : 'hidden'} sbm:block `}
			id="clan-footer"
		>
			{isInCall && <StreamInfo type={ESummaryInfo.CALL} />}
			{isJoin && <StreamInfo type={ESummaryInfo.STREAM} />}
			{isVoiceJoined && <VoiceInfo />}
			{(isElectronUpdateAvailable || IsElectronDownloading) && <UpdateButton isDownloading={!isElectronUpdateAvailable} />}
			<div
				className={`flex items-center gap-2 pr-4 pl-2 py-2 font-title text-[15px]
			 font-[500] text-white hover:bg-gray-550/[0.16]
			 shadow-sm transition dark:bg-bgSecondary600 bg-channelTextareaLight
			 w-full group focus-visible:outline-none footer-profile ${appearanceTheme === 'light' && 'lightMode'}`}
			>
				<div
					className={`footer-profile h-10 flex-1 flex pl-2 items-center dark:hover:bg-bgHoverMember hover:bg-bgLightSecondary rounded-md ${appearanceTheme === 'light' && 'lightMode'}`}
				>
					<div className="cursor-pointer flex items-center gap-3 relative " onClick={openProfileModal}>
						<AvatarImage
							alt={''}
							username={name}
							className="min-w-8 min-h-8 max-w-8 max-h-8"
							classNameText="font-semibold"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
						<div className="absolute bottom-1 left-6">
							<UserStatusIcon status={userCustomStatus?.user_status} />
						</div>
						<div className="flex flex-col dark:text-contentSecondary text-colorTextLightMode  ">
							<p className="text-base font-medium max-w-40 truncate dark:text-contentSecondary text-black">{name}</p>
							<p className="text-[11px] text-left line-clamp-1 leading-[14px] truncate max-w-40">{customStatus}</p>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Icons.MicIcon className="ml-auto w-[18px] h-[18px] opacity-80 text-[#f00] dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton hidden" />
					<Icons.HeadPhoneICon className="ml-auto w-[18px] h-[18px] opacity-80 dark:text-[#AEAEAE] text-black  dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton hidden" />
					<div
						onClick={openSetting}
						className="cursor-pointer ml-auto p-1 group/setting opacity-80 dark:text-textIconFooterProfile text-black dark:hover:bg-bgDarkFooterProfile hover:bg-bgLightModeButton hover:rounded-md"
					>
						<Icons.SettingProfile className="w-5 h-5 group-hover/setting:rotate-180 duration-500" />
					</div>
				</div>
			</div>
			{showModalCustomStatus && (
				<ModalCustomStatus
					setCustomStatus={setCustomStatus}
					customStatus={userCustomStatus.status || ''}
					handleSaveCustomStatus={handleSaveCustomStatus}
					name={name}
					openModal={showModalCustomStatus}
					onClose={handleCloseModalCustomStatus}
					setNoClearStatus={setNoClearStatus}
					setResetTimerStatus={setResetTimerStatus}
				/>
			)}
			{showModalSendToken && (
				<ModalSendToken
					setToken={setToken}
					token={token}
					selectedUserId={selectedUserId}
					handleSaveSendToken={handleSaveSendToken}
					openModal={showModalSendToken}
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
				/>
			)}
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
