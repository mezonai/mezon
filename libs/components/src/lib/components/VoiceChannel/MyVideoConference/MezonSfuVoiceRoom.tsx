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
import { createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
	mid_audio?: number | string;
	mid_video?: number | string;
};

type RemoteMedia = {
	id: string;
	userId?: string;
	audio?: MediaStreamTrack;
	video?: MediaStreamTrack;
};

const getRemoteParticipantId = (mid: string) => {
	const numericMid = Number(mid);
	return Number.isFinite(numericMid) && numericMid >= 2 ? `peer-${Math.floor((numericMid - 2) / 2)}` : `mid-${mid}`;
};

const getUserIdFromTrackId = (trackId: string) => /-u(\d+)(?:-|$)/.exec(trackId)?.[1];

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
	onFrameStateChange
}: {
	stream: MediaStream;
	muted?: boolean;
	mirrored?: boolean;
	fit?: 'cover' | 'contain';
	onFrameStateChange?: (hasRecentFrame: boolean) => void;
}) => {
	const ref = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		video.srcObject = stream;
		video.play().catch(() => undefined);
		if (!onFrameStateChange || !video.requestVideoFrameCallback) return;

		let disposed = false;
		let frameCallbackId = 0;
		let noFrameTimer = 0;
		const markNoFrame = () => onFrameStateChange(false);
		const handleFrame: VideoFrameRequestCallback = () => {
			if (disposed) return;
			onFrameStateChange(true);
			window.clearTimeout(noFrameTimer);
			noFrameTimer = window.setTimeout(markNoFrame, REMOTE_VIDEO_NO_FRAME_TIMEOUT_MS);
			frameCallbackId = video.requestVideoFrameCallback(handleFrame);
		};
		onFrameStateChange(false);
		frameCallbackId = video.requestVideoFrameCallback(handleFrame);

		return () => {
			disposed = true;
			window.clearTimeout(noFrameTimer);
			video.cancelVideoFrameCallback(frameCallbackId);
		};
	}, [onFrameStateChange, stream]);
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

const Audio = ({ track }: { track: MediaStreamTrack }) => {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		if (!ref.current) return;
		ref.current.srcObject = new MediaStream([track]);
		ref.current.play().catch(() => undefined);
	}, [track]);
	return <audio ref={ref} autoPlay playsInline />;
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
	const showVideo = Boolean(participant.video && !participant.video.muted && participant.video.readyState === 'live' && hasRecentVideoFrame);
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
			{participant.audio && <Audio track={participant.audio} />}
		</div>
	);
};

