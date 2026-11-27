import {
	InMeetingBackgroundMenu,
	MediaPipeBackgroundProcessor,
	MezonSfuVoiceRoom,
	SfuPreJoinVoiceChannel,
	openCameraStream,
	withPreferredCamera,
	type BackgroundMode,
	type SfuJoinRole
} from '@mezon/components';
import { EmojiSuggestionProvider } from '@mezon/core';
import {
	appActions,
	channelAppActions,
	generateMeetToken,
	getStore,
	selectBreakoutRoom,
	selectChannelById,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
	selectCurrentChannelPrivate,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectCurrentClanName,
	selectIsShowChatVoice,
	selectIsShowSettingFooter,
	selectMemberByIdAndClanId,
	selectSfuUrlJoinVoice,
	selectShowCamera,
	selectShowMicrophone,
	selectStatusMenu,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	selectVoiceOpenPopOut,
	useAppDispatch,
	voiceActions
} from '@mezon/store';

import { isRealClanId, reportMediaAccessError, useLastCallback } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ReactNode, RefObject } from 'react';
import React, { Suspense, memo, useCallback, useEffect, useRef, useState, type ErrorInfo } from 'react';
import { flushSync } from 'react-dom';
import { useSelector } from 'react-redux';
import ChatStream from '../chatStream';
import { SfuReconnectModal } from './SfuReconnectModal';

type VoiceJoinTarget = NonNullable<ReturnType<typeof selectVoiceInfo>>;

const VOICE_CHAT_PANEL_CLASS =
	'z-40 w-[500px] flex-shrink-0 border-l border-border bg-bgPrimary dark:border-bgTertiary max-xl:absolute max-xl:inset-0 max-xl:w-full max-xl:border-l-0';

interface VoicePreJoinWrapperProps {
	loading: boolean;
	handleJoinRoom: (role: SfuJoinRole) => void;
}

const VoicePreJoinWrapper = memo(({ loading, handleJoinRoom }: VoicePreJoinWrapperProps) => {
	const channelLabel = useSelector(selectCurrentChannelLabel);
	const channelId = useSelector(selectCurrentChannelId);
	const channelClanId = useSelector(selectCurrentChannelClanId);
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);
	const breakoutRoom = useSelector(selectBreakoutRoom);
	const isPrivateVoice = !!useSelector(selectCurrentChannelPrivate);
	const isShowChatVoice = useSelector(selectIsShowChatVoice);
	const dispatch = useAppDispatch();

	const isCurrentChannel =
		isJoined &&
		(voiceInfo?.channelId === channelId ||
			(Boolean(breakoutRoom) && voiceInfo?.channelId === breakoutRoom?.roomId && breakoutRoom?.parentChannelId === channelId));

	return (
		<SfuPreJoinVoiceChannel
			channel_label={channelLabel}
			channel_id={channelId as string}
			loading={loading}
			handleJoinRoom={handleJoinRoom}
			clan_id={channelClanId}
			isCurrentChannel={isCurrentChannel}
			isPrivateVoice={isPrivateVoice}
			isChatOpen={isShowChatVoice}
			onToggleChat={() => dispatch(appActions.setIsShowChatVoice(!isShowChatVoice))}
		>
			{isShowChatVoice && !isCurrentChannel && (
				<EmojiSuggestionProvider>
					<div className={VOICE_CHAT_PANEL_CLASS}>
						<ChatStream topicChannelId={channelId as string} />
					</div>
				</EmojiSuggestionProvider>
			)}
		</SfuPreJoinVoiceChannel>
	);
});

interface VoiceConferenceContainerProps {
	containerRef: RefObject<HTMLDivElement>;
	isOpenPopOut?: boolean;
	rejoinTarget: VoiceJoinTarget | null;
	children: ReactNode;
}

