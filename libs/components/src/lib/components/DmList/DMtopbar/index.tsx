// eslint-disable-next-line @nx/enforce-module-boundaries
import { useChatSending, useMenu } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	DirectEntity,
	appActions,
	audioCallActions,
	directActions,
	pinMessageActions,
	selectCloseMenu,
	selectCurrentDM,
	selectDmGroupCurrent,
	selectIsInCall,
	selectIsPinModalVisible,
	selectIsShowMemberListDM,
	selectIsShowPinBadgeByDmId,
	selectIsUseProfileDM,
	selectSession,
	selectStatusMenu,
	selectTheme,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Icons } from '@mezon/ui';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { IMessageSendPayload, IMessageTypeCallLog, isMacDesktop } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useSelector } from 'react-redux';
import PinnedMessages from '../../ChannelTopbar/TopBarComponents/PinnedMessages';
import CreateMessageGroup from '../CreateMessageGroup';

export type ChannelTopbarProps = {
	readonly dmGroupId?: Readonly<string>;
	isHaveCallInChannel?: boolean;
};

function DmTopbar({ dmGroupId, isHaveCallInChannel = false }: ChannelTopbarProps) {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));

	const metadata = useMemo(() => {
		if (typeof currentDmGroup?.metadata?.at(0) === 'string') {
			try {
				return safeJSONParse(currentDmGroup?.metadata?.at(0) || '');
			} catch (error) {
				console.error('Error parsing JSON:', currentDmGroup?.metadata?.at(0), error);
			}
		} else if (typeof currentDmGroup?.metadata?.at(0) === 'object') {
			return currentDmGroup?.metadata?.at(0);
		}
	}, [currentDmGroup?.metadata]);

	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const appearanceTheme = useSelector(selectTheme);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const sessionUser = useSelector(selectSession);
	const isInCall = useSelector(selectIsInCall);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (sessionUser) {
				sendMessage(content, mentions, attachments, references);
			} else {
				console.error('Session is not available');
			}
		},
		[sendMessage, sessionUser]
	);

	const setIsUseProfileDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsUseProfileDM(status));
		},
		[dispatch]
	);

	const setIsShowMemberListDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsShowMemberListDM(status));
		},
		[dispatch]
	);

	const handleStartCall = (isVideoCall = false) => {
		if (!isInCall) {
			handleSend({ t: ``, callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.STARTCALL } }, [], [], []);
			dispatch(audioCallActions.startDmCall({ groupId: dmGroupId, isVideo: isVideoCall }));
			dispatch(audioCallActions.setGroupCallId(dmGroupId));
			dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_id?.[0]));
			dispatch(audioCallActions.setIsBusyTone(false));
		} else {
			dispatch(toastActions.addToast({ message: 'You are on another call', type: 'warning', autoClose: 3000 }));
		}
	};

	const isLightMode = appearanceTheme === 'light';

	return (
		<>
			<div
				className={`flex h-heightTopBar p-3 min-w-0 items-center dark:bg-bgPrimary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink ${isMacDesktop ? 'draggable-area' : ''}`}
			>
				<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
					<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
						<div className="justify-start items-center gap-[15px] flex">
							<button title="Start voice call" onClick={() => handleStartCall()}>
								<span>
									<Icons.IconPhoneDM
										className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`}
									/>
								</span>
							</button>
							<button title="Start Video Call" onClick={() => handleStartCall(true)}>
								<span>
									<Icons.IconMeetDM
										className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`}
									/>
								</span>
							</button>
							<div>
								<PinButton mode={mode} isLightMode={isLightMode} />
							</div>
							<AddMemberToGroupDm currentDmGroup={currentDmGroup} appearanceTheme={appearanceTheme} />
							{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
								<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
									<span>
										<Icons.MemberList isWhite={isShowMemberListDM} />
									</span>
								</button>
							)}
							{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
								<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
									<span>
										<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
									</span>
								</button>
							)}
						</div>
					</div>
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
						<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
							<span>
								<Icons.MemberList isWhite={isShowMemberListDM} />
							</span>
						</button>
					)}
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
						<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
							<span>
								<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
							</span>
						</button>
					)}
				</div>
			</div>
		</>
	);
}

function PinButton({ isLightMode, mode }: { isLightMode: boolean; mode?: number }) {
	const dispatch = useAppDispatch();
	const currentDm = useSelector(selectCurrentDM);
	const isShowPinBadge = useAppSelector((state) => selectIsShowPinBadgeByDmId(state, currentDm?.id as string));
	const isShowPinMessage = useSelector(selectIsPinModalVisible);
	const threadRef = useRef<HTMLDivElement>(null);

	const handleShowPinMessage = async () => {
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentDm?.id as string }));
		dispatch(pinMessageActions.togglePinModal());
		if (isShowPinBadge) {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: currentDm?.id as string, isShow: false }));
		}
	};

	return (
		<div className="relative leading-5 size-6" ref={threadRef}>
			<button
				title="Pinned Messages"
				className="focus-visible:outline-none relative"
				onClick={handleShowPinMessage}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.PinRight isWhite={isShowPinMessage} />
				{isShowPinBadge && (
					<div className="bg-red-500 size-2 absolute rounded-full bottom-0 right-0 border-[3px] dark:border-bgPrimary border-bgLightPrimary box-content" />
				)}
			</button>
			{isShowPinMessage && <PinnedMessages mode={mode} onClose={handleShowPinMessage} rootRef={threadRef} />}
		</div>
	);
}

export const AddMemberToGroupDm = ({ currentDmGroup, appearanceTheme }: { currentDmGroup: DirectEntity; appearanceTheme: string }) => {
	const [openAddToGroup, setOpenAddToGroup] = useState<boolean>(false);
	const handleOpenAddToGroupModal = () => {
		setOpenAddToGroup(!openAddToGroup);
	};
	const rootRef = useRef<HTMLDivElement>(null);
	return (
		<div onClick={handleOpenAddToGroupModal} ref={rootRef} className="cursor-pointer">
			{openAddToGroup && (
				<div className="relative top-4">
					<CreateMessageGroup
						currentDM={currentDmGroup}
						isOpen={openAddToGroup}
						onClose={handleOpenAddToGroupModal}
						classNames="right-0 left-auto"
						rootRef={rootRef}
					/>
				</div>
			)}
			<span title="Add friends to DM">
				<Icons.IconAddFriendDM />
			</span>
		</div>
	);
};

DmTopbar.Skeleton = () => {
	return (
		<div className="flex  h-heightTopBar min-w-0 items-center bg-bgSecondary border-b border-black px-3 pt-4 pb-6 flex-shrink">
			<Skeleton width={38} height={38} />
		</div>
	);
};

export default DmTopbar;
