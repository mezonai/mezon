// eslint-disable-next-line @nx/enforce-module-boundaries
import { useChatSending, useIdleRender, useMenu } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	DirectEntity,
	RootState,
	appActions,
	audioCallActions,
	directActions,
	pinMessageActions,
	selectCloseMenu,
	selectCurrentDM,
	selectDmGroupCurrent,
	selectIsInCall,
	selectIsShowMemberListDM,
	selectIsShowPinBadgeByDmId,
	selectIsUseProfileDM,
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
import Tippy from '@tippy.js/react';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useSelector } from 'react-redux';
import { HelpButton } from '../../ChannelTopbar';
import PinnedMessages from '../../ChannelTopbar/TopBarComponents/PinnedMessages';
import { MemberProfile } from '../../MemberProfile';
import SearchMessageChannel from '../../SearchMessageChannel';
import CreateMessageGroup from '../CreateMessageGroup';
import LabelDm from './labelDm';

export type ChannelTopbarProps = {
	readonly dmGroupId?: Readonly<string>;
	isHaveCallInChannel?: boolean;
};

// Todo: move to utils
export const compress = async (str: string, encoding = 'gzip' as CompressionFormat) => {
	const byteArray = new TextEncoder().encode(str);
	const cs = new CompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();
	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
};

// Todo: move to utils
export const decompress = async (compressedStr: string, encoding = 'gzip' as CompressionFormat) => {
	const binaryString = atob(compressedStr);
	const byteArray = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}

	const cs = new DecompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();

	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return new TextDecoder().decode(arrayBuffer);
};

function DmTopbar({ dmGroupId, isHaveCallInChannel = false }: ChannelTopbarProps) {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));

	const metadata = useMemo(() => {
		if (typeof currentDmGroup.metadata?.at(0) === 'string') {
			try {
				return safeJSONParse(currentDmGroup.metadata?.at(0) || '');
			} catch (error) {
				console.error('Error parsing JSON:', currentDmGroup.metadata?.at(0), error);
			}
		} else if (typeof currentDmGroup.metadata?.at(0) === 'object') {
			return currentDmGroup.metadata?.at(0);
		}
	}, [currentDmGroup.metadata]);

	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const appearanceTheme = useSelector(selectTheme);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const sessionUser = useSelector((state: RootState) => state.auth.session);
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

	const shouldRender = useIdleRender();

	if (!shouldRender) return null;

	return (
		<>
			{/* {!isHaveCallInChannel && ( */}
			<div
				className={`flex h-heightTopBar p-3 min-w-0 items-center dark:bg-bgPrimary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink ${isMacDesktop ? 'draggable-area' : ''}`}
			>
				<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
					<div className={`flex flex-row gap-1 items-center flex-1 ${isMacDesktop ? 'app-region-drag' : ''}`}>
						<div onClick={() => setStatusMenu(true)} className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
							<Icons.OpenMenu defaultSize={`w-5 h-5`} />
						</div>
						<MemberProfile
							numberCharacterCollapse={22}
							avatar={
								Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP
									? 'assets/images/avatar-group.png'
									: (currentDmGroup?.channel_avatar?.at(0) ?? '')
							}
							name={currentDmGroup?.usernames || `${currentDmGroup?.creator_name}'s Group`}
							status={{ status: currentDmGroup?.is_online?.some(Boolean), isMobile: false }}
							isHideStatus={true}
							isHideIconStatus={Boolean(currentDmGroup?.user_id && currentDmGroup.user_id.length >= 2)}
							key={currentDmGroup?.channel_id}
							isHiddenAvatarPanel={true}
							metaDataDM={metadata}
						/>
						<LabelDm dmGroupId={dmGroupId || ''} currentDmGroup={currentDmGroup} />
					</div>

					<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
						<div className=" items-center gap-2 flex">
							<div className="justify-start items-center gap-[15px] flex">
								<button onClick={() => handleStartCall()}>
									<Tippy content="Start voice call" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
										<span>
											<Icons.IconPhoneDM
												className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`}
											/>
										</span>
									</Tippy>
								</button>
								<button onClick={() => handleStartCall(true)}>
									<Tippy content="Start Video Call" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
										<span>
											<Icons.IconMeetDM
												className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`}
											/>
										</span>
									</Tippy>
								</button>
								<div>
									<PinButton isLightMode={isLightMode} />
								</div>
								<AddMemberToGroupDm currentDmGroup={currentDmGroup} appearanceTheme={appearanceTheme} />
								{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
									<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
										<Tippy content="Show Member List" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
											<span>
												<Icons.MemberList isWhite={isShowMemberListDM} />
											</span>
										</Tippy>
									</button>
								)}
								{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
									<button onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
										<Tippy content="Show User Profile" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
											<span>
												<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
											</span>
										</Tippy>
									</button>
								)}
							</div>
							<SearchMessageChannel
								mode={
									currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
										? ChannelStreamMode.STREAM_MODE_DM
										: ChannelStreamMode.STREAM_MODE_GROUP
								}
							/>
							<div
								className={`gap-4 relative flex  w-fit h-8 justify-center items-center left-[345px] ssm:left-auto ssm:right-0`}
								id="inBox"
							>
								{/* <InboxButton /> */}
								<HelpButton />
							</div>
						</div>
					</div>
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
						<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
							<Tippy content="Show Member List" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
								<span>
									<Icons.MemberList isWhite={isShowMemberListDM} />
								</span>
							</Tippy>
						</button>
					)}
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
						<button onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
							<Tippy content="Show User Profile" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
								<span>
									<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
								</span>
							</Tippy>
						</button>
					)}
				</div>
			</div>
			{/* )
			} */}
			{/* <DmCalling ref={dmCallingRef} dmGroupId={dmGroupId} /> */}
		</>
	);
}

