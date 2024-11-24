import { useAuth, useMenu } from '@mezon/core';
import {
	DMCallActions,
	audioCallActions,
	selectAudioDialTone,
	selectCloseMenu,
	selectDmGroupCurrent,
	selectIsInCall,
	selectIsMuteMicrophone,
	selectIsShowMeetDM,
	selectIsShowShareScreen,
	selectSignalingDataByUserId,
	selectStatusMenu,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Icons } from '@mezon/ui';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AvatarImage } from '@mezon/components';
import { useWebRTCCall } from '@mezon/core';
import { createImgproxyUrl, isMacDesktop, sleep } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../MemberProfile';
import LabelDm from './labelDm';

type DmCallingProps = {
	readonly dmGroupId?: Readonly<string>;
};
const DmCalling = forwardRef<{ triggerCall: (isVideoCall?: boolean) => void }, DmCallingProps>(({ dmGroupId }, ref) => {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));
	const { setStatusMenu } = useMenu();
	const { userId } = useAuth();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const avatarImages = currentDmGroup?.channel_avatar || [];
	const isMuteMicrophone = useSelector(selectIsMuteMicrophone);
	const isShowShareScreen = useSelector(selectIsShowShareScreen);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isInCall = useSelector(selectIsInCall);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const dmUserId = currentDmGroup?.user_id && currentDmGroup.user_id.length > 0 ? currentDmGroup?.user_id[0] : '';
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));

	const isInChannelCalled = useMemo(() => {
		return currentDmGroup?.user_id?.some((i) => i === signalingData?.[0]?.callerId);
	}, [currentDmGroup?.user_id, signalingData]);

	const { callState, startCall, handleEndCall, toggleAudio, toggleVideo, handleSignalingMessage, localVideoRef, remoteVideoRef } = useWebRTCCall(
		dmUserId,
		dmGroupId as string,
		userId as string
	);

	useEffect(() => {
		if (callState.peerConnection && signalingData?.[signalingData?.length - 1]?.signalingData?.data_type === 4) {
			handleEndCall();
		}
		if (signalingData?.[signalingData?.length - 1] && isInCall && isInChannelCalled) {
			const data = signalingData?.[signalingData?.length - 1]?.signalingData;
			handleSignalingMessage(data);
		}
	}, [callState.peerConnection, isInCall, isInChannelCalled, signalingData]);

	useImperativeHandle(ref, () => ({
		triggerCall
	}));

	const handleShowShareScreenToggle = () => {
		dispatch(DMCallActions.setIsShowShareScreen(!isShowShareScreen));
	};

	const handleMuteToggle = () => {
		toggleAudio();
		dispatch(DMCallActions.setIsMuteMicrophone(!isMuteMicrophone));
	};

	const triggerCall = useCallback(
		async (isVideoCall = false) => {
			dispatch(audioCallActions.setIsDialTone(true));

			onStartCall({ isVideoCall });
		},
		[dispatch]
	);

	const onStartCall = async ({ isVideoCall = false }) => {
		dispatch(DMCallActions.setIsInCall(true));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));
		await sleep(1000);
		await startCall(isVideoCall);
	};

	const handleCloseCall = async () => {
		await handleEndCall();
		dispatch(DMCallActions.setIsInCall(false));
		dispatch(DMCallActions.removeAll());
		handleMuteSound();
	};

	const handleMuteSound = () => {
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsDialTone(false));
	};

	if (!isInCall && !isInChannelCalled) return <div />;

	return (
		<div
			className={`${!isInChannelCalled && !isPlayDialTone ? '-z-50 opacity-0 hidden' : ''} flex flex-col ${!isShowMeetDM ? 'min-h-[240px]' : 'max-h-[510px]'} z-10 relative w-full p-3 min-w-0 items-center dark:bg-bgTertiary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink ${isMacDesktop ? 'draggable-area' : ''}`}
		>
			<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
				<div className="flex flex-row gap-1 items-center flex-1">
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
					/>
					<LabelDm dmGroupId={dmGroupId || ''} currentDmGroup={currentDmGroup} />
				</div>
			</div>
			<div className={`flex justify-between space-x-4 ${!isShowMeetDM ? 'h-[0px] -z-10 opacity-0' : 'z-10 mb-5 mt-5'}`}>
				{/* Local Video */}
				<video
					ref={localVideoRef}
					autoPlay
					muted
					playsInline
					style={{
						width: '400px',
						height: '300px',
						backgroundColor: 'black',
						borderRadius: '8px'
					}}
				/>
				{/* Remote Video */}
				<video
					ref={remoteVideoRef}
					autoPlay
					playsInline
					style={{
						width: '400px',
						height: '300px',
						backgroundColor: 'black',
						borderRadius: '8px'
					}}
				/>
			</div>
			<div className="w-full h-full flex flex-col justify-around">
				{!isShowMeetDM && (
					<div className="justify-center items-center gap-4 flex w-full">
						{avatarImages.map((avatar, index) => (
							<AvatarImage
								height={'75px'}
								alt={`Avatar ${index + 1}`}
								userName={`Avatar ${index + 1}`}
								className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
								srcImgProxy={createImgproxyUrl(avatar ?? '', {
									width: 300,
									height: 300,
									resizeType: 'fit'
								})}
								src={avatar}
								classNameText="!text-4xl font-semibold"
							/>
						))}
					</div>
				)}
				<div className="justify-center items-center gap-4 flex w-full">
					{!isInCall ? (
						<>
							<div
								className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: true })}
							>
								<Icons.IconMeetDM />
							</div>
							<div
								className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: false })}
							>
								<Icons.IconPhoneDM />
							</div>
							<div
								onClick={handleCloseCall}
								className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
							>
								<Icons.CloseButton className={`w-[20px]`} />
							</div>
						</>
					) : (
						<div className="h-[556px] ">
							<div className="flex flex-row space-x-4 justify-center mt-10">
								<div
									className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer  ${!isShowMeetDM ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
									onClick={toggleVideo}
								>
									<Icons.IconMeetDM
										className={`${!isShowMeetDM ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
										isShowMeetDM={!isShowMeetDM}
										isShowLine={true}
									/>
								</div>
								<div
									className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer  ${isShowShareScreen ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
									onClick={handleShowShareScreenToggle}
								>
									<Icons.ShareScreen
										className={`${isShowShareScreen ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
										isShowShareScreen={isShowShareScreen}
										isShowLine={true}
									/>
								</div>
								<div
									className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer ${isMuteMicrophone ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
									onClick={handleMuteToggle}
								>
									<Icons.Microphone
										className={`${isMuteMicrophone ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
										isMuteMicrophone={isMuteMicrophone}
										isShowLine={true}
									/>
								</div>
								<div
									className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
									onClick={handleCloseCall}
								>
									<Icons.StopCall />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export default DmCalling;
