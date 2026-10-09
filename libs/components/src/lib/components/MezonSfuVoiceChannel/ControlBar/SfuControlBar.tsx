import { generateE2eId } from '@mezon/utils';
import { useEffect, useState } from 'react';
import type { ScreenShareMode } from '../MyVideoConference/screenShareQuality';
import { RecordingControl } from '../Recording/RecordingControl';
import { SfuAgentControl } from './AgentControl';
import { CameraControl } from './CameraControl';
import { EmojiReactionControl } from './EmojiReactionControl';
import { FullscreenControl } from './FullscreenControl';
import { LeaveButton } from './LeaveButton';
import { MicrophoneControl } from './MicrophoneControl';
import { NetworkWarningHint } from './NetworkWarningHint';
import { PopoutControl } from './PopoutControl';
import { PushToTalkControl } from './PushToTalkControl';
import { PushToTalkHint } from './PushToTalkHint';
import { SfuRaisingHandControl } from './RaisingHandControl';
import { ScreenShareControl } from './ScreenShareControl';
import { SfuVoiceInteractiveControl } from './SfuVoiceInteractiveControl';
import { SoundReactionControl } from './SoundReactionControl';

interface SfuControlBarProps {
	joinRole: 'speaker' | 'audience';
	hasMicrophoneAccess: boolean;
	hasCameraAccess: boolean;
	microphonePermissionState?: 'granted' | 'denied' | 'prompt' | null;
	cameraPermissionState?: 'granted' | 'denied' | 'prompt' | null;
	onRequestMicrophonePermission?: () => Promise<void>;
	onRequestCameraPermission?: () => Promise<void>;
	pushToTalkActive: boolean;
	pushToTalkHintDismissed?: boolean;
	onDismissPushToTalkHint?: () => void;
	agentHintDismissed?: boolean;
	onDismissAgentHint?: () => void;
	weakNetwork: boolean;
	microphoneEnabled: boolean;
	cameraEnabled: boolean;
	screenSharing: boolean;
	screenShareMode: ScreenShareMode;
	changingScreenShareMode: boolean;
	onScreenShareModeChange: (mode: ScreenShareMode) => void;
	isGridView: boolean;
	showEmojiPanel: boolean;
	showSoundPanel: boolean;
	showVoiceInteractivePanel?: boolean;
	microphones: MediaDeviceInfo[];
	cameras: MediaDeviceInfo[];
	selectedMicrophone: string;
	selectedCamera: string;
	isPopoutOpen: boolean;
	isFullScreen: boolean;
	isExternalCalling?: boolean;
	channelLabel: string;
	onEmojiPanelChange: (visible: boolean) => void;
	onSoundPanelChange: (visible: boolean) => void;
	onVoiceInteractivePanelChange?: (visible: boolean) => void;
	onEmojiSelect: (emojiId: string, emoji: string) => void;
	onSoundSelect: (soundId: string, soundUrl: string) => void;
	onPushToTalk: (active: boolean) => void;
	onMicrophoneToggle: () => void;
	onCameraToggle: () => void;
	onScreenShareToggle: () => void;
	onMicrophoneSelect: (deviceId: string) => void;
	onCameraSelect: (deviceId: string) => void;
	onLeaveRoom: () => void;
	onTogglePopout: () => void;
	onFullScreen: () => void;
	roomId?: string;
}

