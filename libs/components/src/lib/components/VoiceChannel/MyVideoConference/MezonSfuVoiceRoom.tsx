import {
	selectCurrentUserId,
	selectEntitesUserClans,
	selectShowCamera,
	selectShowMicrophone,
	toastActions,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize, useMediaPermissions } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import { EmojiReactionControl } from '../ControlBar/EmojiReactionControl';
import { SoundReactionControl } from '../ControlBar/SoundReactionControl';

type ConnectionState = 'connecting' | 'joining' | 'awaiting offer' | 'connected' | 'disconnected' | 'failed';

type SignalMessage = {
	type: string;
	sdp?: string;
	message?: string;
	participant_count?: number;
	mid_audio?: number | string;
	mid_video?: number | string;
	mid_screen?: number | string;
};

type RemoteMedia = {
	id: string;
	userId?: string;
	audio?: MediaStreamTrack;
	video?: MediaStreamTrack;
	screen?: MediaStreamTrack;
	screenActive?: boolean;
};

const CAMERA_CAPTURE_CONSTRAINTS = {
	width: { ideal: 640 },
	height: { ideal: 360 },
	frameRate: { ideal: 24 }
} satisfies MediaTrackConstraints;

const SCREEN_SHARE_CAPTURE_CONSTRAINTS = {
	width: { ideal: 1920 },
	height: { ideal: 1080 },
	frameRate: { ideal: 10, max: 15 }
} satisfies MediaTrackConstraints;

const getRemoteParticipantId = (mid: string) => {
	const numericMid = Number(mid);
	return Number.isFinite(numericMid) && numericMid >= 3 ? `peer-${Math.floor((numericMid - 3) / 3)}` : `mid-${mid}`;
};

const getRemoteMediaKind = (mid: string) => {
	const numericMid = Number(mid);
	if (!Number.isFinite(numericMid) || numericMid < 3) return undefined;
	const slot = (numericMid - 3) % 3;
	return slot === 0 ? 'audio' : slot === 1 ? 'camera' : 'screen';
};

const getUserIdFromMsidPart = (msidPart: string) => /(?:^|-)u(\d+)(?:-|$)/.exec(msidPart)?.[1];

const getUserIdsByMidFromSdp = (sdp: string) => {
	const userIdsByMid = new Map<string, string>();
	let currentMid: string | undefined;

	for (const line of sdp.split(/\r?\n/)) {
		if (line.startsWith('m=')) currentMid = undefined;
		else if (line.startsWith('a=mid:')) currentMid = line.slice('a=mid:'.length).trim();
		else if (currentMid && line.startsWith('a=msid:')) {
			const msidParts = line.slice('a=msid:'.length).trim().split(/\s+/);
			const userId = msidParts.map(getUserIdFromMsidPart).find(Boolean);
			if (userId) userIdsByMid.set(currentMid, userId);
		}
	}

	return userIdsByMid;
};

const getPeerDebugSnapshot = (pc: RTCPeerConnection) => ({
	connectionState: pc.connectionState,
	iceConnectionState: pc.iceConnectionState,
	signalingState: pc.signalingState,
	transceivers: pc.getTransceivers().map((transceiver) => ({
		mid: transceiver.mid,
		direction: transceiver.direction,
		currentDirection: transceiver.currentDirection,
		sender: transceiver.sender.track
			? {
					kind: transceiver.sender.track.kind,
					trackId: transceiver.sender.track.id,
					enabled: transceiver.sender.track.enabled,
					readyState: transceiver.sender.track.readyState
				}
			: null,
		receiver: {
			kind: transceiver.receiver.track.kind,
			trackId: transceiver.receiver.track.id,
			muted: transceiver.receiver.track.muted,
			readyState: transceiver.receiver.track.readyState
		}
	}))
});

const stabilizeInactiveVideoSections = (offerSdp: string, currentRemoteSdp?: string) => {
	if (!currentRemoteSdp) return offerSdp;

	const splitSections = (sdp: string) => {
		const lines = sdp.split(/\r?\n/).filter(Boolean);
		const sessionLines: string[] = [];
		const mediaSections: string[][] = [];
		for (const line of lines) {
			if (line.startsWith('m=')) mediaSections.push([line]);
			else if (mediaSections.length) mediaSections[mediaSections.length - 1].push(line);
			else sessionLines.push(line);
		}
		return { sessionLines, mediaSections };
	};
	const getMid = (section: string[]) => section.find((line) => line.startsWith('a=mid:'))?.slice('a=mid:'.length);
	const isCodecLine = (line: string) => line.startsWith('a=rtpmap:') || line.startsWith('a=fmtp:') || line.startsWith('a=rtcp-fb:');

	const previous = splitSections(currentRemoteSdp);
	const previousByMid = new Map(previous.mediaSections.map((section) => [getMid(section), section]));
	const next = splitSections(offerSdp);
	let changed = false;

	const stabilizedSections = next.mediaSections.map((section) => {
		if (!section[0]?.startsWith('m=video ') || !section.includes('a=inactive')) return section;
		const mid = getMid(section);
		const previousSection = mid ? previousByMid.get(mid) : undefined;
		if (!previousSection?.[0]?.startsWith('m=video ')) return section;

		const previousCodecLines = previousSection.filter(isCodecLine);
		if (!previousCodecLines.length) return section;

		const stabilized = section.filter((line) => !isCodecLine(line));
		stabilized[0] = previousSection[0];
		const codecInsertIndex = stabilized.findIndex((line) => line === 'a=rtcp-mux');
		stabilized.splice(codecInsertIndex >= 0 ? codecInsertIndex + 1 : stabilized.length, 0, ...previousCodecLines);
		changed = true;
		return stabilized;
	});

	if (!changed) return offerSdp;
	return `${[...next.sessionLines, ...stabilizedSections.flat()].join('\r\n')}\r\n`;
};

const useSpeaking = (track?: MediaStreamTrack, enabled = true) => {
	const [speaking, setSpeaking] = useState(false);
	useEffect(() => {
		if (!track || !enabled) {
			setSpeaking(false);
			return;
		}
		let frame = 0;
		let lastSpeaking = false;
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(new MediaStream([track]));
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);
		const frequencies = new Uint8Array(analyser.frequencyBinCount);
		const tick = () => {
			analyser.getByteFrequencyData(frequencies);
			const average = frequencies.reduce((sum, value) => sum + value, 0) / frequencies.length;
			const nextSpeaking = average > 12;
			if (nextSpeaking !== lastSpeaking) {
				lastSpeaking = nextSpeaking;
				setSpeaking(nextSpeaking);
			}
			frame = requestAnimationFrame(tick);
		};
		tick();
		return () => {
			cancelAnimationFrame(frame);
			source.disconnect();
			analyser.disconnect();
			void audioContext.close();
		};
	}, [enabled, track]);
	return speaking;
};