function PinButton({ isLightMode }: { isLightMode: boolean }) {
	const dispatch = useAppDispatch();
	const currentDm = useSelector(selectCurrentDM);
	const isShowPinBadge = useAppSelector((state) => selectIsShowPinBadgeByDmId(state, currentDm?.id as string));

	const [isShowPinMessage, setIsShowPinMessage] = useState<boolean>(false);
	const threadRef = useRef<HTMLDivElement>(null);

	const handleShowPinMessage = async () => {
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentDm?.id as string }));
		setIsShowPinMessage(!isShowPinMessage);
		if (isShowPinBadge) {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: currentDm?.id as string, isShow: false }));
		}
	};

	const handleClose = useCallback(() => {
		setIsShowPinMessage(false);
	}, []);

	return (
		<div className="relative leading-5 size-6" ref={threadRef}>
			<Tippy className={`${isShowPinMessage && 'hidden'} w-[142px] ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`} content="Pinned Messages">
				<div>
					<button className="focus-visible:outline-none relative" onClick={handleShowPinMessage} onContextMenu={(e) => e.preventDefault()}>
						<Icons.PinRight isWhite={isShowPinMessage} />
						{isShowPinBadge && (
							<div className="bg-red-500 size-2 absolute rounded-full bottom-0 right-0 border-[3px] dark:border-bgPrimary border-bgLightPrimary box-content" />
						)}
					</button>
				</div>
			</Tippy>
			{isShowPinMessage && <PinnedMessages onClose={handleClose} rootRef={threadRef} />}
		</div>
	);
}

const AddMemberToGroupDm = ({ currentDmGroup, appearanceTheme }: { currentDmGroup: DirectEntity; appearanceTheme: string }) => {
	const [openAddToGroup, setOpenAddToGroup] = useState<boolean>(false);
	const handleOpenAddToGroupModal = () => {
		setOpenAddToGroup(!openAddToGroup);
	};
	const rootRef = useRef<HTMLDivElement>(null);
	const isLightMode = appearanceTheme === 'light';
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
			<Tippy content="Add friends to DM" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
				<span>
					<Icons.IconAddFriendDM />
				</span>
			</Tippy>
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