interface VoiceConferenceContentProps {
	token: string;
	joinRole: SfuJoinRole;
	serverUrl: string;
	voiceInfo: ReturnType<typeof selectVoiceInfo>;
	handleLeaveRoom: (self?: boolean) => Promise<void>;
	onReconnectRequired: (networkLost: boolean) => void;
	handleFullScreen: () => void;
	isShowChatVoice: boolean;
	isVoiceFullScreen: boolean;
	handleToggleChat: () => void;
	isPrivateVoice?: boolean;
	onRefreshToken?: () => Promise<string | undefined>;
	onSfuFailover?: (failedServerUrl: string) => Promise<{ token?: string; url?: string } | undefined>;
	containerRef?: RefObject<HTMLDivElement | null>;
	selectedCamera: string;
	onSelectCamera: (deviceId: string) => void;
	selectedBg: BackgroundMode | null;
	onSelectBg: (mode: BackgroundMode | null) => void;
}

const VoiceConferenceContent = memo(
	({
		token,
		joinRole,
		serverUrl,
		voiceInfo,
		handleLeaveRoom,
		onReconnectRequired,
		handleFullScreen,
		isShowChatVoice,
		isVoiceFullScreen,
		handleToggleChat,
		isPrivateVoice,
		onRefreshToken,
		onSfuFailover,
		containerRef,
		selectedCamera,
		onSelectCamera,
		selectedBg,
		onSelectBg
	}: VoiceConferenceContentProps) => {
		const roomCameraOn = useSelector(selectShowCamera);
		const cameraEnabled = joinRole === 'speaker' && roomCameraOn;
		const shareCamera = cameraEnabled;

		const [customVideoTrack, setCustomVideoTrack] = useState<MediaStreamTrack | null>(null);

		const selectedBgRef = useRef<BackgroundMode | null>(selectedBg);
		const currentDeviceIdRef = useRef(selectedCamera);
		const rawStreamRef = useRef<MediaStream | null>(null);
		const processorRef = useRef<MediaPipeBackgroundProcessor | null>(null);
		const cameraRequestRef = useRef(0);
		const cameraStartQueueRef = useRef<Promise<void>>(Promise.resolve());
		const dispatch = useAppDispatch();

		const startCamera = useCallback(
			(deviceId: string) => {
				const request = ++cameraRequestRef.current;
				const run = async () => {
					if (request !== cameraRequestRef.current) return;
					try {
						const videoConstraints = withPreferredCamera(
							{
								width: { ideal: 1280 },
								height: { ideal: 720 },
								...(deviceId === 'default' ? { facingMode: 'user' } : {})
							},
							deviceId
						);
						const stream = await openCameraStream(videoConstraints);
						if (request !== cameraRequestRef.current) {
							stream.getTracks().forEach((track) => track.stop());
							return;
						}

						rawStreamRef.current?.getTracks().forEach((track) => track.stop());
						rawStreamRef.current = stream;

						if (!processorRef.current) {
							processorRef.current = new MediaPipeBackgroundProcessor();
						}

						await processorRef.current.start(stream, selectedBgRef.current);
						if (request !== cameraRequestRef.current) {
							stream.getTracks().forEach((track) => track.stop());
							if (rawStreamRef.current === stream) {
								rawStreamRef.current = null;
								processorRef.current?.stop();
							}
							return;
						}

						setCustomVideoTrack(processorRef.current.getVideoTrack());
					} catch (err) {
						console.error('Error accessing camera:', err);
						if (request === cameraRequestRef.current) {
							reportMediaAccessError('camera', err);
							dispatch(voiceActions.setShowCamera(false));
						}
					}
				};
				cameraStartQueueRef.current = cameraStartQueueRef.current.then(run);
				return cameraStartQueueRef.current;
			},
			[dispatch]
		);

		const releaseCamera = useCallback(() => {
			cameraRequestRef.current += 1;
			rawStreamRef.current?.getTracks().forEach((track) => track.stop());
			rawStreamRef.current = null;
			setCustomVideoTrack((prev) => {
				prev?.stop();
				return null;
			});
			processorRef.current?.stop();
		}, []);

		const handleSelectCamera = useCallback(
			(deviceId: string) => {
				onSelectCamera(deviceId);
				currentDeviceIdRef.current = deviceId;
				if (cameraEnabled && selectedBg) void startCamera(deviceId);
			},
			[cameraEnabled, onSelectCamera, selectedBg, startCamera]
		);

		const handleSelectBg = useCallback(
			(mode: BackgroundMode | null) => {
				onSelectBg(mode);
				selectedBgRef.current = mode;
				if (mode) {
					if (processorRef.current) {
						processorRef.current.setMode(mode);
					}
					if (cameraEnabled && !rawStreamRef.current) {
						void startCamera(selectedCamera);
					}
				} else {
					releaseCamera();
				}
			},
			[cameraEnabled, onSelectBg, releaseCamera, selectedCamera, startCamera]
		);

		useEffect(() => {
			selectedBgRef.current = selectedBg;
		}, [selectedBg]);

		useEffect(() => {
			if (!cameraEnabled || !selectedBg) {
				releaseCamera();
				return;
			}
			if (!rawStreamRef.current || currentDeviceIdRef.current !== selectedCamera) {
				currentDeviceIdRef.current = selectedCamera;
				void startCamera(selectedCamera);
			}
		}, [cameraEnabled, selectedBg, selectedCamera, releaseCamera, startCamera]);

		useEffect(() => {
			return () => {
				cameraRequestRef.current += 1;
				if (rawStreamRef.current) {
					rawStreamRef.current.getTracks().forEach((track) => track.stop());
					rawStreamRef.current = null;
				}
				if (processorRef.current) {
					processorRef.current.destroy();
					processorRef.current = null;
				}
			};
		}, []);

		return (
			<div className="flex-1 relative flex overflow-hidden">
				<MezonSfuVoiceRoom
					token={token}
					joinRole={joinRole}
					roomId={voiceInfo?.channelId as string}
					serverUrl={serverUrl}
					channelLabel={voiceInfo?.channelLabel || ''}
					isChatOpen={isShowChatVoice}
					isFullScreen={isVoiceFullScreen}
					onLeaveRoom={() => void handleLeaveRoom()}
					onReconnectRequired={onReconnectRequired}
					onFullScreen={handleFullScreen}
					onToggleChat={handleToggleChat}
					isPrivateVoice={isPrivateVoice}
					onRefreshToken={onRefreshToken}
					onSfuFailover={onSfuFailover}
					cameraManagedExternally={Boolean(selectedBg)}
					customVideoTrack={shareCamera && selectedBg && customVideoTrack?.readyState === 'live' ? customVideoTrack : null}
					preferredCameraId={selectedCamera}
					onSelectCamera={handleSelectCamera}
					headerActions={
						shareCamera && containerRef ? (
							<InMeetingBackgroundMenu selectedMode={selectedBg} onSelectMode={handleSelectBg} containerRef={containerRef} />
						) : undefined
					}
				/>
				<EmojiSuggestionProvider>
					{isShowChatVoice && (
						<div className={VOICE_CHAT_PANEL_CLASS}>
							<ChatStream topicChannelId={voiceInfo?.channelId} />
						</div>
					)}
				</EmojiSuggestionProvider>
			</div>
		);
	}
);