const Video = ({
	stream,
	muted = false,
	mirrored = false,
	fit = 'cover',
	keepLastFrame = false,
	onFrameStateChange
}: {
	stream: MediaStream;
	muted?: boolean;
	mirrored?: boolean;
	fit?: 'cover' | 'contain';
	keepLastFrame?: boolean;
	onFrameStateChange?: (hasRecentFrame: boolean) => void;
}) => {
	const ref = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		video.srcObject = stream;
		video.play().catch(() => undefined);
		if (!onFrameStateChange) return;

		if (!video.requestVideoFrameCallback) {
			const markFrameAvailable = () => onFrameStateChange(true);
			const markFrameUnavailable = () => onFrameStateChange(false);
			onFrameStateChange(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
			video.addEventListener('loadeddata', markFrameAvailable);
			video.addEventListener('playing', markFrameAvailable);
			video.addEventListener('timeupdate', markFrameAvailable);
			video.addEventListener('emptied', markFrameUnavailable);
			return () => {
				video.removeEventListener('loadeddata', markFrameAvailable);
				video.removeEventListener('playing', markFrameAvailable);
				video.removeEventListener('timeupdate', markFrameAvailable);
				video.removeEventListener('emptied', markFrameUnavailable);
			};
		}

		let disposed = false;
		let frameCallbackId = 0;
		let noFrameTimer = 0;
		const markNoFrame = () => onFrameStateChange(false);
		const handleFrame: VideoFrameRequestCallback = () => {
			if (disposed) return;
			onFrameStateChange(true);
			window.clearTimeout(noFrameTimer);
			if (!keepLastFrame) noFrameTimer = window.setTimeout(markNoFrame, REMOTE_VIDEO_NO_FRAME_TIMEOUT_MS);
			frameCallbackId = video.requestVideoFrameCallback(handleFrame);
		};
		onFrameStateChange(false);
		frameCallbackId = video.requestVideoFrameCallback(handleFrame);

		return () => {
			disposed = true;
			window.clearTimeout(noFrameTimer);
			video.cancelVideoFrameCallback(frameCallbackId);
		};
	}, [keepLastFrame, onFrameStateChange, stream]);
	return (
		<video
			ref={ref}
			autoPlay
			playsInline
			muted={muted}
			className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${mirrored ? '-scale-x-100' : ''}`}
		/>
	);
};

const RemoteAudioTrack = ({ track }: { track: MediaStreamTrack }) => {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.srcObject = new MediaStream([track]);
		void element.play().catch(() => undefined);

		return () => {
			element.srcObject = null;
		};
	}, [track]);

	return <audio ref={ref} autoPlay playsInline />;
};

const RoomAudioRenderer = ({ participants }: { participants: RemoteMedia[] }) => {
	return (
		<div style={{ display: 'none' }}>
			{participants.map((participant) =>
				participant.audio ? <RemoteAudioTrack key={`${participant.id}-${participant.audio.id}`} track={participant.audio} /> : null
			)}
		</div>
	);
};

const RemoteScreenTrackMonitor = ({
	participantId,
	track,
	onActiveChange
}: {
	participantId: string;
	track: MediaStreamTrack;
	onActiveChange: (participantId: string, track: MediaStreamTrack, active: boolean) => void;
}) => {
	const stream = useMemo(() => new MediaStream([track]), [track]);
	const handleFrameStateChange = useCallback(
		(hasRecentFrame: boolean) => onActiveChange(participantId, track, hasRecentFrame),
		[onActiveChange, participantId, track]
	);

	return (
		<div className="pointer-events-none fixed h-px w-px opacity-0">
			<Video stream={stream} muted onFrameStateChange={handleFrameStateChange} />
		</div>
	);
};

interface ParticipantTileProps {
	participant: RemoteMedia;
	displayName: string;
	avatar?: string;
}

const ParticipantTile = ({ participant, displayName, avatar }: ParticipantTileProps) => {
	const speaking = useSpeaking(participant.audio);
	const [hasRecentVideoFrame, setHasRecentVideoFrame] = useState(false);
	const remoteVideoStream = useMemo(() => (participant.video ? new MediaStream([participant.video]) : undefined), [participant.video]);
	const handleVideoFrameStateChange = useCallback((hasRecentFrame: boolean) => setHasRecentVideoFrame(hasRecentFrame), []);
	// Chrome may keep a resumed receiver track muted briefly even while decoded
	// frames are already available. The frame callback is the reliable render signal.
	const showVideo = Boolean(participant.video?.readyState === 'live' && hasRecentVideoFrame);
	return (
		<div
			className={`relative aspect-video overflow-hidden rounded-xl border-2 bg-[#181825] transition-[border-color,box-shadow] duration-150 ${
				speaking ? 'border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]' : 'border-transparent'
			}`}
		>
			{remoteVideoStream && (
				<div className={`absolute inset-0 ${showVideo ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
					<Video stream={remoteVideoStream} onFrameStateChange={handleVideoFrameStateChange} />
				</div>
			)}
			{!showVideo && (
				<div className="flex h-full items-center justify-center bg-[#5d5f66]">
					<AvatarImage
						username={displayName}
						alt={displayName}
						src={avatar}
						srcImgProxy={avatar ? createImgproxyUrl(avatar) : undefined}
						className="!h-20 !w-20 !min-h-20 !min-w-20"
					/>
				</div>
			)}
			<span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs">
				{!participant.audio || participant.audio.muted ? <Icons.VoiceMicDisabledIcon /> : null}
				{displayName}
			</span>
		</div>
	);
};

