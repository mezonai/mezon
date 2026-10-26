import { useMenu, useWebRTCCall } from '@mezon/core';
import {
	DMCallActions,
	audioCallActions,
	selectAllAccount,
	selectAudioBusyTone,
	selectAudioDialTone,
	selectCloseMenu,
	selectDmGroupById,
	selectIsInCall,
	selectIsMuteMicrophone,
	selectIsShowMeetDM,
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
import { IMessageTypeCallLog, createImgproxyUrl, ensureMediaPermission, useMediaPermissions } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import type { RefObject } from 'react';
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';

type DmCallingProps = {
	readonly dmGroupId?: Readonly<string>;
	directId: string;
};

type VideoTileKey = 'local' | 'remote';

function dmCallingDeviceMenuSubtitle(device: MediaDeviceInfo | null, systemDefaultLabel: string): string {
	if (!device) return '';
	const label = device.label?.trim();
	if (label) return label;
	if (device.deviceId === 'default') return systemDefaultLabel;
	return '';
}

const MediaPermissionBadge = () => (
	<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
		<span className="text-black text-xs font-bold">!</span>
	</div>
);

const DmCalling = forwardRef<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }, DmCallingProps>(({ dmGroupId, directId }, ref) => {
	const dispatch = useAppDispatch();
	const { t, i18n } = useTranslation('channelVoice');
	const currentDmGroup = useSelector((state) => selectDmGroupById(state, dmGroupId ?? ''));
	const { setStatusMenu } = useMenu();
	const userProfile = useSelector(selectAllAccount);
	const userId = useMemo(() => userProfile?.user?.id, [userProfile]);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const avatarImages = currentDmGroup?.avatars || [];
	const nameImages = currentDmGroup?.usernames || [];
	const isMuteMicrophone = useSelector(selectIsMuteMicrophone);
	const { hasMicrophoneAccess, hasCameraAccess, microphonePermissionState } = useMediaPermissions();
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isInCall = useSelector(selectIsInCall);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const dmUserId = currentDmGroup?.user_ids && currentDmGroup.user_ids.length > 0 ? currentDmGroup?.user_ids[0] : '';
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const isRemoteAudio = useSelector(selectRemoteAudio);
	const isRemoteVideo = useSelector(selectRemoteVideo);
	const [activeVideo, setActiveVideo] = useState<VideoTileKey | null>(null);
	const isJoinedCall = useSelector(selectJoinedCall);
	const otherCall = useSelector(selectOtherCall);
	const isInChannelCalled = useMemo(() => {
		const isSignalDataOffer = signalingData?.[0]?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER;
		if (!isSignalDataOffer && !isInCall) {
			return false;
		}
		return currentDmGroup?.user_ids?.some((i) => i === signalingData?.[0]?.callerId);
	}, [currentDmGroup?.user_ids, isInCall, signalingData]);

	const {
		peerConnection,
		timeStartConnected,
		isMyCaller,
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
			dispatch(toastActions.addToast({ message: `${currentDmGroup?.usernames} on another call`, type: 'warning', autoClose: 3000 }));
			handleEndCall(true);
		}
	}, [isPlayBusyTone]);

	useEffect(() => {
		const lastSignalingData = signalingData?.[signalingData.length - 1]?.signalingData;

		if (lastSignalingData && (isInCall || lastSignalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_QUIT)) {
			handleSignalingMessage(lastSignalingData);
		}
	}, [isInCall, signalingData]);

	useEffect(() => {
		if (!isInCall && peerConnection.current) {
			handleEndCall(true);
		}
	}, [isInCall]);

	useImperativeHandle(ref, () => ({
		triggerCall
	}));

	const handleMuteToggle = () => {
		if (microphonePermissionState === 'denied') {
			void ensureMediaPermission('microphone');
			return;
		}
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
		if (!isAnswer) dispatch(DMCallActions.setIsInCall(true));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));

		await startCall(isVideoCall, isAnswer);
	};

	const handleCloseCall = async () => {
		if (!timeStartConnected.current && isMyCaller?.current) {
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
		dispatch(audioCallActions.startDmCall(null));
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

	useEffect(() => {
		if (!activeVideo) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setActiveVideo(null);
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [activeVideo]);

	const handleTileClick = (tile: VideoTileKey) => {
		setActiveVideo((current) => (current === tile ? null : tile));
	};

	const [expandedDevice, setExpandedDevice] = useState<'input' | 'output' | null>(null);
	const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

	const systemDefaultLabel = t('device.systemDefault');

	const menuDevice = useMemo(() => {
		const flyoutPanelBase =
			'z-50 rounded-lg bg-neutral-900 border border-neutral-700 overflow-hidden min-w-[280px] overflow-y-auto shadow-lg ' +
			'absolute left-full top-0 ml-1 ' +
			'max-sbm:static max-sbm:left-auto max-sbm:top-auto max-sbm:ml-0 max-sbm:mt-0 max-sbm:min-w-0 max-sbm:w-full max-sbm:max-h-[min(40vh,280px)] max-sbm:rounded-none max-sbm:border-x-0 max-sbm:border-b-0 max-sbm:shadow-none';

		return (
			<div className="relative inline-block">
				<div className="rounded-lg bg-neutral-800 border border-neutral-700 w-[220px] overflow-visible">
					<div className="relative border-b border-neutral-700">
						<div
							className={`px-4 py-3 hover:bg-neutral-700 cursor-pointer flex gap-3 justify-between items-center transition-colors duration-200 ${expandedDevice === 'input' ? 'bg-neutral-700' : ''}`}
							onClick={() => setExpandedDevice(expandedDevice === 'input' ? null : 'input')}
						>
							<div className="flex flex-col flex-1 min-w-0 justify-start">
								<div className="text-white font-medium text-sm">{t('device.inputDevice')}</div>
								<div className="text-neutral-400 text-xs truncate overflow-hidden whitespace-nowrap">
									{dmCallingDeviceMenuSubtitle(currentInputDevice, systemDefaultLabel)}
								</div>
							</div>
							<Icons.ArrowRight defaultSize={'w-4 h-4'} defaultFill1={'rgba(249,249,249,1)'} />
						</div>
						{expandedDevice === 'input' && (
							<div className={`${flyoutPanelBase} max-h-[320px]`}>
								{audioInputDevicesList.map((device) => (
									<div
										key={device.deviceId}
										className={`px-4 py-2.5 hover:bg-neutral-700 cursor-pointer text-sm transition-colors duration-200 flex items-center gap-2 ${device.deviceId === currentInputDevice?.deviceId ? 'text-blue-400 bg-neutral-700' : 'text-white'}`}
										onClick={() => {
											changeAudioInputDevice(device.deviceId);
											setExpandedDevice(null);
										}}
									>
										{device.deviceId === currentInputDevice?.deviceId && <Icons.Check defaultSize="w-4 h-4" />}
										<div className="flex flex-col flex-1 min-w-0">
											<span className="truncate overflow-hidden whitespace-nowrap">{device.label || '\u200b'}</span>
											{device.deviceId === 'default' && !device.label?.trim() && (
												<span className="text-neutral-400 text-xs">{systemDefaultLabel}</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="relative">
						<div
							className={`px-4 py-3 hover:bg-neutral-700 cursor-pointer flex gap-3 justify-between items-center transition-colors duration-200 ${expandedDevice === 'output' ? 'bg-neutral-700' : ''}`}
							onClick={() => setExpandedDevice(expandedDevice === 'output' ? null : 'output')}
						>
							<div className="flex flex-col flex-1 min-w-0 justify-start">
								<div className="text-white font-medium text-sm">{t('device.outputDevice')}</div>
								<div className="text-neutral-400 text-xs truncate overflow-hidden whitespace-nowrap">
									{dmCallingDeviceMenuSubtitle(currentOutputDevice, systemDefaultLabel)}
								</div>
							</div>
							<Icons.ArrowRight defaultSize={'w-4 h-4'} defaultFill1={'rgba(249,249,249,1)'} />
						</div>
						{expandedDevice === 'output' && (
							<div className={`${flyoutPanelBase} max-h-[360px]`}>
								{audioOutputDevicesList.map((device) => (
									<div
										key={device.deviceId}
										className={`px-4 py-2.5 hover:bg-neutral-700 cursor-pointer text-sm transition-colors duration-200 flex items-center gap-2 ${device.deviceId === currentOutputDevice?.deviceId ? 'text-blue-400 bg-neutral-700' : 'text-white'}`}
										onClick={() => {
											changeAudioOutputDevice(device.deviceId);
											setExpandedDevice(null);
										}}
									>
										{device.deviceId === currentOutputDevice?.deviceId && <Icons.Check defaultSize="w-4 h-4" />}
										<div className="flex flex-col flex-1 min-w-0">
											<span className="truncate overflow-hidden whitespace-nowrap">{device.label || '\u200b'}</span>
											{device.deviceId === 'default' && !device.label?.trim() && (
												<span className="text-neutral-400 text-xs">{systemDefaultLabel}</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}, [
		i18n.language,
		systemDefaultLabel,
		currentInputDevice,
		currentOutputDevice,
		expandedDevice,
		audioInputDevicesList,
		audioOutputDevicesList,
		changeAudioInputDevice,
		changeAudioOutputDevice
	]);

	const localDisplayName = userProfile?.user?.display_name || userProfile?.user?.username || '';
	const remoteDisplayName = currentDmGroup?.channel_label || nameImages[0] || '';

	const renderVideoTile = ({
		tile,
		videoRef,
		isLocal,
		hasVideo,
		isMicMuted,
		avatar,
		label,
		avatarName
	}: {
		tile: VideoTileKey;
		videoRef: RefObject<HTMLVideoElement>;
		isLocal: boolean;
		hasVideo: boolean;
		isMicMuted: boolean;
		avatar?: string;
		label: string;
		avatarName: string;
	}) => {
		const mode = !activeVideo ? 'grid' : activeVideo === tile ? 'main' : 'pip';
		const layoutClass =
			mode === 'main'
				? 'absolute inset-0'
				: mode === 'pip'
					? 'absolute top-3 right-3 z-20 w-[200px] max-sbm:w-[120px] aspect-video shadow-xl'
					: 'relative w-full max-w-[640px] max-h-full aspect-video max-sbm:max-w-none max-sbm:aspect-auto max-sbm:flex-1 max-sbm:min-h-0';
		const avatarClass = mode === 'main' ? '!size-28' : mode === 'pip' ? '!size-10' : '!size-20';
		const avatarTextClass = mode === 'main' ? '!text-5xl' : mode === 'pip' ? '!text-base' : '!text-3xl';
		const actionLabel = mode === 'main' ? t('dmCall.restoreLayout') : t('dmCall.enlarge', { name: label });

		return (
			<div
				role="button"
				tabIndex={0}
				aria-label={actionLabel}
				title={actionLabel}
				onClick={() => handleTileClick(tile)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						handleTileClick(tile);
					}
				}}
				className={`group/tile cursor-pointer overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-white/10 transition-shadow duration-200 hover:ring-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${layoutClass}`}
			>
				<video
					ref={videoRef}
					autoPlay
					muted={isLocal}
					playsInline
					className={`absolute inset-0 h-full w-full bg-black ${mode === 'main' ? 'object-contain' : 'object-cover'}`}
				/>
				{!hasVideo && (
					<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-900">
						<AvatarImage
							alt={avatarName}
							username={avatarName}
							src={avatar}
							srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 100, height: 100, resizeType: 'fill-down' })}
							className={`${avatarClass} font-semibold`}
							classNameText={`${avatarTextClass} font-semibold`}
						/>
					</div>
				)}
				<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
					{isMicMuted && <Icons.VoiceMicDisabledIcon scale={1.5} className="shrink-0" />}
					<span className="truncate">{label}</span>
				</div>
				{mode !== 'pip' && (
					<div className="absolute top-2 left-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity duration-200 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100">
						{mode === 'main' ? <Icons.ExitFullScreen className="h-4 w-4" /> : <Icons.FullScreen className="h-4 w-4" />}
					</div>
				)}
			</div>
		);
	};

	const deviceSettingsTriggerLabel =
		dmCallingDeviceMenuSubtitle(currentInputDevice, systemDefaultLabel) || dmCallingDeviceMenuSubtitle(currentOutputDevice, systemDefaultLabel);

	if (!isInCall && !isInChannelCalled) return <div />;

	return (
		<div
			className={`${
				(!isInChannelCalled && !isPlayDialTone) || dmGroupId !== directId || isPlayBusyTone ? '-z-50 opacity-0 hidden' : ''
			} flex flex-col group fixed top-0 left-0 right-0 sbm:left-auto sbm:right-0 sbm:w-widthThumnailAttachment w-full ${!isShowMeetDM && !isRemoteVideo ? 'h-[200px] min-h-[200px] sbm:h-[240px] sbm:min-h-[240px]' : 'h-[380px] sbm:h-[510px] max-h-[510px]'} z-50 sbm:z-10 p-2 sbm:p-3 min-w-0 items-center  shadow border-b-[1px] border-theme-primary bg-theme-setting-primary flex-shrink`}
		>
			<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
				<div className="flex flex-row gap-1 items-center flex-1">
					<div onClick={() => setStatusMenu(true)} className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
						<Icons.OpenMenu defaultSize={`w-5 h-5`} />
					</div>
				</div>
			</div>

			<div
				className={`relative w-full flex-1 min-h-0 ${activeVideo ? '' : 'pb-14 sbm:pb-16 lg:pb-[72px]'} ${!isShowMeetDM && !isRemoteVideo ? 'hidden' : ''}`}
			>
				<div className={activeVideo ? 'relative h-full w-full' : 'flex h-full w-full items-center justify-center gap-3 max-sbm:flex-col'}>
					{renderVideoTile({
						tile: 'local',
						videoRef: localVideoRef,
						isLocal: true,
						hasVideo: isShowMeetDM,
						isMicMuted: isMuteMicrophone,
						avatar: userProfile?.user?.avatar_url,
						label: t('dmCall.you'),
						avatarName: localDisplayName
					})}
					{renderVideoTile({
						tile: 'remote',
						videoRef: remoteVideoRef,
						isLocal: false,
						hasVideo: isRemoteVideo,
						isMicMuted: !isRemoteAudio,
						avatar: avatarImages[0],
						label: remoteDisplayName,
						avatarName: remoteDisplayName
					})}
				</div>
			</div>

			<div
				className={`${isShowMeetDM || isRemoteVideo ? 'absolute left-0 right-0 h-fit bottom-5 z-50 flex justify-center translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300' : 'w-full h-full'} flex flex-col justify-around`}
			>
				{!isShowMeetDM && !isRemoteVideo && (
					<div className="justify-center items-center gap-2 sbm:gap-4 flex w-full">
						{avatarImages.map((avatar, index) => (
							<AvatarImage
								key={index}
								height={'60px'}
								alt={`Avatar ${index + 1}`}
								username={nameImages[index] ? nameImages[index] : ``}
								className="min-w-[55px] min-h-[55px] max-w-[55px] max-h-[55px] sbm:min-w-[75px] sbm:min-h-[75px] sbm:max-w-[75px] sbm:max-h-[75px] font-semibold"
								srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 100, height: 100, resizeType: 'fill-down' })}
								src={avatar}
								classNameText="!text-3xl sbm:!text-4xl font-semibold"
							/>
						))}
					</div>
				)}
				<div className="justify-center items-center gap-2 sbm:gap-4 flex w-full">
					{!isInCall ? (
						<div className="justify-center items-center gap-3 sbm:gap-4 flex w-full">
							<div
								className={`h-[44px] w-[44px] sbm:h-[56px] sbm:w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: true, isAnswer: true })}
							>
								<Icons.VoiceCameraIcon scale={1} />
							</div>
							<div
								className={`h-[44px] w-[44px] sbm:h-[56px] sbm:w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
								onClick={() => onStartCall({ isVideoCall: false, isAnswer: true })}
							>
								<Icons.VoiceMicIcon scale={2} />
							</div>
							<div
								onClick={handleCloseCall}
								className={`h-[44px] w-[44px] sbm:h-[56px] sbm:w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
							>
								<Icons.CloseButton className={`w-[18px] sbm:w-[20px]`} />
							</div>
						</div>
					) : (
						<div className="flex flex-row gap-1.5 sbm:gap-2 lg:gap-3 justify-center flex-wrap">
							<div
								className={`relative h-9 w-9 sbm:h-11 sbm:w-11 lg:h-[56px] lg:w-[56px] rounded-full flex items-center justify-center cursor-pointer ${!isShowMeetDM ? 'dark:bg-bgSecondary dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary' : 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400'}`}
								onClick={toggleVideo}
								title={hasCameraAccess === false ? t('mediaPermission.needed.camera') : undefined}
							>
								{isShowMeetDM ? <Icons.VoiceCameraIcon scale={1.5} /> : <Icons.VoiceCameraDisabledIcon scale={1.5} />}
								{hasCameraAccess === false && <MediaPermissionBadge />}
							</div>
							<div
								className={`relative h-9 w-9 sbm:h-11 sbm:w-11 lg:h-[56px] lg:w-[56px] rounded-full flex items-center justify-center cursor-pointer ${isMuteMicrophone ? 'dark:bg-bgSecondary bg-neutral-500 dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgSecondary dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
								onClick={handleMuteToggle}
								title={hasMicrophoneAccess === false ? t('mediaPermission.needed.microphone') : undefined}
							>
								{isMuteMicrophone ? <Icons.VoiceMicDisabledIcon scale={2.5} /> : <Icons.VoiceMicIcon scale={2.5} />}
								{hasMicrophoneAccess === false && <MediaPermissionBadge />}
							</div>

							<Menu
								menu={menuDevice}
								className={'rounded-3xl'}
								onVisibleChange={(visible) => {
									setIsDeviceMenuOpen(visible);
									if (!visible) {
										setExpandedDevice(null);
									}
								}}
							>
								<div
									title={deviceSettingsTriggerLabel || undefined}
									className={`h-9 w-9 sbm:h-11 sbm:w-11 lg:h-[56px] lg:min-w-[56px] lg:max-w-[min(200px,28vw)] lg:w-auto lg:px-3 relative rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 min-w-0 ${isDeviceMenuOpen ? 'dark:bg-neutral-400 bg-neutral-700' : 'dark:bg-bgSecondary dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
								>
									<Icons.CallSetting className="text-white dark:text-bgTertiary shrink-0" />
								</div>
							</Menu>
							<div
								className={`h-9 w-9 sbm:h-11 sbm:w-11 lg:h-[56px] lg:w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
								onClick={handleCloseCall}
							>
								<Icons.StopCall className="size-4 sbm:size-5 lg:size-6 text-white-600" />
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export default memo(DmCalling);
