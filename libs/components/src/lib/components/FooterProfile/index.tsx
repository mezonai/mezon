import { useAuth, useDirect, useMemberCustomStatus, useSendInviteMessage, useSettingFooter } from '@mezon/core';
import {
	ChannelsEntity,
	TOKEN_FAILED_STATUS,
	TOKEN_SUCCESS_STATUS,
	channelMembersActions,
	giveCoffeeActions,
	selectAccountCustomStatus,
	selectCurrentClanId,
	selectInfoSendToken,
	selectShowModalCustomStatus,
	selectShowModalFooterProfile,
	selectShowModalSendToken,
	selectTheme,
	selectUpdateToken,
	useAppDispatch,
	userClanProfileActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MemberProfileType, TypeMessage, formatMoney } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../MemberProfile';
import ModalCustomStatus from '../ModalUserProfile/StatusProfile/ModalCustomStatus';
import ModalSendToken from '../ModalUserProfile/StatusProfile/ModalSendToken';
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
	const showModalFooterProfile = useSelector(selectShowModalFooterProfile);
	const showModalCustomStatus = useSelector(selectShowModalCustomStatus);
	const showModalSendToken = useSelector(selectShowModalSendToken);
	const infoSendToken = useSelector(selectInfoSendToken);
	const appearanceTheme = useSelector(selectTheme);
	const userStatusProfile = useSelector(selectAccountCustomStatus);
	const myProfile = useAuth();
	const getTokenSocket = useSelector(selectUpdateToken(myProfile?.userId as string));

	const userCustomStatus = useMemberCustomStatus(userId || '', isDM);
	const [customStatus, setCustomStatus] = useState<string>(userCustomStatus ?? '');
	const [token, setToken] = useState<number>(0);
	const [selectedUserId, setSelectedUserId] = useState<string>('');
	const [note, setNote] = useState<string>('send token');
	const [extraAttribute, setExtraAttribute] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [userSearchError, setUserSearchError] = useState<string | null>(null);
	const [resetTimerStatus, setResetTimerStatus] = useState<number>(0);
	const [noClearStatus, setNoClearStatus] = useState<boolean>(false);
	const [isInputDisabled, setIsInputDisabled] = useState<boolean>(false);

	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const isMe = userId === myProfile?.userId;

	const tokenInWallet = useMemo(() => {
		return myProfile?.userProfile?.wallet ? safeJSONParse(myProfile?.userProfile?.wallet)?.value : 0;
	}, [myProfile?.userProfile?.wallet]);

	const handleClickFooterProfile = () => {
		dispatch(userClanProfileActions.setShowModalFooterProfile(!showModalFooterProfile));
	};

	const handleCloseModalCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
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
		handleCloseModalCustomStatus();
	};

	const handleCloseModalSendToken = () => {
		setToken(0);
		setSelectedUserId('');
		setNote('send token');
		setUserSearchError('');
		setError('');
		setIsInputDisabled(false);
		dispatch(giveCoffeeActions.setShowModalSendToken(false));
	};

	const sendNotificationMessage = useCallback(
		async (userId: string, tokenValue: number, note: string) => {
			const response = await createDirectMessageWithUser(userId);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(`Tokens sent: ${formatMoney(tokenValue)}₫ | ${note}`, response.channel_id, channelMode, TypeMessage.SendToken);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage]
	);

	const handleSaveSendToken = async (id: string) => {
		const userId = selectedUserId !== '' ? selectedUserId : id;
		if (userId === '') {
			setUserSearchError('Please select a user');
			return;
		}
		if (token <= 0) {
			setError('Token amount must be greater than zero');
			return;
		}

		if (token > Number(tokenInWallet) + Number(getTokenSocket)) {
			setError('Token amount exceeds wallet balance');
			return;
		}
		const tokenEvent: ApiTokenSentEvent = {
			sender_id: myProfile.userId as string,
			sender_name: myProfile?.userProfile?.user?.username as string,
			receiver_id: infoSendToken?.receiver_id ?? userId,
			amount: token,
			note: note,
			extra_attribute: infoSendToken?.extra_attribute ?? extraAttribute
		};

		try {
			await dispatch(giveCoffeeActions.sendToken(tokenEvent)).unwrap();
			dispatch(giveCoffeeActions.setSendTokenEvent({ tokenEvent: tokenEvent, status: TOKEN_SUCCESS_STATUS }));
			await sendNotificationMessage(infoSendToken?.receiver_id ?? userId, token, note ?? '');
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
			setNote(infoSendToken.note ?? 'send token');
			setExtraAttribute(infoSendToken.extra_attribute ?? '');
			setIsInputDisabled(infoSendToken.amount !== 0);
			const timer = setTimeout(() => {
				handleClosePopup();
			}, 10000);

			return () => clearTimeout(timer);
		}
	}, [showModalSendToken]);

	const rootRef = useRef<HTMLDivElement>(null);

	return (
		<>
			<div
				ref={rootRef}
				className={`flex items-center justify-between px-4 py-2 font-title text-[15px]
			 font-[500] text-white hover:bg-gray-550/[0.16]
			 shadow-sm transition dark:bg-bgSecondary600 bg-channelTextareaLight
			 w-full group focus-visible:outline-none footer-profile ${appearanceTheme === 'light' && 'lightMode'}`}
			>
				<div className={`footer-profile min-w-[142px] ${appearanceTheme === 'light' && 'lightMode'}`} onClick={handleClickFooterProfile}>
					<div className="cursor-pointer">
						<MemberProfile
							name={name}
							status={{ status: isMe ? true : status, isMobile: false }}
							avatar={avatar}
							isHideStatus={false}
							classParent="memberProfile"
							positionType={MemberProfileType.FOOTER_PROFILE}
							customStatus={userStatusProfile}
						/>
					</div>
					{showModalFooterProfile && (
						<ModalFooterProfile
							userId={userId ?? ''}
							avatar={avatar}
							name={name}
							isDM={isDM}
							userStatusProfile={userStatusProfile}
							rootRef={rootRef}
						/>
					)}
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
					customStatus={userCustomStatus || ''}
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
					isInputDisabled={isInputDisabled}
				/>
			)}
		</>
	);
}

export default memo(FooterProfile);