const ScreenShareTile = ({ participant, displayName }: Pick<ParticipantTileProps, 'participant' | 'displayName'>) => {
	const [hasRecentVideoFrame, setHasRecentVideoFrame] = useState(false);
	const stream = useMemo(() => (participant.screen ? new MediaStream([participant.screen]) : undefined), [participant.screen]);
	const handleVideoFrameStateChange = useCallback((hasRecentFrame: boolean) => setHasRecentVideoFrame(hasRecentFrame), []);
	const showVideo = Boolean(participant.screen?.readyState === 'live' && hasRecentVideoFrame);
	if (!stream) return null;

	return (
		<div className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-[#5d5f66]">
			<div className={`absolute inset-0 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
				<Video stream={stream} fit="contain" keepLastFrame onFrameStateChange={handleVideoFrameStateChange} />
			</div>
			{!showVideo && <div className="flex h-full items-center justify-center bg-[#5d5f66] text-sm text-zinc-300">Loading screen share…</div>}
			<span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs">{displayName} — Screen</span>
		</div>
	);
};

const buttonClass = 'flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40';
const DEFAULT_VIDEO_CODEC = 'VP8';
const REMOTE_VIDEO_NO_FRAME_TIMEOUT_MS = 1000;

type ScreenCaptureController = {
	setFocusBehavior: (behavior: 'focus-capturing-application' | 'focus-captured-surface' | 'no-focus-change') => void;
};

interface SfuDeviceMenuProps {
	label: string;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onSelect: (deviceId: string) => void;
}

const SfuDeviceMenu = ({ label, devices, selectedDeviceId, onSelect }: SfuDeviceMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const closeMenu = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener('mousedown', closeMenu);
		return () => document.removeEventListener('mousedown', closeMenu);
	}, [isOpen]);

	return (
		<div ref={menuRef} className="absolute bottom-0 right-0 z-30">
			<button
				type="button"
				title={label}
				aria-label={label}
				className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-900"
				onClick={(event) => {
					event.stopPropagation();
					setIsOpen((value) => !value);
				}}
			>
				{isOpen ? <Icons.VoiceArowUpIcon className="h-3 w-3" /> : <Icons.VoiceArowDownIcon className="h-3 w-3" />}
			</button>
			{isOpen && (
				<div className="absolute bottom-7 right-0 min-w-[280px] rounded-lg bg-zinc-800 p-2 text-white shadow-2xl">
					<p className="px-2 pb-2 text-xs font-semibold uppercase text-zinc-400">{label}</p>
					{devices.length ? (
						devices.map((device) => (
							<button
								key={device.deviceId}
								type="button"
								className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-zinc-700"
								onClick={() => {
									onSelect(device.deviceId);
									setIsOpen(false);
								}}
							>
								<span className="max-w-[220px] truncate">{device.label || label}</span>
								{device.deviceId === selectedDeviceId && <span className="text-blue-400">●</span>}
							</button>
						))
					) : (
						<p className="px-3 py-2 text-sm text-zinc-400">No devices found</p>
					)}
				</div>
			)}
		</div>
	);
};

const setDefaultVideoCodec = (transceiver: RTCRtpTransceiver) => {
	if (typeof transceiver.setCodecPreferences !== 'function') return false;
	const capabilities = RTCRtpSender.getCapabilities?.('video');
	if (!capabilities?.codecs) return false;

	const vp8Codecs = capabilities.codecs.filter((codec) => codec.mimeType.toUpperCase() === `VIDEO/${DEFAULT_VIDEO_CODEC}`);
	const rtxCodecs = capabilities.codecs.filter((codec) => codec.mimeType.toLowerCase() === 'video/rtx');
	if (!vp8Codecs.length) return false;

	transceiver.setCodecPreferences([...vp8Codecs, ...rtxCodecs]);
	return true;
};

export interface MezonSfuVoiceRoomProps {
	token: string;
	roomId: string;
	serverUrl: string;
	channelLabel: string;
	isChatOpen: boolean;
	isFullScreen: boolean;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onToggleChat: () => void;
}

export function MezonSfuVoiceRoom({
	token,
	roomId,
	serverUrl,
	channelLabel,
	isChatOpen,
	isFullScreen,
	onLeaveRoom,
	onFullScreen,
	onToggleChat
}: MezonSfuVoiceRoomProps) {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();
	const currentUserId = useSelector(selectCurrentUserId);
	const clanMembers = useSelector(selectEntitesUserClans);
	const microphoneEnabled = useSelector(selectShowMicrophone);
	const cameraEnabled = useSelector(selectShowCamera);
	const { hasMicrophoneAccess, hasCameraAccess } = useMediaPermissions();
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
	const localTracksAddedRef = useRef(false);
	const negotiatingRef = useRef(false);
	const joinedRef = useRef(false);
	const pendingOfferRef = useRef<string | null>(null);
	const peerLeftPendingOfferRef = useRef(false);
	const leftRemoteMidsRef = useRef(new Set<string>());
	const userIdsByMidRef = useRef(new Map<string, string>());
	const desiredMediaRef = useRef({ microphoneEnabled, cameraEnabled });
	const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
	const [error, setError] = useState<string>();
	const [localPreview, setLocalPreview] = useState<MediaStream>();
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack>();
	const [remoteMedia, setRemoteMedia] = useState<Map<string, RemoteMedia>>(() => new Map());
	const [roomParticipantCount, setRoomParticipantCount] = useState(1);
	const [screenSharing, setScreenSharing] = useState(false);
	const [isGridView, setIsGridView] = useState(true);
	const [pinnedTrackId, setPinnedTrackId] = useState<string>();
	const [showFocusThumbnails, setShowFocusThumbnails] = useState(true);
	const [showEmojiPanel, setShowEmojiPanel] = useState(false);
	const [showSoundPanel, setShowSoundPanel] = useState(false);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedMicrophone, setSelectedMicrophone] = useState('default');
	const [selectedCamera, setSelectedCamera] = useState('default');
	const lastShownErrorRef = useRef<string>();

	useEffect(() => {
		if (hasMicrophoneAccess === false && microphoneEnabled) {
			dispatch(voiceActions.setShowMicrophone(false));
		}
		if (hasCameraAccess === false && cameraEnabled) {
			dispatch(voiceActions.setShowCamera(false));
		}
	}, [cameraEnabled, dispatch, hasCameraAccess, hasMicrophoneAccess, microphoneEnabled]);

	useEffect(() => {
		if (!error || lastShownErrorRef.current === error) return;
		lastShownErrorRef.current = error;
		// eslint-disable-next-line no-console
		console.error('[MezonSFU]', error);
		dispatch(toastActions.addToast({ message: error, type: 'error', autoClose: 3000 }));
	}, [dispatch, error]);

	const findUplinkVideoSender = useCallback((mid = '1') => {
		const pc = pcRef.current;
		if (!pc) return null;
		const transceiver =
			pc.getTransceivers().find((item) => item.mid === mid) ||
			(mid === '1'
				? pc.getTransceivers().find((item) => item.sender.track?.kind === 'video') ||
					pc
						.getTransceivers()
						.find(
							(item) =>
								item.receiver.track.kind === 'video' &&
								(item.direction === 'sendonly' || item.direction === 'sendrecv' || item.direction === 'inactive')
						)
				: undefined);
		return transceiver?.sender || null;
	}, []);

	const applyScreenEncodingParams = useCallback(async (sender: RTCRtpSender) => {
		try {
			const parameters = sender.getParameters();
			if (!parameters.encodings?.length) parameters.encodings = [{}];
			const encoding = parameters.encodings[0] as RTCRtpEncodingParameters & { scalabilityMode?: string };
			delete encoding.scalabilityMode;
			encoding.maxFramerate = 15;
			encoding.maxBitrate = 2_500_000;
			encoding.scaleResolutionDownBy = 1;
			encoding.priority = 'high';
			encoding.networkPriority = 'high';
			await sender.setParameters(parameters);
		} catch {
			// Keep the existing sender parameters when the browser rejects an optional encoding setting.
		}
	}, []);

	const syncRemoteMedia = useCallback((pc: RTCPeerConnection) => {
		setRemoteMedia((current) => {
			const next = new Map(current);
			for (const transceiver of pc.getTransceivers()) {
				const mid = transceiver.mid;
				if (!mid || mid === '0' || mid === '1' || mid === '2' || leftRemoteMidsRef.current.has(mid)) continue;
				const track = transceiver.receiver.track;
				if (!track || track.readyState === 'ended') continue;
				const direction = transceiver.currentDirection || transceiver.direction;
				const id = getRemoteParticipantId(mid);
				const mediaKind = getRemoteMediaKind(mid);
				if (direction === 'inactive' || direction === 'stopped') {
					const inactiveParticipant = next.get(id);
					if (inactiveParticipant) {
						if (track.kind === 'audio' && inactiveParticipant.audio === track) inactiveParticipant.audio = undefined;
						if (mediaKind === 'camera' && inactiveParticipant.video === track) inactiveParticipant.video = undefined;
						if (mediaKind === 'screen' && inactiveParticipant.screen === track) inactiveParticipant.screen = undefined;
						next.set(id, inactiveParticipant);
					}
					continue;
				}
				const participant = next.get(id) || { id };
				participant.userId = userIdsByMidRef.current.get(mid) || participant.userId;
				if (track.kind === 'audio') participant.audio = track;
				if (mediaKind === 'camera') participant.video = track;
				if (mediaKind === 'screen') {
					if (participant.screen !== track) participant.screenActive = false;
					participant.screen = track;
				}
				if (!participant.audio && !participant.video && !participant.screen) next.delete(id);
				else next.set(id, participant);
			}
			return next;
		});
	}, []);

	useEffect(() => {
		desiredMediaRef.current = { microphoneEnabled, cameraEnabled };
		void (async () => {
			let audioTrack = localStreamRef.current?.getAudioTracks()[0];
			if (microphoneEnabled && audioTrack?.readyState !== 'live') {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
					audioTrack = stream.getAudioTracks()[0];
					if (audioTrack) {
						const localStream = localStreamRef.current || new MediaStream();
						localStream.getAudioTracks().forEach((track) => localStream.removeTrack(track));
						localStream.addTrack(audioTrack);
						localStreamRef.current = localStream;
						setLocalAudioTrack(audioTrack);
						setSelectedMicrophone(audioTrack.getSettings().deviceId || 'default');
						setLocalPreview(new MediaStream(localStream.getTracks()));
					}
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : 'Unable to access microphone');
				}
			}

			if (audioTrack) {
				audioTrack.enabled = desiredMediaRef.current.microphoneEnabled;
				const audioSender = pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
				if (audioSender) await audioSender.replaceTrack(desiredMediaRef.current.microphoneEnabled ? audioTrack : null);
			}
			if (joinedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: 'mute', is_mute: !desiredMediaRef.current.microphoneEnabled }));
			}
		})();
	}, [cameraEnabled, microphoneEnabled]);

	useEffect(() => {
		const ws = wsRef.current;

		void (async () => {
			try {
				let cameraTrack = cameraTrackRef.current;
				if (cameraEnabled && cameraTrack?.readyState !== 'live') {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: CAMERA_CAPTURE_CONSTRAINTS });
					cameraTrack = stream.getVideoTracks()[0];
					if (cameraTrack) {
						const localStream = localStreamRef.current || new MediaStream();
						localStream.getVideoTracks().forEach((track) => localStream.removeTrack(track));
						localStream.addTrack(cameraTrack);
						localStreamRef.current = localStream;
						cameraTrackRef.current = cameraTrack;
						setSelectedCamera(cameraTrack.getSettings().deviceId || 'default');
						setLocalPreview(new MediaStream(localStream.getTracks()));
					}
				}

				if (!cameraTrack) return;
				cameraTrack.enabled = desiredMediaRef.current.cameraEnabled;
				const videoSender = findUplinkVideoSender();
				if (!videoSender) throw new Error('Video sender is not negotiated');
				await videoSender.replaceTrack(desiredMediaRef.current.cameraEnabled ? cameraTrack : null);
			} catch (cause) {
				// eslint-disable-next-line no-console
				console.error('[MezonSFU][camera] replaceTrack failed', cause);
			}

			const signal = { type: desiredMediaRef.current.cameraEnabled ? 'publish' : 'unpublish' } as const;
			if (joinedRef.current && ws?.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(signal));
			} else {
				// eslint-disable-next-line no-console
				console.error('[MezonSFU][camera] signaling not sent: WebSocket is not open', {
					signal,
					wsReadyState: ws?.readyState
				});
			}
		})();
	}, [cameraEnabled, findUplinkVideoSender]);

	useEffect(() => {
		const refreshDevices = async () => setDevices(await navigator.mediaDevices.enumerateDevices());
		void refreshDevices();
		navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
		return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
	}, [localPreview]);

	const changeInputDevice = useCallback(
		async (kind: 'audioinput' | 'videoinput', deviceId: string) => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : false,
					video: kind === 'videoinput' ? { ...CAMERA_CAPTURE_CONSTRAINTS, deviceId: { exact: deviceId } } : false
				});
				const nextTrack = kind === 'audioinput' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
				const localStream = localStreamRef.current;
				if (!nextTrack || !localStream) return;

				if (kind === 'audioinput') {
					const previousTrack = localStream.getAudioTracks()[0];
					nextTrack.enabled = microphoneEnabled;
					await pcRef.current
						?.getTransceivers()
						.find((item) => item.mid === '0')
						?.sender.replaceTrack(microphoneEnabled ? nextTrack : null);
					if (previousTrack) {
						localStream.removeTrack(previousTrack);
						previousTrack.stop();
					}
					localStream.addTrack(nextTrack);
					setLocalAudioTrack(nextTrack);
					setSelectedMicrophone(deviceId);
				} else {
					const previousTrack = cameraTrackRef.current;
					nextTrack.enabled = cameraEnabled;
					cameraTrackRef.current = nextTrack;
					await findUplinkVideoSender()?.replaceTrack(nextTrack);
					if (previousTrack) {
						localStream.removeTrack(previousTrack);
						previousTrack.stop();
					}
					localStream.addTrack(nextTrack);
					if (!screenStreamRef.current) setLocalPreview(new MediaStream(localStream.getTracks()));
					setSelectedCamera(deviceId);
				}
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : 'Unable to switch device');
			}
		},
		[cameraEnabled, findUplinkVideoSender, microphoneEnabled]
	);

	useEffect(() => {
		let disposed = false;
		let removeVisibilityListener: () => void = () => undefined;

		const prepareLocalMedia = async () => {
			let stream: MediaStream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: CAMERA_CAPTURE_CONSTRAINTS
				});
			} catch {
				try {
					stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
				} catch {
					stream = new MediaStream();
				}
			}
			if (disposed) {
				stream.getTracks().forEach((track) => track.stop());
				return stream;
			}
			const audioTrack = stream.getAudioTracks()[0];
			const videoTrack = stream.getVideoTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = desiredMediaRef.current.microphoneEnabled;
				setSelectedMicrophone(audioTrack.getSettings().deviceId || 'default');
			}
			setLocalAudioTrack(audioTrack);
			if (videoTrack) {
				videoTrack.enabled = desiredMediaRef.current.cameraEnabled;
				cameraTrackRef.current = videoTrack;
				setSelectedCamera(videoTrack.getSettings().deviceId || 'default');
			}
			localStreamRef.current = stream;
			setLocalPreview(stream);
			return stream;
		};

		const pc = new RTCPeerConnection({ iceServers: [] });
		pcRef.current = pc;
		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') setConnectionState('connected');
			else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') setConnectionState('disconnected');
		};
		pc.ontrack = ({ track, transceiver, streams }) => {
			const mid = transceiver.mid;
			if (mid && leftRemoteMidsRef.current.has(mid)) return;
			const id = mid ? getRemoteParticipantId(mid) : `track-${track.id}`;
			const mediaKind = mid ? getRemoteMediaKind(mid) : undefined;
			const logTrackEvent = (event: 'ontrack' | 'mute' | 'unmute' | 'ended') => {
				// eslint-disable-next-line no-console
				console.info(`[MezonSFU][remote track] ${event}`, {
					mid,
					mediaKind,
					participantId: id,
					trackId: track.id,
					kind: track.kind,
					muted: track.muted,
					readyState: track.readyState,
					streamIds: streams.map((stream) => stream.id)
				});
			};
			logTrackEvent('ontrack');
			const addTrack = () => {
				setRemoteMedia((current) => {
					const next = new Map(current);
					const participant = next.get(id) || { id };
					participant.userId = (mid && userIdsByMidRef.current.get(mid)) || participant.userId;
					if (track.kind === 'audio') participant.audio = track;
					if (mediaKind === 'camera') participant.video = track;
					if (mediaKind === 'screen') {
						if (participant.screen !== track) participant.screenActive = false;
						participant.screen = track;
					}
					next.set(id, participant);
					return next;
				});
			};
			const removeTrack = () => {
				setRemoteMedia((current) => {
					const next = new Map(current);
					const participant = next.get(id);
					if (!participant) return next;
					if (track.kind === 'audio' && participant.audio === track) participant.audio = undefined;
					if (mediaKind === 'camera' && participant.video === track) participant.video = undefined;
					if (mediaKind === 'screen' && participant.screen === track) participant.screen = undefined;
					if (!participant.audio && !participant.video && !participant.screen) next.delete(id);
					else next.set(id, participant);
					return next;
				});
			};

			if (mediaKind === 'screen') {
				addTrack();
				track.addEventListener('unmute', () => {
					logTrackEvent('unmute');
				});
				track.addEventListener('mute', () => {
					logTrackEvent('mute');
					setRemoteMedia((current) => {
						const next = new Map(current);
						const participant = next.get(id);
						if (participant?.screen === track) next.set(id, { ...participant, screenActive: false });
						return next;
					});
				});
				track.addEventListener('ended', () => {
					logTrackEvent('ended');
					removeTrack();
				});
				return;
			}

			addTrack();
			track.addEventListener('mute', () => {
				logTrackEvent('mute');
				setRemoteMedia((current) => new Map(current));
			});
			track.addEventListener('unmute', () => {
				logTrackEvent('unmute');
				setRemoteMedia((current) => new Map(current));
			});
			track.addEventListener('ended', () => {
				logTrackEvent('ended');
				removeTrack();
			});
		};

		const handleOffer = async (sdp: string): Promise<void> => {
			if (negotiatingRef.current) {
				pendingOfferRef.current = sdp;
				return;
			}
			negotiatingRef.current = true;
			try {
				userIdsByMidRef.current = new Map([...userIdsByMidRef.current, ...getUserIdsByMidFromSdp(sdp)]);
				if (peerLeftPendingOfferRef.current) {
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][remaining peer] offer received after peer_left', {
						peer: getPeerDebugSnapshot(pc),
						sdp
					});
					peerLeftPendingOfferRef.current = false;
				}
				const localStream = localStreamRef.current || (await prepareLocalMedia());
				const stabilizedSdp = stabilizeInactiveVideoSections(sdp, pc.currentRemoteDescription?.sdp);
				await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: stabilizedSdp }));
				const uplinkVideoTransceiver = pc.getTransceivers().find((item) => item.mid === '1');
				if (uplinkVideoTransceiver) setDefaultVideoCodec(uplinkVideoTransceiver);
				if (!localTracksAddedRef.current) {
					const audioTrack = localStream.getAudioTracks()[0];
					const cameraTrack = localStream.getVideoTracks()[0];
					const videoTrack = cameraTrack || null;
					const audioTransceiver = pc.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
					const videoTransceiver = uplinkVideoTransceiver;
					if (audioTransceiver) {
						await audioTransceiver.sender.replaceTrack(desiredMediaRef.current.microphoneEnabled ? audioTrack || null : null);
						audioTransceiver.direction = 'sendonly';
					}
					if (videoTransceiver) {
						await videoTransceiver.sender.replaceTrack(videoTrack);
						videoTransceiver.direction = 'sendonly';
					}
					const screenTrack = screenStreamRef.current?.getVideoTracks()[0] || null;
					const screenTransceiver = pc.getTransceivers().find((item) => item.mid === '2');
					if (screenTransceiver && screenTrack) {
						await screenTransceiver.sender.replaceTrack(screenTrack);
						screenTransceiver.direction = 'sendonly';
					}
					localTracksAddedRef.current = true;
				} else if (screenStreamRef.current) {
					const screenTrack = screenStreamRef.current.getVideoTracks()[0];
					const sender = findUplinkVideoSender('2');
					if (screenTrack && sender && sender.track !== screenTrack) {
						await sender.replaceTrack(screenTrack);
						await applyScreenEncodingParams(sender);
					}
				}
				await pc.setLocalDescription(await pc.createAnswer());
				syncRemoteMedia(pc);
				if (wsRef.current?.readyState === WebSocket.OPEN && pc.localDescription?.sdp) {
					wsRef.current.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription.sdp }));
				}
				// Attach the camera while creating the first answer so its SSRC is
				// negotiated, then detach it when camera is off. Keeping a disabled
				// track attached can produce black frames that look like live video.
				if (!desiredMediaRef.current.cameraEnabled) {
					await findUplinkVideoSender()?.replaceTrack(null);
				}
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : 'WebRTC negotiation failed');
				setConnectionState('failed');
			} finally {
				negotiatingRef.current = false;
				const pending = pendingOfferRef.current;
				pendingOfferRef.current = null;
				if (pending && !disposed) await handleOffer(pending);
			}
		};

		void prepareLocalMedia().finally(() => {
			if (disposed) return;
			const secureServerUrl =
				window.location.protocol === 'https:' && serverUrl.startsWith('ws://') ? `wss://${serverUrl.slice(5)}` : serverUrl;
			const wsUrl = new URL(secureServerUrl);
			wsUrl.searchParams.set('access_token', token);
			const ws = new WebSocket(wsUrl.toString());
			wsRef.current = ws;
			ws.onopen = () => {
				setError(undefined);
				setConnectionState('joining');
				ws.send(JSON.stringify({ type: 'join', room: roomId, token, role: 'speaker' }));
				const sendVisibility = () => {
					if (joinedRef.current && ws.readyState === WebSocket.OPEN)
						ws.send(JSON.stringify({ type: 'visibility', visible: document.visibilityState === 'visible' }));
				};
				document.addEventListener('visibilitychange', sendVisibility);
				removeVisibilityListener = () => document.removeEventListener('visibilitychange', sendVisibility);
			};
			ws.onmessage = ({ data }) => {
				let message: SignalMessage;
				try {
					message = JSON.parse(data) as SignalMessage;
				} catch {
					return;
				}
				// eslint-disable-next-line no-console
				console.info('[MezonSFU][signaling parsed]', message);
				if (typeof message.participant_count === 'number') {
					setRoomParticipantCount(message.participant_count);
				}
				if (message.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
				if (message.type === 'joined') {
					setError(undefined);
					setConnectionState('awaiting offer');
				}
				if (message.type === 'room_snapshot' && !joinedRef.current) {
					joinedRef.current = true;
					ws.send(JSON.stringify({ type: 'mute', is_mute: !desiredMediaRef.current.microphoneEnabled }));
					ws.send(JSON.stringify({ type: desiredMediaRef.current.cameraEnabled ? 'publish' : 'unpublish' }));
					ws.send(JSON.stringify({ type: 'visibility', visible: document.visibilityState === 'visible' }));
				}
				if (message.type === 'offer' && message.sdp) void handleOffer(message.sdp);
				if (message.type === 'peer_left') {
					peerLeftPendingOfferRef.current = true;
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][remaining peer] peer_left received', {
						message,
						peer: getPeerDebugSnapshot(pc)
					});
					const mids = [message.mid_audio, message.mid_video, message.mid_screen]
						.filter((mid) => mid != null && String(mid) !== '0')
						.map(String);
					setRemoteMedia((current) => {
						const next = new Map(current);
						mids.forEach((mid) => {
							leftRemoteMidsRef.current.add(mid);
							next.delete(getRemoteParticipantId(mid));
						});
						return next;
					});
				}
				if (message.type === 'error') {
					// eslint-disable-next-line no-console
					console.error('[MezonSFU] server error', message);
					setError(message.message || 'SFU signaling error');
					setConnectionState('failed');
				}
			};
			ws.onerror = () => {
				setError('Unable to connect to SFU signaling');
				setConnectionState('failed');
			};
			ws.onclose = () => {
				if (!disposed) setConnectionState('disconnected');
			};
		});

		return () => {
			disposed = true;
			// A leave is currently signaled by closing the WebSocket; no explicit
			// { type: 'leave' } message is sent to the SFU.
			// eslint-disable-next-line no-console
			console.info('[MezonSFU][leaving peer] closing signaling connection', {
				wsReadyState: wsRef.current?.readyState,
				peersFromSdp: Array.from(userIdsByMidRef.current, ([mid, userId]) => ({ mid, userId }))
			});
			removeVisibilityListener();
			wsRef.current?.close();
			pc.close();
			localStreamRef.current?.getTracks().forEach((track) => track.stop());
			screenStreamRef.current?.getTracks().forEach((track) => track.stop());
			wsRef.current = null;
			pcRef.current = null;
			joinedRef.current = false;
			localTracksAddedRef.current = false;
			negotiatingRef.current = false;
			pendingOfferRef.current = null;
		};
	}, [applyScreenEncodingParams, findUplinkVideoSender, roomId, serverUrl, syncRemoteMedia, token]);

	const toggleScreenShare = async () => {
		const pc = pcRef.current;
		if (!pc) return;
		const sender = findUplinkVideoSender('2');
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => {
				track.onended = null;
				track.stop();
			});
			screenStreamRef.current = null;
			if (sender) {
				await sender.replaceTrack(null);
				const transceiver = pc.getTransceivers().find((item) => item.sender === sender);
				if (transceiver && transceiver.direction !== 'recvonly' && transceiver.direction !== 'inactive') {
					transceiver.direction = 'recvonly';
				}
			}
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: 'share_screen', active: false }));
			}
			setScreenSharing(false);
			setLocalPreview(localStreamRef.current || undefined);
			return;
		}
		try {
			const CaptureControllerConstructor = (window as typeof window & { CaptureController?: new () => ScreenCaptureController })
				.CaptureController;
			const captureController = CaptureControllerConstructor ? new CaptureControllerConstructor() : undefined;
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: SCREEN_SHARE_CAPTURE_CONSTRAINTS,
				audio: false,
				...(captureController ? { controller: captureController } : {})
			} as DisplayMediaStreamOptions);
			try {
				captureController?.setFocusBehavior('focus-capturing-application');
			} catch {
				// Browsers may expose CaptureController without conditional focus.
			}
			window.focus();
			const track = stream.getVideoTracks()[0];
			if (!track) throw new Error('Unable to get the screen track');
			track.contentHint = 'detail';
			screenStreamRef.current = stream;
			if (sender) {
				await sender.replaceTrack(track);
				const transceiver = pc.getTransceivers().find((item) => item.sender === sender);
				if (transceiver && transceiver.direction !== 'sendonly' && transceiver.direction !== 'sendrecv') {
					transceiver.direction = 'sendonly';
				}
				await applyScreenEncodingParams(sender);
			}
			setScreenSharing(true);
			wsRef.current?.send(JSON.stringify({ type: 'share_screen', active: true }));
			track.onended = () => void toggleScreenShare();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to share the screen');
		}
	};

	const setRemoteScreenActive = useCallback((participantId: string, track: MediaStreamTrack, active: boolean) => {
		setRemoteMedia((current) => {
			const participant = current.get(participantId);
			if (!participant || participant.screen !== track || participant.screenActive === active) return current;
			const next = new Map(current);
			next.set(participantId, { ...participant, screenActive: active });
			return next;
		});
	}, []);
	const participants = Array.from(remoteMedia.values());
	const participantCount = Math.max(roomParticipantCount, participants.length + 1);
	const isSolo = participants.length === 0 && !screenSharing;
	const microphones = devices.filter((device) => device.kind === 'audioinput');
	const cameras = devices.filter((device) => device.kind === 'videoinput');
	const sendEmojiReaction = (emojiId: string, emoji: string) => {
		wsRef.current?.send(JSON.stringify({ type: 'reaction', reaction_type: 'emoji', emoji_id: emojiId, emoji }));
		setShowEmojiPanel(false);
	};
	const sendSoundReaction = (soundId: string, soundUrl: string) => {
		wsRef.current?.send(JSON.stringify({ type: 'reaction', reaction_type: 'sound', sound_id: soundId, sound_url: soundUrl }));
		setShowSoundPanel(false);
	};
	const getParticipantProfile = (participant: RemoteMedia) => {
		const member = participant.userId ? clanMembers[participant.userId] : undefined;
		return {
			displayName:
				getNameForPrioritize(member?.clan_nick, member?.user?.display_name, member?.user?.username) || participant.userId || participant.id,
			avatar: getAvatarForPrioritize(member?.clan_avatar, member?.user?.avatar_url)
		};
	};
	const localMember = currentUserId ? clanMembers[currentUserId] : undefined;
	const localDisplayName =
		getNameForPrioritize(localMember?.clan_nick, localMember?.user?.display_name, localMember?.user?.username) || currentUserId || 'Mezon';
	const localAvatar = getAvatarForPrioritize(localMember?.clan_avatar, localMember?.user?.avatar_url);
	const localSpeaking = useSpeaking(localAudioTrack, microphoneEnabled);
	const conferenceTiles: Array<{ id: string; content: ReactNode }> = [
		{
			id: 'local-camera',
			content: (
				<div
					className={`relative aspect-video overflow-hidden rounded-xl border-2 bg-[#181825] transition-[border-color,box-shadow] duration-150 ${
						localSpeaking ? 'border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]' : 'border-transparent'
					}`}
				>
					{localPreview && cameraEnabled ? (
						<Video stream={localPreview} muted mirrored />
					) : (
						<div className="flex h-full items-center justify-center bg-[#5d5f66]">
							<AvatarImage
								username={localDisplayName}
								alt={localDisplayName}
								src={localAvatar}
								srcImgProxy={localAvatar ? createImgproxyUrl(localAvatar) : undefined}
								className="!h-20 !w-20 !min-h-20 !min-w-20"
							/>
						</div>
					)}
					<span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs">
						{!microphoneEnabled ? <Icons.VoiceMicDisabledIcon /> : null}
						{localDisplayName}
					</span>
				</div>
			)
		}
	];
	if (screenSharing && screenStreamRef.current) {
		conferenceTiles.push({
			id: 'local-screen',
			content: (
				<div className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-[#5d5f66]">
					<Video stream={screenStreamRef.current} muted fit="contain" />
					<span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs">
						{t('usernameScreen', { username: localDisplayName })}
					</span>
				</div>
			)
		});
	}
	participants.forEach((participant) => {
		const profile = getParticipantProfile(participant);
		conferenceTiles.push({
			id: `${participant.id}-camera`,
			content: <ParticipantTile participant={participant} displayName={profile.displayName} avatar={profile.avatar} />
		});
		if (participant.screen && participant.screenActive) {
			conferenceTiles.push({
				id: `${participant.id}-screen`,
				content: <ScreenShareTile participant={participant} displayName={profile.displayName} />
			});
		}
	});
	const preferredFocusTrack = conferenceTiles.find((tile) => tile.id.endsWith('-screen'))?.id || conferenceTiles[0]?.id;
	const activePinnedTrackId = conferenceTiles.some((tile) => tile.id === pinnedTrackId) ? pinnedTrackId : preferredFocusTrack;
	const pinnedTile = conferenceTiles.find((tile) => tile.id === activePinnedTrackId);
	return (
		<div className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#11111b] text-white">
			<RoomAudioRenderer participants={participants} />
			{participants.map((participant) =>
				participant.screen ? (
					<RemoteScreenTrackMonitor
						key={participant.screen.id}
						participantId={participant.id}
						track={participant.screen}
						onActiveChange={setRemoteScreenActive}
					/>
				) : null
			)}
			<header className="relative z-20 flex h-[68px] shrink-0 items-center justify-between px-4 text-sm">
				<div className="flex items-center gap-2 text-[var(--bg-icon-theme)]">
					<Icons.Speaker defaultSize="h-6 w-6" defaultFill1="currentColor" defaultFill2="currentColor" defaultFill3="currentColor" />
					<strong className="text-base">{channelLabel || roomId}</strong>
					<span
						className={
							connectionState === 'connected' ? 'text-green-400' : connectionState === 'failed' ? 'text-red-400' : 'text-yellow-300'
						}
					>
						· {connectionState}
					</span>
				</div>
				<div className="flex items-center gap-4 text-[var(--bg-icon-theme)]">
					<NotificationTooltip />
					<button
						type="button"
						title={isGridView ? 'Switch to focus view' : 'Switch to grid view'}
						onClick={() => setIsGridView((value) => !value)}
					>
						{isGridView ? <Icons.VoiceFocusIcon /> : <Icons.VoiceGridIcon />}
					</button>
					<button type="button" title={t('chat')} className={isChatOpen ? 'text-[var(--bg-icon-theme-active)]' : ''} onClick={onToggleChat}>
						<Icons.Chat className="h-5 w-5" />
					</button>
				</div>
			</header>

			{isGridView ? (
				<main
					className={`grid min-h-0 flex-1 grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 p-4 ${
						isSolo ? 'grid-rows-[minmax(0,1fr)] overflow-hidden' : 'auto-rows-min overflow-y-auto'
					}`}
				>
					{conferenceTiles.map((tile) => (
						<button
							key={tile.id}
							type="button"
							className="min-w-0 text-left"
							title="Pin this track"
							onClick={() => {
								setPinnedTrackId(tile.id);
								setIsGridView(false);
							}}
						>
							{tile.content}
						</button>
					))}
				</main>
			) : (
				<main className="relative flex min-h-0 flex-1 flex-col gap-3 p-4">
					<div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#5d5f66]">
						<div className="h-full w-full min-h-0 min-w-0 [&>div]:!h-full [&>div]:!w-full [&>div]:!aspect-auto">
							{pinnedTile?.content}
						</div>
					</div>
					{conferenceTiles.length > 1 && (
						<>
							<button
								type="button"
								className={`absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-sm text-white shadow-lg transition-[bottom,background-color] hover:bg-zinc-800 ${
									showFocusThumbnails ? 'bottom-[9.25rem]' : 'bottom-3'
								}`}
								title={showFocusThumbnails ? 'Hide participants' : 'Show participants'}
								aria-label={showFocusThumbnails ? 'Hide participants' : 'Show participants'}
								onClick={() => setShowFocusThumbnails((value) => !value)}
							>
								{showFocusThumbnails ? (
									<Icons.VoiceArowDownIcon className="h-3 w-3" />
								) : (
									<Icons.VoiceArowUpIcon className="h-3 w-3" />
								)}
								<Icons.MemberList defaultFill="text-white" />
								<span>{participantCount}</span>
							</button>
							<div className={`${showFocusThumbnails ? 'flex' : 'hidden'} h-36 shrink-0 gap-3 overflow-x-auto pb-1`}>
								{conferenceTiles
									.filter((tile) => tile.id !== activePinnedTrackId)
									.map((tile) => (
										<button
											key={tile.id}
											type="button"
											className="w-56 shrink-0 overflow-hidden rounded-xl border-2 border-transparent text-left transition-colors hover:border-zinc-500"
											onClick={() => setPinnedTrackId(tile.id)}
										>
											{tile.content}
										</button>
									))}
							</div>
						</>
					)}
				</main>
			)}

			<footer className="relative z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#11111b] px-4 py-3">
				<div className="flex justify-start gap-4">
					<EmojiReactionControl
						isGridView={isGridView}
						showEmojiPanel={showEmojiPanel}
						onVisibleChange={setShowEmojiPanel}
						onEmojiSelect={sendEmojiReaction}
					/>
					<SoundReactionControl
						isGridView={isGridView}
						showSoundPanel={showSoundPanel}
						onVisibleChange={setShowSoundPanel}
						onSoundSelect={sendSoundReaction}
					/>
				</div>
				<div className="flex items-center justify-center gap-3">
					{hasMicrophoneAccess && (
						<div className="relative">
							<button
								id="btn-meet-micro"
								type="button"
								title={t(microphoneEnabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
								aria-label={t(microphoneEnabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
								className={buttonClass}
								onClick={() => dispatch(voiceActions.setShowMicrophone(!microphoneEnabled))}
							>
								{microphoneEnabled ? <Icons.VoiceMicIcon scale={2.5} /> : <Icons.VoiceMicDisabledIcon scale={2.5} />}
							</button>
							<SfuDeviceMenu
								label="Microphone hihi"
								devices={microphones}
								selectedDeviceId={selectedMicrophone}
								onSelect={(deviceId) => void changeInputDevice('audioinput', deviceId)}
							/>
						</div>
					)}
					{hasCameraAccess && (
						<div className="relative">
							<button
								id="btn-meet-camera"
								type="button"
								title={t(cameraEnabled ? 'turnOffCamera' : 'turnOnCamera')}
								aria-label={t(cameraEnabled ? 'turnOffCamera' : 'turnOnCamera')}
								className={buttonClass}
								onClick={() => dispatch(voiceActions.setShowCamera(!cameraEnabled))}
							>
								{cameraEnabled ? <Icons.VoiceCameraIcon scale={1.5} /> : <Icons.VoiceCameraDisabledIcon scale={1.5} />}
							</button>
							<SfuDeviceMenu
								label="Camera"
								devices={cameras}
								selectedDeviceId={selectedCamera}
								onSelect={(deviceId) => void changeInputDevice('videoinput', deviceId)}
							/>
						</div>
					)}
					<button
						id="btn-meet-screen"
						type="button"
						title={t(screenSharing ? 'stopScreenShare' : 'shareYourScreen')}
						aria-label={t(screenSharing ? 'stopScreenShare' : 'shareYourScreen')}
						className={`${buttonClass} ${screenSharing ? '!bg-blue-500' : ''}`}
						onClick={() => void toggleScreenShare()}
					>
						{screenSharing ? <Icons.VoiceScreenShareStopIcon /> : <Icons.VoiceScreenShareIcon />}
					</button>
					<button
						id="btn-meet-leave"
						type="button"
						title={t('disconnect')}
						aria-label={t('disconnect')}
						className={`${buttonClass} !bg-[#da373c] hover:!bg-[#a12829]`}
						onClick={onLeaveRoom}
					>
						<Icons.EndCall className="h-6 w-6" />
					</button>
				</div>
				<div className="flex justify-end pr-1">
					<button
						type="button"
						title={isFullScreen ? 'Exit full screen' : 'Full screen'}
						aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
						className="cursor-pointer p-2 text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)]"
						onClick={onFullScreen}
					>
						{isFullScreen ? <Icons.ExitFullScreen /> : <Icons.FullScreen />}
					</button>
				</div>
			</footer>
		</div>
	);
}

export default MezonSfuVoiceRoom;
