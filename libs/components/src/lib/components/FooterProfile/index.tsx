import { useAuth, useIdleRender, useMemberCustomStatus, useSettingFooter } from '@mezon/core';
import {
	ChannelsEntity,
	channelMembersActions,
	giveCoffeeActions,
	selectAccountCustomStatus,
	selectCurrentClanId,
	selectShowModalCustomStatus,
	selectShowModalFooterProfile,
	selectShowModalSendToken,
	selectTheme,
	selectUpdateToken,
	useAppDispatch,
	userClanProfileActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MemberProfileType, useLongPress } from '@mezon/utils';
import Tippy from '@tippy.js/react';
import { safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MicButton } from '../ChannelTopbar/TopBarComponents/SFUButton/MicIcon';
import { MemberProfile } from '../MemberProfile';
import ModalCustomStatus from '../ModalUserProfile/StatusProfile/ModalCustomStatus';
import ModalSendToken from '../ModalUserProfile/StatusProfile/ModalSendToken';
import { usePushToTalk } from '../SFU/SFUContext';
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
	const appearanceTheme = useSelector(selectTheme);
	const userStatusProfile = useSelector(selectAccountCustomStatus);
	const myProfile = useAuth();
	const getTokenSocket = useSelector(selectUpdateToken(myProfile?.userId as string));

	const userCustomStatus = useMemberCustomStatus(userId || '', isDM);
	const [customStatus, setCustomStatus] = useState<string>(userCustomStatus ?? '');
	const [token, setToken] = useState<number>(0);
	const [selectedUserId, setSelectedUserId] = useState<string>('');
	const [note, setNote] = useState<string>('send token');
	const [error, setError] = useState<string | null>(null);
	const [userSearchError, setUserSearchError] = useState<string | null>(null);

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
		dispatch(channelMembersActions.updateCustomStatus({ clanId: currentClanId ?? '', customStatus: customStatus }));
		handleCloseModalCustomStatus();
	};

	const handleCloseModalSendToken = () => {
		setToken(0);
		setSelectedUserId('');
		setNote('send token');
		dispatch(giveCoffeeActions.setShowModalSendToken(false));
	};

	const handleSaveSendToken = () => {
		if (!selectedUserId) {
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
			receiver_id: selectedUserId,
			amount: token,
			note: note
		};

		dispatch(giveCoffeeActions.sendToken(tokenEvent));
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

	const rootRef = useRef<HTMLDivElement>(null);

	const shouldRender = useIdleRender();

	if (!shouldRender) return <></>;

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
				<SFUControls />
				<div className="flex items-center gap-2">
					<Icons.MicIcon className="ml-auto w-[18px] h-[18px] opacity-80 text-[#f00] dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton hidden" />
					<Icons.HeadPhoneICon className="ml-auto w-[18px] h-[18px] opacity-80 dark:text-[#AEAEAE] text-black  dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton hidden" />
					<Tippy content="Settings" className={` ${appearanceTheme === 'light' ? 'tooltipLightMode' : 'tooltip'}`}>
						<div
							onClick={openSetting}
							className="cursor-pointer ml-auto p-1 group/setting opacity-80 dark:text-textIconFooterProfile text-black dark:hover:bg-bgDarkFooterProfile hover:bg-bgLightModeButton hover:rounded-md"
						>
							<Icons.SettingProfile className="w-5 h-5 group-hover/setting:rotate-180 duration-500" />
						</div>
					</Tippy>
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
				/>
			)}
			{showModalSendToken && (
				<ModalSendToken
					setToken={setToken}
					token={token}
					selectedUserId={selectedUserId}
					handleSaveSendToken={handleSaveSendToken}
					openModal={showModalSendToken}
					onClose={handleCloseModalSendToken}
					setSelectedUserId={setSelectedUserId}
					setNote={setNote}
					error={error}
					userSearchError={userSearchError}
					userId={myProfile.userId as string}
					note={note}
				/>
			)}
		</>
	);
}

export function SFUControls() {
	const { isJoined, isTalking, toggleTalking, quitSFU } = usePushToTalk();
	const appearanceTheme = useSelector(selectTheme);

	const longPressHandlers = useLongPress<HTMLDivElement>({
		onStart: () => toggleTalking(true),
		onFinish: () => toggleTalking(false)
	});

	if (!isJoined) return null;

	return (
		<>
			<Tippy content="Quit SFU" className={`${appearanceTheme === 'light' ? 'tooltipLightMode' : 'tooltip'}`}>
				<span>
					<Icons.LeaveSFU
						onClick={quitSFU}
						className="cursor-pointer size-6 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode"
					/>
				</span>
			</Tippy>

			<div {...longPressHandlers}>
				<MicButton isTalking={isTalking} />
			</div>
		</>
	);
}

export default memo(FooterProfile);