export const SfuControlBar = ({
	joinRole,
	hasMicrophoneAccess,
	hasCameraAccess,
	microphonePermissionState,
	cameraPermissionState,
	onRequestMicrophonePermission,
	onRequestCameraPermission,
	pushToTalkActive,
	pushToTalkHintDismissed = false,
	onDismissPushToTalkHint,
	agentHintDismissed = false,
	onDismissAgentHint,
	weakNetwork,
	microphoneEnabled,
	cameraEnabled,
	screenSharing,
	screenShareMode,
	changingScreenShareMode,
	onScreenShareModeChange,
	isGridView,
	showEmojiPanel,
	showSoundPanel,
	showVoiceInteractivePanel,
	microphones,
	cameras,
	selectedMicrophone,
	selectedCamera,
	isPopoutOpen,
	isFullScreen,
	isExternalCalling,
	channelLabel,
	onEmojiPanelChange,
	onSoundPanelChange,
	onVoiceInteractivePanelChange,
	onEmojiSelect,
	onSoundSelect,
	onPushToTalk,
	onMicrophoneToggle,
	onCameraToggle,
	onScreenShareToggle,
	onMicrophoneSelect,
	onCameraSelect,
	onLeaveRoom,
	onTogglePopout,
	onFullScreen,
	roomId
}: SfuControlBarProps) => {
	const [localShowVoiceInteractive, setLocalShowVoiceInteractive] = useState(false);
	const showVoiceInteractive = showVoiceInteractivePanel ?? localShowVoiceInteractive;
	const handleVoiceInteractiveChange = onVoiceInteractivePanelChange ?? setLocalShowVoiceInteractive;
	const [networkWarningDismissed, setNetworkWarningDismissed] = useState(false);
	useEffect(() => {
		if (!weakNetwork) setNetworkWarningDismissed(false);
	}, [weakNetwork]);
	const showNetworkWarning = weakNetwork && !networkWarningDismissed;
	const dismissNetworkWarning = () => setNetworkWarningDismissed(true);
	const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
	const showPushToTalkHint = joinRole === 'audience' && !pushToTalkHintDismissed && !deviceMenuOpen;
	const showAgentHint = !agentHintDismissed && !showNetworkWarning && !deviceMenuOpen && !(joinRole === 'audience' && !pushToTalkHintDismissed);
	return (
		<footer className="relative z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#11111b] px-4 py-3 max-md:flex max-md:flex-col max-md:justify-center max-md:gap-3 max-md:px-2 max-md:py-2">
			<div className="flex items-center justify-start gap-4 max-md:justify-center max-md:gap-3">
				{!isExternalCalling && (
					<>
						<div className="max-md:hidden">
							<EmojiReactionControl
								isGridView={isGridView}
								showEmojiPanel={showEmojiPanel}
								onVisibleChange={onEmojiPanelChange}
								onEmojiSelect={onEmojiSelect}
							/>
						</div>
						<div className="max-md:hidden">
							<SoundReactionControl
								isGridView={isGridView}
								showSoundPanel={showSoundPanel}
								onVisibleChange={onSoundPanelChange}
								onSoundSelect={onSoundSelect}
							/>
						</div>

						<div className="max-md:hidden">
							<SfuVoiceInteractiveControl showVoiceInteractive={showVoiceInteractive} onVisibleChange={handleVoiceInteractiveChange} />
						</div>
					</>
				)}
				<div className="max-md:hidden">
					<RecordingControl channelLabel={channelLabel} />
				</div>
			</div>
			<div className="flex items-center justify-center gap-3 max-md:gap-2" data-e2e={generateE2eId('clan_page.screen.voice_room.control_bar')}>
				{joinRole === 'audience' && (
					<div className="relative">
						<PushToTalkControl
							active={pushToTalkActive}
							onChange={onPushToTalk}
							devices={microphones}
							selectedDeviceId={selectedMicrophone}
							onSelect={onMicrophoneSelect}
							onDeviceMenuOpenChange={setDeviceMenuOpen}
							permissionState={microphonePermissionState}
							hasMicrophoneAccess={hasMicrophoneAccess}
							onPermissionRequest={onRequestMicrophonePermission}
							weakNetwork={weakNetwork}
						/>
						{showNetworkWarning ? (
							<NetworkWarningHint onDismiss={dismissNetworkWarning} />
						) : (
							showPushToTalkHint && <PushToTalkHint active={pushToTalkActive} onDismiss={onDismissPushToTalkHint} />
						)}
					</div>
				)}
				{joinRole === 'speaker' && (
					<div className="relative">
						<MicrophoneControl
							enabled={microphoneEnabled}
							devices={microphones}
							selectedDeviceId={selectedMicrophone}
							onToggle={onMicrophoneToggle}
							onSelect={onMicrophoneSelect}
							onDeviceMenuOpenChange={setDeviceMenuOpen}
							permissionState={microphonePermissionState}
							hasMicrophoneAccess={hasMicrophoneAccess}
							onPermissionRequest={onRequestMicrophonePermission}
							weakNetwork={weakNetwork}
						/>
						{showNetworkWarning && <NetworkWarningHint onDismiss={dismissNetworkWarning} />}
					</div>
				)}
				{joinRole === 'speaker' && (
					<CameraControl
						enabled={cameraEnabled}
						devices={cameras}
						selectedDeviceId={selectedCamera}
						onToggle={onCameraToggle}
						onSelect={onCameraSelect}
						onDeviceMenuOpenChange={setDeviceMenuOpen}
						permissionState={cameraPermissionState}
						hasCameraAccess={hasCameraAccess}
						onPermissionRequest={onRequestCameraPermission}
					/>
				)}
				{joinRole === 'speaker' && (
					<div className="max-md:hidden">
						<ScreenShareControl
							active={screenSharing}
							onToggle={onScreenShareToggle}
							mode={screenShareMode}
							changingMode={changingScreenShareMode}
							onModeChange={onScreenShareModeChange}
						/>
					</div>
				)}
				<SfuAgentControl roomId={roomId} isExternalCalling={isExternalCalling} showHint={showAgentHint} onDismissHint={onDismissAgentHint} />
				{!isExternalCalling && <SfuRaisingHandControl />}
				<LeaveButton onLeave={onLeaveRoom} />
			</div>
			<div className="flex justify-end pr-1 max-md:hidden">
				{!isExternalCalling && <PopoutControl active={isPopoutOpen} onToggle={onTogglePopout} />}
				<FullscreenControl active={isFullScreen} onToggle={onFullScreen} />
			</div>
		</footer>
	);
};
