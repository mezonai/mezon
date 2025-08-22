import { useMenu } from '@mezon/core';
import {
	DMCallActions,
	audioCallActions,
	selectAllAccount,
	selectAudioBusyTone,
	selectAudioDialTone,
	selectCloseMenu,
	selectDmGroupCurrent,
	selectIsInCall,
	selectIsMuteMicrophone,
	selectIsShowMeetDM,
	selectIsShowShareScreen,
	selectJoinedCall,
	selectOtherCall,
	selectRemoteAudio,
	selectRemoteVideo,
	selectSignalingDataByUserId,
	selectStatusMenu,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Icons, Menu } from '@mezon/ui';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AvatarImage } from '@mezon/components';
import { useWebRTCCall } from '@mezon/core';
import { IMessageTypeCallLog, createImgproxyUrl, sleep } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import { ReactElement, forwardRef, memo, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import DeviceSelector from './DeviceSelector';

type DmCallingProps = {
	readonly dmGroupId?: Readonly<string>;
	directId: string;
};

// DmCalling check later
const DmCalling = forwardRef<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }, DmCallingProps>(({ dmGroupId, directId }, ref) => {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));
	const { setStatusMenu } = useMenu();
	const userProfile = useSelector(selectAllAccount);
	const userId = useMemo(() => userProfile?.user?.id, [userProfile]);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const avatarImages = currentDmGroup?.channel_avatar || [];
	const nameImages = currentDmGroup?.display_names || [];
	const isMuteMicrophone = useSelector(selectIsMuteMicrophone);
	const isShowShareScreen = useSelector(selectIsShowShareScreen);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isInCall = useSelector(selectIsInCall);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const dmUserId = currentDmGroup?.user_id && currentDmGroup.user_id.length > 0 ? currentDmGroup?.user_id[0] : '';
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const isRemoteAudio = useSelector(selectRemoteAudio);
	const isRemoteVideo = useSelector(selectRemoteVideo);
	const [activeVideo, setActiveVideo] = useState<'local' | 'remote' | null>(null);
	const isJoinedCall = useSelector(selectJoinedCall);
	const otherCall = useSelector(selectOtherCall);
	const isInChannelCalled = useMemo(() => {
		const isSignalDataOffer = signalingData?.[0]?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER;
		if (!isSignalDataOffer && !isInCall) {
			return false;
		}
		return currentDmGroup?.user_id?.some((i) => i === signalingData?.[0]?.callerId);
	}, [currentDmGroup?.user_id, isInCall, signalingData]);

	const {
		timeStartConnected,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		handleSignalingMessage,
		handleOtherCall,
		localVideoRef,
		remoteVideoRef,
		changeAudioInputDevice,
		changeAudioOutputDevice,
		currentInputDevice,
		currentOutputDevice,
		audioInputDevicesList,
		audioOutputDevicesList
	} = useWebRTCCall({
		dmUserId,
		channelId: dmGroupId as string,
		userId: userId as string,
		callerName: userProfile?.user?.username as string,
		callerAvatar: userProfile?.user?.avatar_url as string,
		isInChannelCalled: isInChannelCalled as boolean
	});

	useEffect(() => {
		if (isJoinedCall && !isInCall) {
			dispatch(DMCallActions.setIsInCall(false));
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(DMCallActions.removeAll());
		}
	}, [dispatch, isInCall, isJoinedCall]);

	useEffect(() => {
		if (otherCall?.caller_id && otherCall?.channel_id) {
			handleOtherCall(otherCall?.caller_id, otherCall?.channel_id);
		}
	}, [otherCall]);

	useEffect(() => {
		if (isPlayBusyTone) {
			dispatch(toastActions.addToast({ message: `${currentDmGroup.usernames} on another call`, type: 'warning', autoClose: 3000 }));
			handleEndCall(true);
		}
	}, [isPlayBusyTone]);

	useEffect(() => {
		const lastSignalingData = signalingData?.[signalingData.length - 1]?.signalingData;

		if (lastSignalingData && (isInCall || lastSignalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_QUIT)) {
			handleSignalingMessage(lastSignalingData);
		}
	}, [isInCall, signalingData]);

	useImperativeHandle(ref, () => ({
		triggerCall
	}));

	const handleMuteToggle = () => {
		toggleAudio();
		dispatch(DMCallActions.setIsMuteMicrophone(!isMuteMicrophone));
	};

	const triggerCall = (isVideoCall = false, isAnswer = false) => {
		if (!isAnswer) {
			dispatch(audioCallActions.setIsDialTone(true));
			dispatch(audioCallActions.setIsEndTone(false));
		}
		onStartCall({ isVideoCall, isAnswer });
	};

	const onStartCall = async ({ isVideoCall = false, isAnswer = false }) => {
		dispatch(DMCallActions.setIsInCall(true));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));
		await sleep(1000);
		await startCall(isVideoCall, isAnswer);
	};

	const handleCloseCall = async () => {
		if (!timeStartConnected.current) {
			await dispatch(
				DMCallActions.updateCallLog({
					channelId: dmGroupId || '',
					content: {
						t: '',
						callLog: {
							isVideo: isShowMeetDM,
							callLogType: IMessageTypeCallLog.CANCELCALL
						}
					}
				})
			);
		}
		await handleEndCall();
		dispatch(DMCallActions.setIsInCall(false));
		dispatch(DMCallActions.removeAll());
		handleMuteSound();
		dispatch(audioCallActions.startDmCall({}));
		dispatch(audioCallActions.setUserCallId(''));
	};

	const handleMuteSound = () => {
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsDialTone(false));
	};

	useEffect(() => {
		if (!isInCall || (!isShowMeetDM && !isRemoteVideo)) {
			setActiveVideo(null);
		}
	}, [isInCall, isRemoteVideo, isShowMeetDM]);

	const menuDevice = useMemo(() => {
		const menuItems: ReactElement[] = [
			<DeviceSelector
				deviceList={audioOutputDevicesList}
				currentDevice={currentOutputDevice}
				icon={<Icons.Speaker defaultFill={'text-white ml-2'} />}
				onSelectDevice={changeAudioOutputDevice}
			/>,

			<DeviceSelector
				deviceList={audioInputDevicesList}
				currentDevice={currentInputDevice}
				icon={<Icons.MicEnable className={'h-5 w-5 text-white ml-2'} />}
				onSelectDevice={changeAudioInputDevice}
			/>
		];
		return <>{menuItems}</>;
	}, [audioOutputDevicesList, audioInputDevicesList]);

	if (!isInCall && !isInChannelCalled) return <div />;

	return (
		<div
			className={`${
				(!isInChannelCalled && !isPlayDialTone) || dmGroupId !== directId || isPlayBusyTone ? '-z-50 opacity-0 hidden' : ''
			} flex flex-col group right-0 fixed w-widthThumnailAttachment  ${!isShowMeetDM && !isRemoteVideo ? 'h-[240px] min-h-[240px]' : 'h-[510px] max-h-[510px]'} z-10 w-full p-3 min-w-0 items-center dark:bg-bgTertiary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink`}
		>
			<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
				<div className="flex flex-row gap-1 items-center flex-1">
					<div onClick={() => setStatusMenu(true)} className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
						<Icons.OpenMenu defaultSize={`w-5 h-5`} />
					</div>
				</div>
			</div>

			<div
				className={`flex ${activeVideo === 'local' || activeVideo === 'remote' ? 'relative w-full h-[calc(100%_-_32px)] justify-center' : 'flex justify-center items-center h-full'} space-x-4 ${!isShowMeetDM && !isRemoteVideo ? 'hidden -z-10 opacity-0' : `${activeVideo === 'local' || activeVideo === 'remote' ? '' : 'z-10 mb-5 mt-5'}`}`}
			>
				{/* Local Video */}
				<div
					className={`${activeVideo === 'remote' ? 'absolute z-10 right-0 bottom-0' : `${activeVideo === 'local' ? 'relative w-fit' : 'relative w-full'}`} `}
				>
					<video
						ref={localVideoRef}
						autoPlay
						muted
						playsInline
						onClick={() => setActiveVideo(activeVideo === 'local' || activeVideo === 'remote' ? null : 'local')}
						style={{
							width: activeVideo === 'local' ? '100%' : activeVideo === 'remote' ? '200px' : '400px',
							height: activeVideo === 'local' ? '100%' : activeVideo === 'remote' ? '150px' : '300px',
							backgroundColor: 'black',
							borderRadius: '8px',
							display: !isShowMeetDM && !isRemoteVideo ? 'none' : 'block'
						}}
					/>
					<div
						className={`flex gap-6 items-center justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${!isShowMeetDM ? 'w-full h-full bg-black rounded-lg' : ''} `}
					>
						{!isShowMeetDM && (
							<div className=" flex flex-col items-center">
								<Icons.IconMeetDM
									className={`${!isShowMeetDM ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
									isShowMeetDM={!isShowMeetDM}
									isShowLine={true}
								/>
							</div>
						)}

						{isMuteMicrophone && (
							<div className="flex flex-col items-center">
								<Icons.Microphone
									className={`${isMuteMicrophone ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
									isMuteMicrophone={isMuteMicrophone}
									isShowLine={true}
								/>
							</div>
						)}
					</div>
				</div>
				{/* Remote Video */}
				<div
					className={`${activeVideo === 'local' ? 'absolute z-10 right-0 bottom-0' : `${activeVideo === 'remote' ? 'relative w-fit' : 'relative w-full'}`}`}
				>
					<div className="relative w-full h-full">
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							onClick={() => setActiveVideo(activeVideo === 'local' || activeVideo === 'remote' ? null : 'remote')}
							style={{
								width: activeVideo === 'remote' ? '100%' : activeVideo === 'local' ? '200px' : '400px',
								height: activeVideo === 'remote' ? '100%' : activeVideo === 'local' ? '150px' : '300px',
								backgroundColor: 'black',
								borderRadius: '8px',
								display: !isShowMeetDM && !isRemoteVideo ? 'none' : 'block'
							}}
						/>
						<div
							className={`flex gap-6 items-center justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${!isRemoteVideo ? 'w-full h-full bg-black rounded-lg' : ''} `}
						>
							{!isRemoteVideo && (
								<div className="flex flex-col items-center">
									<Icons.IconMeetDM
										className={`${!isRemoteVideo ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
										isShowMeetDM={!isRemoteVideo}
										isShowLine={true}
									/>
								</div>
							)}

							{!isRemoteAudio && (
								<div className="flex flex-col items-center">
									<Icons.Microphone
										className={`${!isRemoteAudio ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
										isMuteMicrophone={!isRemoteAudio}
										isShowLine={true}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div
				className={`${isShowMeetDM || isRemoteVideo ? 'absolute w-fit h-fit bottom-5 z-50 left-1/2 transform -translate-x-1/2 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300' : 'w-full h-full'} flex flex-col justify-around`}
			>
				{!isShowMeetDM && !isRemoteVideo && (
					<div className="justify-center items-center gap-4 flex w-full">
						{avatarImages.map((avatar, index) => (
							<AvatarImage
								key={index}
								height={'75px'}
								alt={`Avatar ${index + 1}`}
								username={nameImages[index] ? nameImages[index] : `Avatar ${index + 1}`}
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
						<div className="justify-center items-center gap-4 flex w-full">
							<div
								className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: true, isAnswer: true })}
							>
								<Icons.IconMeetDM />
							</div>
							<div
								className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: false, isAnswer: true })}
							>
								<Icons.IconPhoneDM />
							</div>
							<div
								onClick={handleCloseCall}
								className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
							>
								<Icons.CloseButton className={`w-[20px]`} />
							</div>
						</div>
					) : (
						<div className="flex flex-row space-x-4 justify-center">
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
								className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer ${isMuteMicrophone ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
								onClick={handleMuteToggle}
							>
								<Icons.Microphone
									className={`${isMuteMicrophone ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
									isMuteMicrophone={isMuteMicrophone}
									isShowLine={true}
								/>
							</div>

							<Menu menu={menuDevice} className={'rounded-3xl'}>
								<div className="h-[56px] w-[56px] relative rounded-full flex items-center justify-center cursor-pointer dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary">
									<Icons.ThreeDot className="text-white dark:text-bgTertiary" />
								</div>
							</Menu>
							<div
								className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
								onClick={handleCloseCall}
							>
								<Icons.StopCall className="size-6 text-white-600" />
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export default memo(DmCalling);