const VoiceConferenceContainer = memo(({ containerRef, isOpenPopOut, rejoinTarget, children }: VoiceConferenceContainerProps) => {
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const breakoutRoom = useSelector(selectBreakoutRoom);

	const displayedVoiceInfo = rejoinTarget ?? voiceInfo;
	const isShow =
		(isJoined || !!rejoinTarget) &&
		(displayedVoiceInfo?.channelId === currentChannelId ||
			(Boolean(breakoutRoom) && displayedVoiceInfo?.channelId === breakoutRoom?.roomId && breakoutRoom?.parentChannelId === currentChannelId));

	return (
		<div
			ref={containerRef}
			id="mezonSfuRoom"
			key={displayedVoiceInfo?.channelId}
			className={`${!isShow || isOpenPopOut ? '!hidden' : ''} relative flex flex-1 min-w-0 w-full h-full bg-bgPrimary`}
		>
			{children}
		</div>
	);
});

const MezonSfuChannelVoiceInner = () => {
	const token = useSelector(selectTokenJoinVoice);
	const sfuUrl = useSelector(selectSfuUrlJoinVoice);
	const voiceInfo = useSelector(selectVoiceInfo);
	const [loading, setLoading] = useState<boolean>(false);
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const [selectedCamera, setSelectedCamera] = useState('default');
	const [selectedBg, setSelectedBg] = useState<BackgroundMode | null>(null);
	const [rejoinTarget, setRejoinTarget] = useState<VoiceJoinTarget | null>(null);
	const [rejoinNetworkLost, setRejoinNetworkLost] = useState(false);
	const joinRequestRef = useRef(0);
	const joiningRef = useRef(false);
	const dispatch = useAppDispatch();
	const serverUrl = sfuUrl || process.env.NX_CHAT_APP_SFU_WS_URL;
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const isShowChatVoice = useSelector(selectIsShowChatVoice);
	const viewedChannelId = useSelector(selectCurrentChannelId);
	const breakoutRoom = useSelector(selectBreakoutRoom);
	const isViewingVoiceRoom = voiceInfo?.channelId === viewedChannelId || breakoutRoom?.parentChannelId === viewedChannelId;
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isChannelMezonVoice = currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const containerRef = useRef<HTMLDivElement>(null);

	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
	const isOnMenu = useSelector(selectStatusMenu);

	const isDisconnectingRef = useRef(false);
	const isPrivateVoice = !!useSelector((state) => selectChannelById(state, voiceInfo?.channelId || ''))?.channel_private;

	useEffect(
		() => () => {
			joinRequestRef.current += 1;
		},
		[]
	);

	const handleJoinRoom = useLastCallback(async (role: SfuJoinRole, target?: VoiceJoinTarget) => {
		if (joiningRef.current) return;
		joiningRef.current = true;
		const request = ++joinRequestRef.current;
		const previousState = getStore().getState();
		const restoreMicrophone = !!target && selectShowMicrophone(previousState);
		const restoreCamera = !!target && selectShowCamera(previousState);
		if (!target) {
			setRejoinTarget(null);
			setSelectedBg(null);
			setSelectedCamera('default');
		}
		setJoinRole(role);
		if (target) {
			flushSync(() => {
				dispatch(voiceActions.resetVoiceControl({ keepBreakout: true }));
				dispatch(channelAppActions.clearAppInteractiveData());
			});
		} else if (token) {
			dispatch(voiceActions.setJoined(false));
			dispatch(voiceActions.setToken(''));
		}
		dispatch(voiceActions.setOpenPopOut(false));
		dispatch(voiceActions.setShowScreen(false));
		dispatch(voiceActions.setStreamScreen(null));
		dispatch(voiceActions.setShowMicrophone(restoreMicrophone));
		if (target) dispatch(voiceActions.setShowCamera(restoreCamera));
		if (role === 'audience') dispatch(voiceActions.setShowCamera(false));

		const storeState = getStore().getState();
		const userProfile = storeState.account.userProfile;
		const currentClanId = target?.clanId ?? selectCurrentClanId(storeState);
		const currentClanName = target?.clanName ?? selectCurrentClanName(storeState);
		const currentChannelId = target?.channelId ?? selectCurrentChannelId(storeState);
		const currentChannelLabel = target?.channelLabel ?? selectCurrentChannelLabel(storeState);
		const currentChannelPrivate = target?.channelPrivate ?? selectCurrentChannelPrivate(storeState);

		if (!currentClanId || !currentChannelId) {
			joiningRef.current = false;
			return;
		}
		setLoading(true);

		try {
			const clanMember = selectMemberByIdAndClanId(storeState, currentClanId, userProfile?.user?.id || '');
			const username = clanMember?.clan_nick || clanMember?.prioritizeName || userProfile?.user?.display_name || userProfile?.user?.username;
			const avatar = clanMember?.clan_avatar || userProfile?.user?.avatar_url;
			const metadata = username || avatar ? `${username};${avatar}` : '';
			const result = await dispatch(
				generateMeetToken({
					channelId: currentChannelId as string,
					roomName: '',
					metadata
				})
			).unwrap();
			if (request !== joinRequestRef.current) return;

			if (result?.token) {
				dispatch(voiceActions.setJoined(true));
				dispatch(
					voiceActions.setVoiceInfo({
						clanId: currentClanId as string,
						clanName: currentClanName as string,
						channelId: currentChannelId as string,
						channelLabel: currentChannelLabel as string,
						channelPrivate: currentChannelPrivate as number,
						joinRole: role
					})
				);
				dispatch(voiceActions.setSfuUrl(result.url));
				dispatch(voiceActions.setToken(result.token));
				setRejoinTarget(null);
			} else {
				dispatch(voiceActions.setToken(''));
			}
		} catch (err) {
			if (request !== joinRequestRef.current) return;
			console.error('Failed to generate token room:', err);
			dispatch(voiceActions.setToken(''));
		} finally {
			if (request === joinRequestRef.current) {
				joiningRef.current = false;
				setLoading(false);
			}
		}
	});

	const handleRefreshToken = useLastCallback(async () => {
		const channelId = voiceInfo?.channelId;
		const clanId = voiceInfo?.clanId;
		if (!channelId || !clanId) return undefined;
		const storeState = getStore().getState();
		const userProfile = storeState.account.userProfile;
		const clanMember = selectMemberByIdAndClanId(storeState, clanId, userProfile?.user?.id || '');
		const username = clanMember?.clan_nick || clanMember?.prioritizeName || userProfile?.user?.display_name || userProfile?.user?.username;
		const avatar = clanMember?.clan_avatar || userProfile?.user?.avatar_url;
		const metadata = username || avatar ? `${username};${avatar}` : '';
		try {
			const result = await dispatch(
				generateMeetToken({
					channelId,
					roomName: '',
					metadata
				})
			).unwrap();
			if (result?.url) dispatch(voiceActions.setSfuUrl(result.url));
			return result?.token;
		} catch (err) {
			console.error('Failed to refresh voice token:', err);
			return undefined;
		}
	});

	const handleSfuFailover = useLastCallback(async (failedServerUrl: string) => {
		const channelId = voiceInfo?.channelId;
		const clanId = voiceInfo?.clanId;
		if (!channelId || !clanId) return undefined;
		const storeState = getStore().getState();
		const userProfile = storeState.account.userProfile;
		const clanMember = selectMemberByIdAndClanId(storeState, clanId, userProfile?.user?.id || '');
		const username = clanMember?.clan_nick || clanMember?.prioritizeName || userProfile?.user?.display_name || userProfile?.user?.username;
		const avatar = clanMember?.clan_avatar || userProfile?.user?.avatar_url;
		const metadata = username || avatar ? `${username};${avatar}` : '';
		try {
			return await dispatch(
				generateMeetToken({
					channelId,
					roomName: '',
					metadata,
					avoidingSfuUrl: failedServerUrl
				})
			).unwrap();
		} catch {
			return undefined;
		}
	});

	const handleReconnectRequired = useLastCallback((networkLost: boolean) => {
		if (!voiceInfo) return;
		setRejoinNetworkLost(networkLost);
		setRejoinTarget({ ...voiceInfo, joinRole });
		dispatch(voiceActions.setOpenPopOut(false));
		dispatch(voiceActions.setVoiceConnectionState(false));
	});
	const handleExitReconnect = useLastCallback(() => {
		joinRequestRef.current += 1;
		joiningRef.current = false;
		setLoading(false);
		setRejoinTarget(null);
		setSelectedBg(null);
		setSelectedCamera('default');
		dispatch(voiceActions.resetVoiceControl());
		dispatch(channelAppActions.clearAppInteractiveData());
		dispatch(appActions.setIsShowChatVoice(false));
	});

	const handleLeaveRoom = useLastCallback(async (_self?: boolean) => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		if (isDisconnectingRef.current) return;
		isDisconnectingRef.current = true;
		joinRequestRef.current += 1;
		joiningRef.current = false;
		setLoading(false);
		setRejoinTarget(null);
		setSelectedBg(null);
		setSelectedCamera('default');

		dispatch(voiceActions.resetVoiceControl());
		dispatch(channelAppActions.clearAppInteractiveData());
		dispatch(appActions.setIsShowChatVoice(false));

		isDisconnectingRef.current = false;
	});

	const handleFullScreen = useCallback(() => {
		dispatch(voiceActions.setFullScreen(!isVoiceFullScreen));
	}, [dispatch, isVoiceFullScreen]);
	const handleToggleChat = useCallback(() => {
		dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
	}, [dispatch, isShowChatVoice]);

	return (
		<Suspense fallback={<div>loading ...</div>}>
			<div
				className={`${isOpenPopOut ? 'pointer-events-none' : ''} ${!isChannelMezonVoice || isShowSettingFooter?.status ? 'hidden' : ''} ${isVoiceFullScreen ? 'fixed inset-0 z-[100]' : `absolute bottom-0 right-0 ${isOnMenu ? 'max-sbm:z-1 z-30' : 'z-30'}`} ${!isOnMenu && !isVoiceFullScreen ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''}`}
				style={!isVoiceFullScreen ? { width: 'calc(100% - 72px - 272px)', height: '100%' } : { width: '100vw', height: '100vh' }}
			>
				{!rejoinTarget && (token === '' || !serverUrl || !isRealClanId(voiceInfo?.clanId)) ? (
					isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />
				) : (
					<>
						{isChannelMezonVoice && !rejoinTarget && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />}
						<VoiceConferenceContainer containerRef={containerRef} isOpenPopOut={isOpenPopOut} rejoinTarget={rejoinTarget}>
							{token && serverUrl ? (
								<VoiceConferenceContent
									token={token}
									joinRole={joinRole}
									serverUrl={serverUrl}
									voiceInfo={voiceInfo}
									isPrivateVoice={isPrivateVoice}
									handleLeaveRoom={handleLeaveRoom}
									onReconnectRequired={handleReconnectRequired}
									handleFullScreen={handleFullScreen}
									isShowChatVoice={isShowChatVoice && isViewingVoiceRoom}
									isVoiceFullScreen={!!isVoiceFullScreen}
									handleToggleChat={handleToggleChat}
									onRefreshToken={handleRefreshToken}
									onSfuFailover={handleSfuFailover}
									containerRef={containerRef}
									selectedCamera={selectedCamera}
									onSelectCamera={setSelectedCamera}
									selectedBg={selectedBg}
									onSelectBg={setSelectedBg}
								/>
							) : (
								<div className="flex h-full w-full flex-col p-5 text-textSecondary">
									<span className="text-sm font-medium">{rejoinTarget?.channelLabel}</span>
								</div>
							)}
							{rejoinTarget && (
								<SfuReconnectModal
									loading={loading}
									networkLost={rejoinNetworkLost}
									onRejoin={() => void handleJoinRoom(rejoinTarget.joinRole || 'speaker', rejoinTarget)}
									onExit={handleExitReconnect}
								/>
							)}
						</VoiceConferenceContainer>
					</>
				)}
			</div>
		</Suspense>
	);
};

interface VoiceErrorBoundaryState {
	hasError: boolean;
}

class VoiceErrorBoundary extends React.Component<{ children: ReactNode }, VoiceErrorBoundaryState> {
	state: VoiceErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): VoiceErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('VoiceErrorBoundary caught error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					className="absolute bottom-0 right-0 z-30 flex items-center justify-center h-full max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]"
					style={{ width: 'calc(100% - 72px - 272px)' }}
				>
					<div className="text-center text-textSecondary">
						<p className="text-lg font-semibold">Voice channel encountered an error.</p>
						<button
							className="mt-2 px-4 py-2 bg-bgSecondary rounded hover:bg-bgTertiary text-sm"
							onClick={() => this.setState({ hasError: false })}
						>
							Retry
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

const MezonSfuChannelVoice = memo(() => (
	<VoiceErrorBoundary>
		<MezonSfuChannelVoiceInner />
	</VoiceErrorBoundary>
));

export default MezonSfuChannelVoice;