const buttonClass = 'flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40';
const DEFAULT_VIDEO_CODEC = 'VP8';
const REMOTE_VIDEO_NO_FRAME_TIMEOUT_MS = 3000;

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
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
	const localTracksAddedRef = useRef(false);
	const negotiatingRef = useRef(false);
	const pendingOfferRef = useRef<string | null>(null);
	const peerLeftPendingOfferRef = useRef(false);
	const leftRemoteMidsRef = useRef(new Set<string>());
	const desiredMediaRef = useRef({ microphoneEnabled, cameraEnabled });
	const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
	const [error, setError] = useState<string>();
	const [localPreview, setLocalPreview] = useState<MediaStream>();
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack>();
	const [remoteMedia, setRemoteMedia] = useState<Map<string, RemoteMedia>>(() => new Map());
	const [screenSharing, setScreenSharing] = useState(false);
	const [isGridView, setIsGridView] = useState(true);
	const [showMembers, setShowMembers] = useState(false);
	const [showEmojiPanel, setShowEmojiPanel] = useState(false);
	const [showSoundPanel, setShowSoundPanel] = useState(false);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedMicrophone, setSelectedMicrophone] = useState('default');
	const [selectedCamera, setSelectedCamera] = useState('default');
	const lastShownErrorRef = useRef<string>();

	useEffect(() => {
		if (!error || lastShownErrorRef.current === error) return;
		lastShownErrorRef.current = error;
		// eslint-disable-next-line no-console
		console.error('[MezonSFU]', error);
		dispatch(toastActions.addToast({ message: error, type: 'error', autoClose: 3000 }));
	}, [dispatch, error]);

	const findUplinkVideoSender = useCallback(() => {
		const pc = pcRef.current;
		if (!pc) return null;
		const transceiver =
			pc.getTransceivers().find((item) => item.mid === '1') ||
			pc.getTransceivers().find((item) => item.sender.track?.kind === 'video') ||
			pc
				.getTransceivers()
				.find(
					(item) =>
						item.receiver.track.kind === 'video' &&
						(item.direction === 'sendonly' || item.direction === 'sendrecv' || item.direction === 'inactive')
				);
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
				if (!mid || mid === '0' || mid === '1' || leftRemoteMidsRef.current.has(mid)) continue;
				const track = transceiver.receiver.track;
				if (!track || track.readyState === 'ended') continue;
				const direction = transceiver.currentDirection || transceiver.direction;
				const id = getRemoteParticipantId(mid);
				if (direction === 'inactive' || direction === 'stopped') {
					const inactiveParticipant = next.get(id);
					if (inactiveParticipant) {
						if (track.kind === 'audio') inactiveParticipant.audio = undefined;
						if (track.kind === 'video') inactiveParticipant.video = undefined;
						next.set(id, inactiveParticipant);
					}
					continue;
				}
				const participant = next.get(id) || { id };
				participant.userId = getUserIdFromTrackId(track.id) || participant.userId;
				if (track.kind === 'audio') participant.audio = track;
				if (track.kind === 'video') participant.video = track;
				next.set(id, participant);
			}
			return next;
		});
	}, []);

	useEffect(() => {
		desiredMediaRef.current = { microphoneEnabled, cameraEnabled };
		const audioTrack = localStreamRef.current?.getAudioTracks()[0];
		if (audioTrack) {
			audioTrack.enabled = microphoneEnabled;
			const audioSender = pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
			if (audioSender) void audioSender.replaceTrack(microphoneEnabled ? audioTrack : null);
		}
	}, [cameraEnabled, microphoneEnabled]);

	useEffect(() => {
		if (screenStreamRef.current) return;

		const cameraTrack = cameraTrackRef.current;
		const videoSender = findUplinkVideoSender();
		const ws = wsRef.current;
		const signal = { type: cameraEnabled ? 'publish' : 'unpublish' } as const;

		if (!cameraTrack) return;

		cameraTrack.enabled = cameraEnabled;
		void (async () => {
			try {
				if (!videoSender) throw new Error('Video sender is not negotiated');
				await videoSender.replaceTrack(cameraEnabled ? cameraTrack : null);
			} catch (cause) {
				// eslint-disable-next-line no-console
				console.error('[MezonSFU][camera] replaceTrack failed', cause);
			}

			if (ws?.readyState === WebSocket.OPEN) {
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
					video:
						kind === 'videoinput'
							? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } }
							: false
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
					if (!screenStreamRef.current) await findUplinkVideoSender()?.replaceTrack(cameraEnabled ? nextTrack : null);
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
					video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } }
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
		pc.ontrack = ({ track, transceiver }) => {
			const mid = transceiver.mid;
			if (mid && leftRemoteMidsRef.current.has(mid)) return;
			const id = mid ? getRemoteParticipantId(mid) : `track-${track.id}`;
			setRemoteMedia((current) => {
				const next = new Map(current);
				const participant = next.get(id) || { id };
				participant.userId = getUserIdFromTrackId(track.id) || participant.userId;
				if (track.kind === 'audio') participant.audio = track;
				if (track.kind === 'video') participant.video = track;
				next.set(id, participant);
				return next;
			});
			const refreshTrackState = () => setRemoteMedia((current) => new Map(current));
			track.addEventListener('mute', refreshTrackState);
			track.addEventListener('unmute', refreshTrackState);
			track.addEventListener('ended', () => {
				setRemoteMedia((current) => {
					const next = new Map(current);
					const participant = next.get(id);
					if (!participant) return next;
					if (track.kind === 'audio') participant.audio = undefined;
					if (track.kind === 'video') participant.video = undefined;
					if (!participant.audio && !participant.video) next.delete(id);
					else next.set(id, participant);
					return next;
				});
			});
		};

		const handleOffer = async (sdp: string): Promise<void> => {
			if (negotiatingRef.current) {
				pendingOfferRef.current = sdp;
				return;
			}
			negotiatingRef.current = true;
			try {
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
					const videoTrack = screenStreamRef.current?.getVideoTracks()[0] || (desiredMediaRef.current.cameraEnabled ? cameraTrack : null);
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
					localTracksAddedRef.current = true;
				} else if (screenStreamRef.current) {
					const screenTrack = screenStreamRef.current.getVideoTracks()[0];
					const sender = findUplinkVideoSender();
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
					if (ws.readyState === WebSocket.OPEN)
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
				if (message.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
				if (message.type === 'joined') {
					setError(undefined);
					setConnectionState('awaiting offer');
				}
				if (message.type === 'offer' && message.sdp) void handleOffer(message.sdp);
				if (message.type === 'peer_left') {
					peerLeftPendingOfferRef.current = true;
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][remaining peer] peer_left received', {
						message,
						peer: getPeerDebugSnapshot(pc)
					});
					const mids = [message.mid_audio, message.mid_video].filter((mid) => mid != null && String(mid) !== '0').map(String);
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
				peer: getPeerDebugSnapshot(pc)
			});
			removeVisibilityListener();
			wsRef.current?.close();
			pc.close();
			localStreamRef.current?.getTracks().forEach((track) => track.stop());
			screenStreamRef.current?.getTracks().forEach((track) => track.stop());
			wsRef.current = null;
			pcRef.current = null;
			localTracksAddedRef.current = false;
			negotiatingRef.current = false;
			pendingOfferRef.current = null;
		};
	}, [applyScreenEncodingParams, findUplinkVideoSender, roomId, serverUrl, syncRemoteMedia, token]);

	const toggleScreenShare = async () => {
		const pc = pcRef.current;
		if (!pc) return;
		const sender = findUplinkVideoSender();
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => {
				track.onended = null;
				track.stop();
			});
			screenStreamRef.current = null;
			if (sender) await sender.replaceTrack(cameraEnabled ? cameraTrackRef.current : null);
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: cameraEnabled ? 'publish' : 'unpublish' }));
			}
			setScreenSharing(false);
			setLocalPreview(localStreamRef.current || undefined);
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					frameRate: { ideal: 15, max: 30 }
				},
				audio: false
			});
			const track = stream.getVideoTracks()[0];
			if (!track) throw new Error('Unable to get the screen track');
			track.contentHint = 'detail';
			if (!sender) {
				stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
				throw new Error('The video sender has not been negotiated by the SFU');
			}
			screenStreamRef.current = stream;
			await sender.replaceTrack(track);
			const transceiver = pc.getTransceivers().find((item) => item.sender === sender);
			if (transceiver && transceiver.direction !== 'sendonly' && transceiver.direction !== 'sendrecv') transceiver.direction = 'sendonly';
			await applyScreenEncodingParams(sender);
			setScreenSharing(true);
			setLocalPreview(stream);
			wsRef.current?.send(JSON.stringify({ type: 'share_screen' }));
			track.onended = () => void toggleScreenShare();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to share the screen');
		}
	};

	const participants = Array.from(remoteMedia.values());
	const participantCount = participants.length + 1;
	const isSolo = participants.length === 0;
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
	return (
		<div className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#11111b] text-white">
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
					<div className="relative">
						<button
							type="button"
							className="flex items-center gap-1"
							title="Participant list"
							onClick={() => setShowMembers((value) => !value)}
						>
							<Icons.MemberList defaultFill="text-white" />
							<span>{participantCount}</span>
						</button>
						{showMembers && (
							<div className="absolute right-0 top-9 w-56 rounded-lg bg-zinc-800 p-2 shadow-xl">
								<div className="flex items-center gap-2 rounded px-3 py-2 text-sm">
									<AvatarImage username={localDisplayName} alt={localDisplayName} src={localAvatar} className="!h-6 !w-6" />
									<span className="truncate">{localDisplayName}</span>
								</div>
								{participants.map((participant) => {
									const profile = getParticipantProfile(participant);
									return (
										<div key={participant.id} className="flex items-center gap-2 rounded px-3 py-2 text-sm">
											<AvatarImage
												username={profile.displayName}
												alt={profile.displayName}
												src={profile.avatar}
												className="!h-6 !w-6"
											/>
											<span className="truncate">{profile.displayName}</span>
										</div>
									);
								})}
							</div>
						)}
					</div>
					<button type="button" title={t('chat')} className={isChatOpen ? 'text-[var(--bg-icon-theme-active)]' : ''} onClick={onToggleChat}>
						<Icons.Chat className="h-5 w-5" />
					</button>
				</div>
			</header>

			<main
				className={`grid min-h-0 flex-1 gap-3 p-4 ${isGridView ? 'grid-cols-[repeat(auto-fit,minmax(260px,1fr))]' : 'grid-cols-1'} ${
					isSolo ? 'grid-rows-[minmax(0,1fr)] overflow-hidden' : 'auto-rows-min overflow-y-auto'
				}`}
			>
				<div
					className={`relative overflow-hidden rounded-xl border-2 bg-[#181825] transition-[border-color,box-shadow] duration-150 ${
						isSolo ? 'min-h-0 h-full' : 'aspect-video'
					} ${localSpeaking ? 'border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]' : 'border-transparent'}`}
				>
					{localPreview && (cameraEnabled || screenSharing) ? (
						<Video stream={localPreview} muted mirrored={!screenSharing} fit={screenSharing ? 'contain' : 'cover'} />
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
						{screenSharing ? t('usernameScreen', { username: localDisplayName }) : localDisplayName}
					</span>
				</div>
				{participants.map((participant) => {
					const profile = getParticipantProfile(participant);
					return (
						<ParticipantTile key={participant.id} participant={participant} displayName={profile.displayName} avatar={profile.avatar} />
					);
				})}
			</main>

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
							label="Microphone"
							devices={microphones}
							selectedDeviceId={selectedMicrophone}
							onSelect={(deviceId) => void changeInputDevice('audioinput', deviceId)}
						/>
					</div>
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
