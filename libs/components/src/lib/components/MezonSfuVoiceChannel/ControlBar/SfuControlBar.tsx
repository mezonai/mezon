import { useState } from 'react';
import { RecordingControl } from '../Recording/RecordingControl';
import { SfuAgentControl } from './AgentControl';
import { CameraControl } from './CameraControl';
import { EmojiReactionControl } from './EmojiReactionControl';
import { FullscreenControl } from './FullscreenControl';
import { LeaveButton } from './LeaveButton';
import { MicrophoneControl } from './MicrophoneControl';
import { PopoutControl } from './PopoutControl';
import { PushToTalkControl } from './PushToTalkControl';
import { SfuRaisingHandControl } from './RaisingHandControl';
import { ScreenShareControl } from './ScreenShareControl';
import { SfuVoiceInteractiveControl } from './SfuVoiceInteractiveControl';
import { SoundReactionControl } from './SoundReactionControl';

interface SfuControlBarProps {
	joinRole: 'speaker' | 'audience';
	hasMicrophoneAccess: boolean;
	hasCameraAccess: boolean;
	pushToTalkActive: boolean;
	microphoneEnabled: boolean;
	cameraEnabled: boolean;
	screenSharing: boolean;
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
}

export const SfuControlBar = ({
	joinRole,
	hasMicrophoneAccess,
	hasCameraAccess,
	pushToTalkActive,
	microphoneEnabled,
	cameraEnabled,
	screenSharing,
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
	onFullScreen
}: SfuControlBarProps) => {
	const [localShowVoiceInteractive, setLocalShowVoiceInteractive] = useState(false);
	const showVoiceInteractive = showVoiceInteractivePanel ?? localShowVoiceInteractive;
	const handleVoiceInteractiveChange = onVoiceInteractivePanelChange ?? setLocalShowVoiceInteractive;

	return (
		<footer className="relative z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#11111b] px-4 py-3 max-md:flex max-md:flex-col max-md:justify-center max-md:gap-3 max-md:px-2 max-md:py-2">
			<div className="flex items-center justify-start gap-4 max-md:justify-center max-md:gap-3">
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
				<RecordingControl channelLabel={channelLabel} />
			</div>
			<div className="flex items-center justify-center gap-3 max-md:gap-2">
				{joinRole === 'audience' && hasMicrophoneAccess && <PushToTalkControl active={pushToTalkActive} onChange={onPushToTalk} />}
				{joinRole === 'speaker' && hasMicrophoneAccess && (
					<MicrophoneControl
						enabled={microphoneEnabled}
						devices={microphones}
						selectedDeviceId={selectedMicrophone}
						onToggle={onMicrophoneToggle}
						onSelect={onMicrophoneSelect}
					/>
				)}
				{joinRole === 'speaker' && hasCameraAccess && (
					<CameraControl
						enabled={cameraEnabled}
						devices={cameras}
						selectedDeviceId={selectedCamera}
						onToggle={onCameraToggle}
						onSelect={onCameraSelect}
					/>
				)}
				{joinRole === 'speaker' && (
					<div className="max-md:hidden">
						<ScreenShareControl active={screenSharing} onToggle={onScreenShareToggle} />
					</div>
				)}
				<SfuAgentControl />
				<SfuRaisingHandControl />
				<LeaveButton onLeave={onLeaveRoom} />
			</div>
			<div className="flex justify-end pr-1 max-md:hidden">
				<PopoutControl active={isPopoutOpen} onToggle={onTogglePopout} />
				<FullscreenControl active={isFullScreen} onToggle={onFullScreen} />
			</div>
		</footer>
	);
};
