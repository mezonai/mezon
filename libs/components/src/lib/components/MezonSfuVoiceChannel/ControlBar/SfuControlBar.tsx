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
	microphones: MediaDeviceInfo[];
	cameras: MediaDeviceInfo[];
	selectedMicrophone: string;
	selectedCamera: string;
	isPopoutOpen: boolean;
	isFullScreen: boolean;
	channelLabel: string;
	onEmojiPanelChange: (visible: boolean) => void;
	onSoundPanelChange: (visible: boolean) => void;
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
	microphones,
	cameras,
	selectedMicrophone,
	selectedCamera,
	isPopoutOpen,
	isFullScreen,
	channelLabel,
	onEmojiPanelChange,
	onSoundPanelChange,
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
}: SfuControlBarProps) => (
	<footer className="relative z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#11111b] px-4 py-3">
		<div className="flex justify-start gap-4">
			<EmojiReactionControl
				isGridView={isGridView}
				showEmojiPanel={showEmojiPanel}
				onVisibleChange={onEmojiPanelChange}
				onEmojiSelect={onEmojiSelect}
			/>
			<SoundReactionControl
				isGridView={isGridView}
				showSoundPanel={showSoundPanel}
				onVisibleChange={onSoundPanelChange}
				onSoundSelect={onSoundSelect}
			/>
			<RecordingControl channelLabel={channelLabel} />
		</div>
		<div className="flex items-center justify-center gap-3">
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
			{joinRole === 'speaker' && <ScreenShareControl active={screenSharing} onToggle={onScreenShareToggle} />}
			<SfuAgentControl />
			<SfuRaisingHandControl />
			<LeaveButton onLeave={onLeaveRoom} />
		</div>
		<div className="flex justify-end gap-4 pr-1">
			<PopoutControl active={isPopoutOpen} onToggle={onTogglePopout} />
			<FullscreenControl active={isFullScreen} onToggle={onFullScreen} />
		</div>
	</footer>
);
