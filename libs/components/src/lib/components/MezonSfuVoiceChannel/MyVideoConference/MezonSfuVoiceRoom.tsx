import {
	selectCurrentUserId,
	selectEntitesUserClans,
	selectNoiseSuppressionEnabled,
	selectNoiseSuppressionLevel,
	selectShowCamera,
	selectShowMicrophone,
	toastActions,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	NOISE_SUPPRESSION_NORMALIZATION_FACTOR,
	createImgproxyUrl,
	generateE2eId,
	getAvatarForPrioritize,
	getNameForPrioritize,
	getNoiseSuppressionAudioCaptureOptions,
	useMediaPermissions
} from '@mezon/utils';
import { DeepFilterNoiseFilterProcessor, type DeepFilterNet3Core } from 'deepfilternet3-noise-filter';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import type { RecordingAudioSource, RecordingSceneTile } from '../../VoiceChannel/Recording/types';
import { SfuControlBar } from '../ControlBar/SfuControlBar';
import { useSfuCallRecorder } from '../Recording/useSfuCallRecorder';
import type { SfuConnectionState as ConnectionState, SfuRemoteMedia as RemoteMedia, SfuPeer, SfuSignalMessage as SignalMessage } from '../types';
import { SfuFocusLayoutContainer } from './FocusLayout/SfuFocusLayoutContainer';
import { SfuGridLayoutContainer } from './GridLayout/SfuGridLayoutContainer';
import { useSfuGridLayout, useSfuPagination } from './GridLayout/useSfuGridLayout';
import { SfuRoomAudioRenderer } from './Media/SfuRoomAudioRenderer';
import { SfuVideo } from './Media/SfuVideo';
import { SfuParticipantTile } from './ParticipantTile/SfuParticipantTile';
import { SfuScreenShareTile } from './ParticipantTile/SfuScreenShareTile';
import { ReactionCallHandler, useSendReaction } from './Reaction';
import { SfuVoiceContextMenu } from './VoiceContextMenu';
import { SfuVoiceInteractiveLayer } from './VoiceContextMenu/SfuVoiceInteractiveLayer';

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

const SELF_MUTE_EVENT_CORRELATION_MS = 300;

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

type SpeakingInfo = {
	speaking: boolean;
	recentlySpokeUntil: number;
	lastSpokeAt: number;
};

const useParticipantsSpeakingMap = (localAudioTrack: MediaStreamTrack | undefined, localAudioEnabled: boolean, remoteParticipants: RemoteMedia[]) => {
	const [speakingMap, setSpeakingMap] = useState<Map<string, SpeakingInfo>>(() => new Map());

	const targetMap = useMemo(() => {
		const map = new Map<string, { track: MediaStreamTrack; enabled: boolean }>();
		if (localAudioTrack && localAudioTrack.readyState === 'live') {
			map.set('local', { track: localAudioTrack, enabled: localAudioEnabled });
		}
		for (const p of remoteParticipants) {
			if (p.audio && p.audio.readyState === 'live') {
				const enabled = p.isMute !== true && !p.audio.muted;
				map.set(p.id, { track: p.audio, enabled });
			}
		}
		return map;
	}, [localAudioTrack, localAudioEnabled, remoteParticipants]);

	const tracksKey = useMemo(() => {
		const parts: string[] = [];
		targetMap.forEach((item, id) => {
			parts.push(`${id}:${item.track.id}:${item.enabled}`);
		});
		return parts.join('|');
	}, [targetMap]);

	useEffect(() => {
		let frameId = 0;
		let audioContext: AudioContext | null = null;
		try {
			audioContext = new AudioContext();
		} catch {
			return;
		}

		const nodeMap = new Map<string, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }>();
		const lastSpeakingMap = new Map<string, boolean>();

		const ctx = audioContext;
		targetMap.forEach((item, id) => {
			if (!item.enabled) return;
			try {
				const source = ctx.createMediaStreamSource(new MediaStream([item.track]));
				const analyser = ctx.createAnalyser();
				analyser.fftSize = 256;
				source.connect(analyser);
				nodeMap.set(id, { source, analyser });
			} catch {
				// Ignore invalid stream
			}
		});

		const timeDomainData = new Uint8Array(256);

		const tick = () => {
			let changed = false;
			const now = Date.now();

			targetMap.forEach((item, id) => {
				const node = nodeMap.get(id);
				let isSpeaking = false;

				if (item.enabled && node) {
					node.analyser.getByteTimeDomainData(timeDomainData);
					let sumSquares = 0;
					for (let i = 0; i < timeDomainData.length; i++) {
						const normalized = (timeDomainData[i] - 128) / 128;
						sumSquares += normalized * normalized;
					}
					const rms = Math.sqrt(sumSquares / timeDomainData.length);
					isSpeaking = rms > 0.04;
				}

				const prevSpeaking = lastSpeakingMap.get(id);
				if (prevSpeaking === undefined || prevSpeaking !== isSpeaking) {
					lastSpeakingMap.set(id, isSpeaking);
					changed = true;
				}
			});

			if (changed) {
				setSpeakingMap((prev) => {
					const next = new Map(prev);
					targetMap.forEach((item, id) => {
						const isSpeaking = item.enabled ? (lastSpeakingMap.get(id) ?? false) : false;
						const prevEntry = next.get(id);
						if (isSpeaking) {
							next.set(id, {
								speaking: true,
								recentlySpokeUntil: now + 2500,
								lastSpokeAt: prevEntry?.speaking ? prevEntry.lastSpokeAt || now : now
							});
						} else {
							next.set(id, {
								speaking: false,
								recentlySpokeUntil: prevEntry?.recentlySpokeUntil || 0,
								lastSpokeAt: prevEntry?.lastSpokeAt || 0
							});
						}
					});
					return next;
				});
			}

			frameId = requestAnimationFrame(tick);
		};

		tick();

		return () => {
			cancelAnimationFrame(frameId);
			nodeMap.forEach((node) => {
				try {
					node.source.disconnect();
					node.analyser.disconnect();
				} catch {
					// Ignore disconnect errors
				}
			});
			if (audioContext) {
				void audioContext.close().catch(() => undefined);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tracksKey]);

	return speakingMap;
};

const CAMERA_CODEC = 'VP8';
const SCREEN_CODEC = 'VP9';
const SCREEN_SVC_MODE = 'L1T3';

const CAMERA_MAX_BITRATE_BPS = 1_000_000;
const SCREEN_MAX_BITRATE_BPS = 2_500_000;
const CAMERA_MIN_BITRATE_KBPS = 250;
const CAMERA_START_BITRATE_KBPS = 500;
const CAMERA_MAX_BITRATE_KBPS = 1000;
const SCREEN_MIN_BITRATE_KBPS = 400;
const SCREEN_START_BITRATE_KBPS = 1000;
const SCREEN_MAX_BITRATE_KBPS = 2500;

type ScreenCaptureController = {
	setFocusBehavior: (behavior: 'focus-capturing-application' | 'focus-captured-surface' | 'no-focus-change') => void;
};

const forceVideoCodec = (transceiver: RTCRtpTransceiver, codecName: string) => {
	if (!transceiver || typeof transceiver.setCodecPreferences !== 'function') return false;
	const capabilities = RTCRtpSender.getCapabilities?.('video');
	if (!capabilities?.codecs) return false;

	const wanted = (codecName || 'VP8').toLowerCase();
	const preferred = capabilities.codecs.filter((c) => c.mimeType.toLowerCase() === `video/${wanted}`);
	const preferredPayloadTypes = new Set(
		preferred.map((c) => (c as { preferredPayloadType?: number }).preferredPayloadType).filter((pt): pt is number => Number.isInteger(pt))
	);
	const havePreferredPayloadTypes = preferredPayloadTypes.size > 0;
	const rtx = capabilities.codecs.filter((c) => {
		if (c.mimeType.toLowerCase() !== 'video/rtx') return false;
		if (!havePreferredPayloadTypes) return true;
		const match = /(?:^|;)\s*apt=(\d+)/i.exec(c.sdpFmtpLine || '');
		return match && preferredPayloadTypes.has(Number(match[1]));
	});

	if (preferred.length > 0) {
		try {
			transceiver.setCodecPreferences([...preferred, ...rtx]);
			return true;
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn(`setCodecPreferences for ${wanted} failed:`, e);
		}
	}
	return false;
};

const mungeVideoSectionBitrate = (section: string, minKbps: number, startKbps: number, maxKbps: number) => {
	const pts = new Set<string>();
	for (const m of section.matchAll(/^a=rtpmap:(\d+) (VP9|VP8|AV1)\//gim)) {
		pts.add(m[1]);
	}
	let out = section;
	for (const pt of pts) {
		const fmtpRe = new RegExp(`^a=fmtp:${pt} (.*)$`, 'm');
		const extras = `x-google-min-bitrate=${minKbps};x-google-start-bitrate=${startKbps};x-google-max-bitrate=${maxKbps}`;
		if (fmtpRe.test(out)) {
			out = out.replace(fmtpRe, (_line, rest) => {
				const cleaned = rest.replace(/;?\s*x-google-(?:min|start|max)-bitrate=\d+/gi, '').replace(/^;|;$/g, '');
				return `a=fmtp:${pt} ${cleaned ? `${cleaned};` : ''}${extras}`;
			});
		} else {
			const rtpmapRe = new RegExp(`^(a=rtpmap:${pt} .*)$`, 'm');
			out = out.replace(rtpmapRe, `$1\r\na=fmtp:${pt} ${extras}`);
		}
	}
	return out;
};

const mungeVideoBitrates = (sdp?: string) => {
	if (!sdp) return sdp;
	return sdp
		.split(/(?=^m=)/gm)
		.map((section) => {
			const mid = section.match(/^a=mid:(\S+)/m)?.[1];
			if (mid === '1') {
				return mungeVideoSectionBitrate(section, CAMERA_MIN_BITRATE_KBPS, CAMERA_START_BITRATE_KBPS, CAMERA_MAX_BITRATE_KBPS);
			}
			if (mid === '2') {
				return mungeVideoSectionBitrate(section, SCREEN_MIN_BITRATE_KBPS, SCREEN_START_BITRATE_KBPS, SCREEN_MAX_BITRATE_KBPS);
			}
			return section;
		})
		.join('');
};

const applyVideoEncodingParams = async (pc: RTCPeerConnection) => {
	const uplink =
		pc.getTransceivers().find((t) => t.mid === '1') ||
		pc.getTransceivers().find((t) => t.sender && t.sender.track && t.sender.track.kind === 'video');
	if (!uplink?.sender) return;

	try {
		const params = uplink.sender.getParameters();
		if (!params.encodings?.length) {
			params.encodings = [{}];
		}
		params.degradationPreference = 'maintain-resolution';
		const encoding = params.encodings[0] as RTCRtpEncodingParameters & { scalabilityMode?: string };
		if ('scalabilityMode' in encoding) {
			delete encoding.scalabilityMode;
		}
		encoding.maxBitrate = CAMERA_MAX_BITRATE_BPS;
		encoding.maxFramerate = 30;
		encoding.scaleResolutionDownBy = 1;
		encoding.priority = 'high';
		encoding.networkPriority = 'high';
		await uplink.sender.setParameters(params);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('applyVideoEncodingParams failed:', e);
	}
};

export interface MezonSfuVoiceRoomProps {
	token: string;
	joinRole: 'speaker' | 'audience';
	roomId: string;
	serverUrl: string;
	channelLabel: string;
	isChatOpen: boolean;
	isFullScreen: boolean;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onToggleChat: () => void;
}

type SfuOffer = { sdp: string; offer_generation: number };

export function MezonSfuVoiceRoom({
	token,
	joinRole,
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
	const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
	const noiseSuppressionLevel = useSelector(selectNoiseSuppressionLevel);
	const noiseSuppressionEnabledRef = useRef(noiseSuppressionEnabled);
	const noiseProcessorRef = useRef<DeepFilterNet3Core | null>(null);
	const { hasMicrophoneAccess, hasCameraAccess } = useMediaPermissions();
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
	const localTracksAddedRef = useRef(false);
	const negotiatingRef = useRef(false);
	const joinedRef = useRef(false);
	const pendingOfferRef = useRef<SfuOffer | null>(null);
	const peerLeftPendingOfferRef = useRef(false);
	const leftRemoteMidsRef = useRef(new Set<string>());
	const userIdsByMidRef = useRef(new Map<string, string>());
	const peerIdsByMidRef = useRef(new Map<string, string>());
	const rolesByMidRef = useRef(new Map<string, 'speaker' | 'audience'>());
	const currentSfuRoleRef = useRef(joinRole);
	const microphonePermissionRevokedRef = useRef(false);
	const desiredMediaRef = useRef({ microphoneEnabled, cameraEnabled });
	const onLeaveRoomRef = useRef(onLeaveRoom);
	const lastMuteChangedAtRef = useRef(0);
	const pendingForcedMuteRef = useRef<number>();
	const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
	const [error, setError] = useState<string>();
	const [localPreview, setLocalPreview] = useState<MediaStream>();
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack>();
	const [remoteMedia, setRemoteMedia] = useState<Map<string, RemoteMedia>>(() => new Map());
	const [roomParticipantCount, setRoomParticipantCount] = useState(1);
	const [screenSharing, setScreenSharing] = useState(false);
	const [pushToTalkActive, setPushToTalkActive] = useState(false);
	const mutedParticipantIds = useMemo(() => new Set<string>(), []);
	const [isGridView, setIsGridView] = useState(true);
	const [pinnedTrackId, setPinnedTrackId] = useState<string>();
	const [autoFocusedTrackId, setAutoFocusedTrackId] = useState<string>();
	const [showFocusThumbnails, setShowFocusThumbnails] = useState(true);
	const [showEmojiPanel, setShowEmojiPanel] = useState(false);
	const [showSoundPanel, setShowSoundPanel] = useState(false);
	const [showVoiceInteractivePanel, setShowVoiceInteractivePanel] = useState(false);
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);
	const [popoutTrackId, setPopoutTrackId] = useState<string>();
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedMicrophone, setSelectedMicrophone] = useState('default');
	const [selectedCamera, setSelectedCamera] = useState('default');
	const lastShownErrorRef = useRef<string>();
	const lastGridWheelTimeRef = useRef<number>(0);
	const gridElRef = useRef<HTMLElement>(null);
	const gridTileOrderRef = useRef<string[]>([]);
	const focusTileOrderRef = useRef<string[]>([]);
	const focusThumbnailsRef = useRef<HTMLDivElement>(null);
	const focusVideoContainerRef = useRef<HTMLDivElement>(null);
	const [, renderFocusTileOrder] = useState(0);
	onLeaveRoomRef.current = onLeaveRoom;
	noiseSuppressionEnabledRef.current = noiseSuppressionEnabled;

	const closePopout = useCallback(async () => {
		if (document.pictureInPictureElement) await document.exitPictureInPicture();
		setIsPopoutOpen(false);
		setPopoutTrackId(undefined);
	}, []);

	const togglePopout = useCallback(
		async (trackId?: string) => {
			try {
				if (document.pictureInPictureElement) {
					await closePopout();
					return;
				}

				const video = focusVideoContainerRef.current?.querySelector('video');
				if (!video) {
					dispatch(toastActions.addToast({ message: 'Please select a video track to popout!', type: 'warning', autoClose: 3000 }));
					return;
				}

				video.id = 'focusTrack';
				video.addEventListener(
					'leavepictureinpicture',
					() => {
						setIsPopoutOpen(false);
						setPopoutTrackId(undefined);
					},
					{ once: true }
				);
				await video.requestPictureInPicture();
				setIsPopoutOpen(true);
				setPopoutTrackId(trackId);
			} catch (popoutError) {
				console.error('PiP error:', popoutError);
			}
		},
		[closePopout, dispatch]
	);

	useEffect(
		() => () => {
			if (document.pictureInPictureElement) void document.exitPictureInPicture();
		},
		[]
	);

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
		if (!sender || typeof sender.getParameters !== 'function') return;
		try {
			const parameters = sender.getParameters();
			if (!parameters.encodings?.length) parameters.encodings = [{}];
			parameters.degradationPreference = 'maintain-resolution';
			const encoding = parameters.encodings[0] as RTCRtpEncodingParameters & { scalabilityMode?: string };
			encoding.scalabilityMode = SCREEN_SVC_MODE;
			encoding.maxFramerate = 15;
			encoding.maxBitrate = SCREEN_MAX_BITRATE_BPS;
			encoding.scaleResolutionDownBy = 1;
			encoding.priority = 'high';
			encoding.networkPriority = 'high';
			await sender.setParameters(parameters);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn('applyScreenEncodingParams failed:', e);
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
				participant.peerId = peerIdsByMidRef.current.get(mid) || participant.peerId;
				participant.role = rolesByMidRef.current.get(mid) || participant.role;
				if (track.kind === 'audio') participant.audio = track;
				if (mediaKind === 'camera') participant.video = track;
				if (mediaKind === 'screen') {
					if (participant.screen !== track) participant.screenActive = !track.muted;
					participant.screen = track;
				}
				if (!participant.audio && !participant.video && !participant.screen) next.delete(id);
				else next.set(id, participant);
			}
			return next;
		});
	}, []);

	const applySfuPeers = useCallback(
		(peers: SfuPeer[]) => {
			setRemoteMedia((current) => {
				const next = new Map(current);
				for (const peer of peers) {
					const peerId = String(peer.peer_id);
					const mids = [peer.mid_audio, peer.mid_video, peer.mid_screen].filter((mid) => mid != null && String(mid) !== '0').map(String);
					for (const mid of mids) {
						leftRemoteMidsRef.current.delete(mid);
						peerIdsByMidRef.current.set(mid, peerId);
						if (peer.user_id) userIdsByMidRef.current.set(mid, peer.user_id);
						if (peer.role) rolesByMidRef.current.set(mid, peer.role);
					}

					const existingEntry = Array.from(next.entries()).find(([, participant]) => participant.peerId === peerId);
					const participantId = existingEntry?.[0] || (mids[0] ? getRemoteParticipantId(mids[0]) : undefined);
					if (!participantId) continue;
					const participant = next.get(participantId) || { id: participantId };
					next.set(participantId, {
						...participant,
						peerId,
						userId: peer.user_id || participant.userId,
						role: peer.role || participant.role,
						cameraRequested: peer.camera_requested !== undefined ? peer.camera_requested : participant.cameraRequested,
						cameraActive: peer.camera_active !== undefined ? peer.camera_active : participant.cameraActive,
						screenRequested: peer.screen_requested !== undefined ? peer.screen_requested : participant.screenRequested,
						screenActive: peer.screen_active !== undefined ? peer.screen_active : participant.screenActive,
						isMute: peer.is_mute !== undefined ? peer.is_mute : participant.isMute
					});
				}
				return next;
			});
			if (pcRef.current) {
				syncRemoteMedia(pcRef.current);
			}
		},
		[syncRemoteMedia]
	);

	useEffect(() => {
		desiredMediaRef.current = { microphoneEnabled, cameraEnabled };
		void (async () => {
			let audioTrack = localStreamRef.current?.getAudioTracks()[0];
			if (microphoneEnabled && audioTrack?.readyState !== 'live') {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						audio: getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabledRef.current),
						video: false
					});
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

				if (cameraTrack) {
					cameraTrack.enabled = cameraEnabled;
					if ('contentHint' in cameraTrack && cameraTrack.contentHint !== 'detail') {
						try {
							cameraTrack.contentHint = 'motion';
						} catch {
							// ignore
						}
					}
					const videoSender = findUplinkVideoSender();
					if (videoSender) {
						await videoSender.replaceTrack(cameraEnabled ? cameraTrack : null);
						const videoTransceiver = pcRef.current?.getTransceivers().find((item) => item.mid === '1');
						if (videoTransceiver && cameraEnabled && videoTransceiver.direction !== 'sendonly') {
							videoTransceiver.direction = 'sendonly';
						}
						if (cameraEnabled && pcRef.current && videoTransceiver) {
							forceVideoCodec(videoTransceiver, CAMERA_CODEC);
							await applyVideoEncodingParams(pcRef.current);
						}
					}
				}
			} catch (cause) {
				// eslint-disable-next-line no-console
				console.error('[MezonSFU][camera] replaceTrack failed', cause);
			}

			const signal = { type: 'camera', active: cameraEnabled } as const;
			if (joinRole === 'speaker' && joinedRef.current && ws?.readyState === WebSocket.OPEN) {
				// eslint-disable-next-line no-console
				console.info('[MezonSFU][ws.send][camera]', signal);
				ws.send(JSON.stringify(signal));
			} else if (joinRole === 'speaker' && joinedRef.current) {
				// eslint-disable-next-line no-console
				console.error('[MezonSFU][camera] signaling not sent: WebSocket is not open', {
					signal,
					wsReadyState: ws?.readyState
				});
			}
		})();
	}, [cameraEnabled, findUplinkVideoSender, joinRole]);

	useEffect(() => {
		const audioTrack = localAudioTrack || localStreamRef.current?.getAudioTracks()[0];
		if (audioTrack && audioTrack.readyState === 'live') {
			void audioTrack
				.applyConstraints(getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabled) as MediaTrackConstraints)
				.catch(() => undefined);
		}

		if (!noiseSuppressionEnabled || !DeepFilterNoiseFilterProcessor.isSupported()) {
			if (noiseProcessorRef.current) {
				try {
					noiseProcessorRef.current.setNoiseSuppressionEnabled(false);
				} catch {
					// Ignore disconnect errors
				}
			}
			return;
		}

		const normalizedLevel = noiseSuppressionLevel * NOISE_SUPPRESSION_NORMALIZATION_FACTOR;
		if (noiseProcessorRef.current) {
			try {
				noiseProcessorRef.current.setSuppressionLevel(normalizedLevel);
				noiseProcessorRef.current.setNoiseSuppressionEnabled(true);
			} catch {
				// Ignore errors
			}
		}
	}, [localAudioTrack, noiseSuppressionEnabled, noiseSuppressionLevel]);

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
					audio:
						kind === 'audioinput'
							? { ...getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabledRef.current), deviceId: { exact: deviceId } }
							: false,
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
		let reconnectAllowed = true;
		let removeVisibilityListener: () => void = () => undefined;
		let heartbeatInterval: ReturnType<typeof setInterval> | undefined;
		const peerIdsByMid = peerIdsByMidRef.current;
		const rolesByMid = rolesByMidRef.current;
		currentSfuRoleRef.current = joinRole;

		const prepareLocalMedia = async () => {
			let stream: MediaStream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					audio: getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabledRef.current),
					video: CAMERA_CAPTURE_CONSTRAINTS
				});
			} catch {
				try {
					stream = await navigator.mediaDevices.getUserMedia({
						audio: getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabledRef.current),
						video: false
					});
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

		const resetAndCreatePeerConnection = () => {
			if (pcRef.current) {
				pcRef.current.close();
				pcRef.current = null;
			}
			localTracksAddedRef.current = false;
			negotiatingRef.current = false;
			pendingOfferRef.current = null;
			peerLeftPendingOfferRef.current = false;
			leftRemoteMidsRef.current.clear();
			userIdsByMidRef.current.clear();
			peerIdsByMid.clear();
			rolesByMid.clear();
			setRemoteMedia(new Map());

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
						participant.peerId = (mid && peerIdsByMidRef.current.get(mid)) || participant.peerId;
						participant.role = (mid && rolesByMidRef.current.get(mid)) || participant.role;
						if (track.kind === 'audio') participant.audio = track;
						if (mediaKind === 'camera') participant.video = track;
						if (mediaKind === 'screen') {
							if (participant.screen !== track) participant.screenActive = !track.muted;
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
						setRemoteMedia((current) => {
							const next = new Map(current);
							const participant = next.get(id);
							if (participant?.screen === track) next.set(id, { ...participant, screenActive: true });
							return next;
						});
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
			return pc;
		};

		const handleOffer = async (offer: SfuOffer): Promise<void> => {
			const pc = pcRef.current;
			if (!pc) return;
			if (negotiatingRef.current) {
				pendingOfferRef.current = offer;
				return;
			}
			negotiatingRef.current = true;
			try {
				const sdpUserIdsByMid = getUserIdsByMidFromSdp(offer.sdp);
				for (const [mid] of sdpUserIdsByMid) {
					leftRemoteMidsRef.current.delete(mid);
				}
				userIdsByMidRef.current = new Map([...userIdsByMidRef.current, ...sdpUserIdsByMid]);
				if (peerLeftPendingOfferRef.current) {
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][remaining peer] offer received after peer_left', {
						peer: getPeerDebugSnapshot(pc),
						sdp: offer.sdp
					});
					peerLeftPendingOfferRef.current = false;
				}
				const localStream = localStreamRef.current || (await prepareLocalMedia());
				const stabilizedSdp = stabilizeInactiveVideoSections(offer.sdp, pc.currentRemoteDescription?.sdp);
				await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: stabilizedSdp }));
				const uplinkVideoTransceiver = pc.getTransceivers().find((item) => item.mid === '1');
				if (uplinkVideoTransceiver) forceVideoCodec(uplinkVideoTransceiver, CAMERA_CODEC);
				const screenTransceiver = pc.getTransceivers().find((item) => item.mid === '2');
				if (screenTransceiver) forceVideoCodec(screenTransceiver, SCREEN_CODEC);

				if (!localTracksAddedRef.current) {
					const audioTrack = localStream.getAudioTracks()[0];
					const cameraTrack = localStream.getVideoTracks()[0];
					const videoTrack = cameraTrack || null;
					if (videoTrack && 'contentHint' in videoTrack && videoTrack.contentHint !== 'detail') {
						try {
							videoTrack.contentHint = 'motion';
						} catch {
							// ignore
						}
					}
					const audioTransceiver = pc.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
					const videoTransceiver = uplinkVideoTransceiver;
					if (audioTransceiver) {
						const audioEnabled =
							joinRole === 'audience' ? currentSfuRoleRef.current === 'speaker' : desiredMediaRef.current.microphoneEnabled;
						if (audioTrack) audioTrack.enabled = audioEnabled;
						await audioTransceiver.sender.replaceTrack(
							joinRole === 'audience' ? audioTrack || null : audioEnabled ? audioTrack || null : null
						);
						audioTransceiver.direction = 'sendonly';
					}
					if (joinRole === 'speaker' && videoTransceiver) {
						await videoTransceiver.sender.replaceTrack(videoTrack);
						videoTransceiver.direction = 'sendonly';
						await applyVideoEncodingParams(pc);
					}
					const screenTrack = screenStreamRef.current?.getVideoTracks()[0] || null;
					if (screenTransceiver && screenTrack) {
						await screenTransceiver.sender.replaceTrack(screenTrack);
						screenTransceiver.direction = 'sendonly';
						await applyScreenEncodingParams(screenTransceiver.sender);
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
				const answer = await pc.createAnswer();
				const mungedSdp = mungeVideoBitrates(answer.sdp);
				await pc.setLocalDescription(new RTCSessionDescription({ type: 'answer', sdp: mungedSdp }));
				syncRemoteMedia(pc);
				if (wsRef.current?.readyState === WebSocket.OPEN && pc.localDescription?.sdp) {
					wsRef.current.send(
						JSON.stringify({
							type: 'answer',
							sdp: pc.localDescription.sdp,
							offer_generation: offer.offer_generation
						})
					);
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

		const handleRoleChanged = async (role: 'speaker' | 'audience') => {
			currentSfuRoleRef.current = role;
			const audioTrack = localStreamRef.current?.getAudioTracks()[0];
			const audioTransceiver = pcRef.current?.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
			if (role === 'speaker') {
				if (audioTrack) audioTrack.enabled = true;
				if (audioTransceiver && audioTrack) {
					await audioTransceiver.sender.replaceTrack(audioTrack);
					audioTransceiver.direction = 'sendonly';
				}
				setPushToTalkActive(true);
				return;
			}

			if (audioTrack) audioTrack.enabled = false;
			if (audioTransceiver) {
				await audioTransceiver.sender.replaceTrack(null);
				audioTransceiver.direction = 'inactive';
			}
			setPushToTalkActive(false);
		};

		const reconnect = () => {
			if (!reconnectAllowed || disposed || (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED)) return;
			resetAndCreatePeerConnection();
			const secureServerUrl =
				window.location.protocol === 'https:' && serverUrl.startsWith('ws://') ? `wss://${serverUrl.slice(5)}` : serverUrl;
			const wsUrl = new URL(secureServerUrl);
			wsUrl.searchParams.set('access_token', token);
			const ws = new WebSocket(wsUrl.toString());
			wsRef.current = ws;
			ws.onopen = () => {
				if (disposed || wsRef.current !== ws) return;
				setError(undefined);
				setConnectionState('joining');
				ws.send(JSON.stringify({ type: 'join', room: roomId, token, role: joinRole }));
				const sendVisibility = () => {
					if (joinedRef.current && ws.readyState === WebSocket.OPEN)
						ws.send(JSON.stringify({ type: 'visibility', visible: document.visibilityState === 'visible' }));
				};
				removeVisibilityListener();
				document.addEventListener('visibilitychange', sendVisibility);
				removeVisibilityListener = () => document.removeEventListener('visibilitychange', sendVisibility);
			};
			ws.onmessage = ({ data }) => {
				if (disposed || wsRef.current !== ws) return;
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
				if (message.type === 'room_snapshot' && message.members) applySfuPeers(message.members);
				if (message.type === 'mute_changed') {
					lastMuteChangedAtRef.current = Date.now();
					if (pendingForcedMuteRef.current !== undefined) {
						window.clearTimeout(pendingForcedMuteRef.current);
						pendingForcedMuteRef.current = undefined;
					}
				}
				if ((message.type === 'peer_joined' || message.type === 'peer_updated') && message.peer) {
					applySfuPeers([message.peer]);

					const isCurrentUser = message.peer.user_id != null && String(message.peer.user_id) === String(currentUserId);
					if (message.type === 'peer_updated' && isCurrentUser && message.peer.is_mute === true) {
						const muteChangedAlreadyReceived = Date.now() - lastMuteChangedAtRef.current <= SELF_MUTE_EVENT_CORRELATION_MS;
						if (!muteChangedAlreadyReceived && desiredMediaRef.current.microphoneEnabled) {
							if (pendingForcedMuteRef.current !== undefined) window.clearTimeout(pendingForcedMuteRef.current);
							pendingForcedMuteRef.current = window.setTimeout(() => {
								pendingForcedMuteRef.current = undefined;
								if (Date.now() - lastMuteChangedAtRef.current <= SELF_MUTE_EVENT_CORRELATION_MS) return;

								desiredMediaRef.current.microphoneEnabled = false;
								const audioTrack = localStreamRef.current?.getAudioTracks()[0];
								if (audioTrack) audioTrack.enabled = false;
								const audioSender = pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
								if (audioSender) void audioSender.replaceTrack(null);
								dispatch(voiceActions.setShowMicrophone(false));
								dispatch(
									toastActions.addToast({
										message: 'You have been muted by a channel moderator.',
										type: 'warning',
										autoClose: 3000
									})
								);
							}, SELF_MUTE_EVENT_CORRELATION_MS);
						}
					}
				}
				if (message.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: message.timestamp }));
				if (message.type === 'joined') {
					setError(undefined);
					setConnectionState('awaiting offer');
				}
				if (message.type === 'room_snapshot' && !joinedRef.current) {
					joinedRef.current = true;
					ws.send(JSON.stringify({ type: 'mute', is_mute: !desiredMediaRef.current.microphoneEnabled }));
					if (joinRole === 'speaker') {
						ws.send(JSON.stringify({ type: 'camera', active: desiredMediaRef.current.cameraEnabled }));
					}
					const activeScreenTrack = screenStreamRef.current?.getVideoTracks()[0];
					if (activeScreenTrack && activeScreenTrack.readyState === 'live') {
						// eslint-disable-next-line no-console
						console.info('[MezonSFU][ws.send][share_screen][reconnect]', { type: 'share_screen', active: true });
						ws.send(JSON.stringify({ type: 'share_screen', active: true }));
					}
					ws.send(JSON.stringify({ type: 'visibility', visible: document.visibilityState === 'visible' }));
				}
				if (message.type === 'push_to_talk_changed' && typeof message.active === 'boolean') {
					const audioTrack = localStreamRef.current?.getAudioTracks()[0];
					if (audioTrack) audioTrack.enabled = message.active;
					setPushToTalkActive(message.active);
				}
				if (message.type === 'role_changed' && message.role) {
					void handleRoleChanged(message.role).catch((cause) => {
						setError(cause instanceof Error ? cause.message : 'Unable to update audience role');
					});
				}
				if (message.type === 'offer' && message.sdp && message.offer_generation != null) {
					void handleOffer({ sdp: message.sdp, offer_generation: message.offer_generation });
				}
				if (message.type === 'peer_left') {
					peerLeftPendingOfferRef.current = true;
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][remaining peer] peer_left received', {
						message,
						peer: pcRef.current ? getPeerDebugSnapshot(pcRef.current) : null
					});
					const mids = [message.mid_audio, message.mid_video, message.mid_screen]
						.filter((mid) => mid != null && String(mid) !== '0')
						.map(String);
					setRemoteMedia((current) => {
						const next = new Map(current);
						mids.forEach((mid) => {
							leftRemoteMidsRef.current.add(mid);
							peerIdsByMidRef.current.delete(mid);
							userIdsByMidRef.current.delete(mid);
							rolesByMidRef.current.delete(mid);
							next.delete(getRemoteParticipantId(mid));
						});
						if (message.peer_id) {
							const peerIdStr = String(message.peer_id);
							for (const [id, participant] of next.entries()) {
								if (participant.peerId === peerIdStr) {
									next.delete(id);
								}
							}
						}
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
				if (disposed || wsRef.current !== ws) return;
				setError('Unable to connect to SFU signaling');
				setConnectionState('failed');
			};
			ws.onclose = (event) => {
				if (wsRef.current !== ws) return;
				wsRef.current = null;
				joinedRef.current = false;
				reconnectAllowed = event.code === 4001;
				if (disposed) return;

				setConnectionState('disconnected');
				if (event.code === 4006) {
					dispatch(
						toastActions.addToast({
							message: event.reason || 'You have been kicked from the channel.',
							type: 'warning',
							autoClose: 5000
						})
					);
					onLeaveRoomRef.current();
					return;
				}

				if (reconnectAllowed) reconnect();
			};
		};

		void prepareLocalMedia().finally(() => {
			if (disposed) return;
			reconnect();
			heartbeatInterval = setInterval(() => {
				const ws = wsRef.current;
				if (ws?.readyState === WebSocket.OPEN) {
					const pingMessage = { type: 'ping', timestamp: Date.now() };
					// eslint-disable-next-line no-console
					console.info('[MezonSFU][ws.send][ping]', pingMessage);
					ws.send(JSON.stringify(pingMessage));
					return;
				}
				reconnect();
			}, 10_000);
		});

		return () => {
			disposed = true;
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			if (pendingForcedMuteRef.current !== undefined) {
				window.clearTimeout(pendingForcedMuteRef.current);
				pendingForcedMuteRef.current = undefined;
			}
			// A leave is currently signaled by closing the WebSocket; no explicit
			// { type: 'leave' } message is sent to the SFU.
			// eslint-disable-next-line no-console
			console.info('[MezonSFU][leaving peer] closing signaling connection', {
				wsReadyState: wsRef.current?.readyState,
				peersFromSdp: Array.from(userIdsByMidRef.current, ([mid, userId]) => ({ mid, userId }))
			});
			removeVisibilityListener();
			wsRef.current?.close();
			pcRef.current?.close();
			localStreamRef.current?.getTracks().forEach((track) => track.stop());
			screenStreamRef.current?.getTracks().forEach((track) => track.stop());
			wsRef.current = null;
			pcRef.current = null;
			joinedRef.current = false;
			localTracksAddedRef.current = false;
			negotiatingRef.current = false;
			pendingOfferRef.current = null;
			peerIdsByMid.clear();
			rolesByMid.clear();
		};
	}, [
		applyScreenEncodingParams,
		applySfuPeers,
		currentUserId,
		dispatch,
		findUplinkVideoSender,
		joinRole,
		roomId,
		serverUrl,
		syncRemoteMedia,
		token
	]);

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
				const transceiver =
					pc.getTransceivers().find((item) => item.sender === sender) || pc.getTransceivers().find((item) => item.mid === '2');
				if (transceiver && transceiver.direction !== 'sendonly' && transceiver.direction !== 'sendrecv') {
					transceiver.direction = 'sendonly';
				}
				if (transceiver) forceVideoCodec(transceiver, SCREEN_CODEC);
				await applyScreenEncodingParams(sender);
			}
			setScreenSharing(true);
			// eslint-disable-next-line no-console
			console.info('[MezonSFU][ws.send][share_screen]', { type: 'share_screen', active: true });
			wsRef.current?.send(JSON.stringify({ type: 'share_screen', active: true }));
			track.onended = () => void toggleScreenShare();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to share the screen');
		}
	};

	const setPushToTalk = useCallback(
		async (active: boolean) => {
			if (joinRole !== 'audience' || pushToTalkActive === active) return;
			let audioTrack = localStreamRef.current?.getAudioTracks()[0];
			if (active && (microphonePermissionRevokedRef.current || audioTrack?.readyState !== 'live' || audioTrack.muted)) {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
					const nextAudioTrack = stream.getAudioTracks()[0];
					if (!nextAudioTrack) return;
					const localStream = localStreamRef.current || new MediaStream();
					localStream.getAudioTracks().forEach((track) => {
						localStream.removeTrack(track);
						track.stop();
					});
					localStream.addTrack(nextAudioTrack);
					localStreamRef.current = localStream;
					audioTrack = nextAudioTrack;
					microphonePermissionRevokedRef.current = false;
					setLocalAudioTrack(nextAudioTrack);
					setSelectedMicrophone(nextAudioTrack.getSettings().deviceId || 'default');
					setLocalPreview(new MediaStream(localStream.getTracks()));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : 'Unable to access microphone');
					return;
				}
			}
			if (active && audioTrack) {
				const audioTransceiver = pcRef.current?.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
				if (!audioTransceiver) {
					setError('Audio sender is not negotiated');
					return;
				}
				await audioTransceiver.sender.replaceTrack(audioTrack);
				if (audioTransceiver.direction !== 'sendonly' && audioTransceiver.direction !== 'sendrecv') {
					audioTransceiver.direction = 'sendonly';
				}
			}
			if (audioTrack) audioTrack.enabled = active;
			setPushToTalkActive(active);
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				if (active) {
					wsRef.current.send(JSON.stringify({ type: 'mute', is_mute: false }));
					wsRef.current.send(JSON.stringify({ type: 'push_to_talk', active: true }));
				} else {
					wsRef.current.send(JSON.stringify({ type: 'push_to_talk', active: false }));
					wsRef.current.send(JSON.stringify({ type: 'mute', is_mute: true }));
				}
			}
		},
		[joinRole, pushToTalkActive]
	);

	useEffect(() => {
		if (joinRole === 'audience' && hasMicrophoneAccess === false) {
			microphonePermissionRevokedRef.current = true;
			if (pushToTalkActive) void setPushToTalk(false);
		}
	}, [hasMicrophoneAccess, joinRole, pushToTalkActive, setPushToTalk]);

	useEffect(() => {
		if (joinRole !== 'audience') return;
		const handleExternalPushToTalk = (event: Event) => {
			const { active } = (event as CustomEvent<{ active?: boolean }>).detail || {};
			if (typeof active === 'boolean') void setPushToTalk(active);
		};
		window.addEventListener('mezon-sfu-push-to-talk', handleExternalPushToTalk);
		return () => window.removeEventListener('mezon-sfu-push-to-talk', handleExternalPushToTalk);
	}, [joinRole, setPushToTalk]);

	useEffect(() => {
		window.dispatchEvent(new CustomEvent('mezon-sfu-push-to-talk-changed', { detail: { active: pushToTalkActive } }));
	}, [pushToTalkActive]);

	const participants = useMemo(() => Array.from(remoteMedia.values()), [remoteMedia]);
	const handleParticipantAction = useCallback(
		async (action: 'mute' | 'kick', participantId: string) => {
			const response = await dispatch(
				(action === 'mute' ? voiceActions.muteVoiceMember : voiceActions.kickVoiceMember)({ user_id: participantId })
			).unwrap();
			const message = response?.message;
			const actionToken =
				typeof message === 'string'
					? message
					: message && typeof message === 'object'
						? new TextDecoder().decode(
								message instanceof Uint8Array ? message : Uint8Array.from(Object.values(message as Record<string, number>))
							)
						: undefined;
			if (!actionToken) throw new Error(`The ${action} API did not return an SFU action token`);

			const ws = wsRef.current;
			if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('SFU signaling is not connected');
			ws.send(JSON.stringify({ type: 'participant_action', token: actionToken }));
		},
		[dispatch]
	);
	const handleParticipantContextMenu = useCallback(
		(event: ReactMouseEvent<HTMLElement>, participantUserId?: string) => {
			if (!participantUserId || participantUserId === currentUserId) return;
			event.preventDefault();
			event.stopPropagation();
			const menuWidth = 220;
			const menuHeight = 200;
			dispatch(
				voiceActions.openVoiceContextMenu({
					participantId: participantUserId,
					position: {
						x: Math.min(event.clientX, window.innerWidth - menuWidth),
						y: Math.min(event.clientY, window.innerHeight - menuHeight)
					}
				})
			);
		},
		[currentUserId, dispatch]
	);
	const participantCount = Math.max(roomParticipantCount, participants.length + 1);
	const microphones = devices.filter((device) => device.kind === 'audioinput');
	const cameras = devices.filter((device) => device.kind === 'videoinput');
	const { sendEmojiReaction: sendMezonEmojiReaction, sendSoundReaction: sendMezonSoundReaction } = useSendReaction();
	const sendEmojiReaction = (emojiId: string, emoji: string) => {
		sendMezonEmojiReaction(emoji, emojiId);
		setShowEmojiPanel(false);
	};
	const sendSoundReaction = (soundId: string, soundUrl: string) => {
		sendMezonSoundReaction(soundUrl || soundId);
		setShowSoundPanel(false);
	};
	const getParticipantProfile = useCallback(
		(participant: RemoteMedia) => {
			const member = participant.userId ? clanMembers[participant.userId] : undefined;
			return {
				displayName:
					getNameForPrioritize(member?.clan_nick, member?.user?.display_name, member?.user?.username) ||
					participant.userId ||
					participant.id,
				avatar: getAvatarForPrioritize(member?.clan_avatar, member?.user?.avatar_url)
			};
		},
		[clanMembers]
	);
	const localMember = currentUserId ? clanMembers[currentUserId] : undefined;
	const localDisplayName =
		getNameForPrioritize(localMember?.clan_nick, localMember?.user?.display_name, localMember?.user?.username) || currentUserId || 'Mezon';
	const localAvatar = getAvatarForPrioritize(localMember?.clan_avatar, localMember?.user?.avatar_url);
	const isLocalAudioEnabled = joinRole === 'audience' ? pushToTalkActive : microphoneEnabled;
	const speakingMap = useParticipantsSpeakingMap(localAudioTrack, isLocalAudioEnabled, participants);
	const localSpeaking = isLocalAudioEnabled ? (speakingMap.get('local')?.speaking ?? false) : false;
	const conferenceTiles: Array<{ id: string; participantId: string; contextMenuUserId?: string; isScreen: boolean; content: ReactNode }> = [];
	conferenceTiles.push({
		id: 'local-camera',
		participantId: 'local',
		isScreen: false,
		content: (
			<div
				className={`relative aspect-video overflow-hidden rounded-xl border-2 bg-[#181825] transition-[border-color,box-shadow] duration-150 ${
					localSpeaking ? 'border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]' : 'border-transparent'
				}`}
			>
				{joinRole === 'speaker' && localPreview && cameraEnabled ? (
					<SfuVideo stream={localPreview} muted mirrored />
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
				<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] min-w-0 items-center gap-1 rounded-md bg-[#00000080] p-[5px] text-sm">
					{!(joinRole === 'audience' ? pushToTalkActive : microphoneEnabled) ? (
						<Icons.VoiceMicDisabledIcon scale={1.8} className="shrink-0" />
					) : null}
					<span className="truncate whitespace-nowrap py-0.5">{localDisplayName}</span>
				</div>
				{joinRole === 'audience' && (
					<span className="absolute right-2 top-2 rounded-md bg-[#00000080] p-[5px] text-xs text-white">Audience</span>
				)}
			</div>
		)
	});
	if (joinRole === 'speaker' && screenSharing && screenStreamRef.current) {
		conferenceTiles.push({
			id: 'local-screen',
			participantId: 'local',
			isScreen: true,
			content: (
				<div className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-[#5d5f66]">
					<SfuVideo stream={screenStreamRef.current} muted fit="contain" />
					<div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] min-w-0 items-center gap-1 rounded-md bg-[#00000080] p-[5px] text-sm">
						<Icons.VoiceScreenShareIcon className="!w-4 !h-4 shrink-0" color="currentColor" />
						<span className="truncate whitespace-nowrap py-0.5">{t('usernameScreen', { username: localDisplayName })}</span>
					</div>
				</div>
			)
		});
	}
	participants.forEach((participant) => {
		const profile = getParticipantProfile(participant);
		const participantSpeaking = speakingMap.get(participant.id)?.speaking ?? false;
		conferenceTiles.push({
			id: `${participant.id}-camera`,
			participantId: participant.id,
			contextMenuUserId: participant.userId,
			isScreen: false,
			content: (
				<SfuParticipantTile
					participant={participant}
					displayName={profile.displayName}
					avatar={profile.avatar}
					speaking={participantSpeaking}
					locallyMuted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
				/>
			)
		});
		if (participant.screen && participant.screenActive) {
			conferenceTiles.push({
				id: `${participant.id}-screen`,
				participantId: participant.id,
				contextMenuUserId: participant.userId,
				isScreen: true,
				content: <SfuScreenShareTile participant={participant} displayName={profile.displayName} />
			});
		}
	});

	const tilesById = new Map(conferenceTiles.map((tile) => [tile.id, tile]));
	const existingTileIds = new Set(conferenceTiles.map((tile) => tile.id));
	const retainedTileIds = gridTileOrderRef.current.filter((id) => existingTileIds.has(id));
	const retainedTileIdSet = new Set(retainedTileIds);
	const newScreenTileIds = conferenceTiles.filter((tile) => tile.isScreen && !retainedTileIdSet.has(tile.id)).map((tile) => tile.id);
	const newCameraTileIds = conferenceTiles.filter((tile) => !tile.isScreen && !retainedTileIdSet.has(tile.id)).map((tile) => tile.id);
	gridTileOrderRef.current = [...newScreenTileIds, ...retainedTileIds, ...newCameraTileIds];
	const retainedFocusTileIds = focusTileOrderRef.current.filter((id) => existingTileIds.has(id));
	const retainedFocusTileIdSet = new Set(retainedFocusTileIds);
	const newFocusScreenTileIds = conferenceTiles.filter((tile) => tile.isScreen && !retainedFocusTileIdSet.has(tile.id)).map((tile) => tile.id);
	const newFocusCameraTileIds = conferenceTiles.filter((tile) => !tile.isScreen && !retainedFocusTileIdSet.has(tile.id)).map((tile) => tile.id);
	focusTileOrderRef.current = [...newFocusScreenTileIds, ...retainedFocusTileIds, ...newFocusCameraTileIds];

	const activeSpeakerId = Array.from(speakingMap.entries())
		.filter(([, info]) => info.speaking)
		.sort(([, a], [, b]) => b.lastSpokeAt - a.lastSpokeAt)[0]?.[0];
	const preferredFocusTrack = conferenceTiles.find((tile) => tile.id.endsWith('-screen'))?.id || conferenceTiles[0]?.id;
	const hasPinnedTrack = conferenceTiles.some((tile) => tile.id === pinnedTrackId);
	const activePinnedTrackId = hasPinnedTrack
		? pinnedTrackId
		: conferenceTiles.some((tile) => tile.id === autoFocusedTrackId)
			? autoFocusedTrackId
			: preferredFocusTrack;
	const recordingTiles = useMemo<RecordingSceneTile[]>(() => {
		const sceneTiles: RecordingSceneTile[] = [
			{
				key: 'local-camera',
				participantId: 'local',
				label: localDisplayName,
				avatarUrl: localAvatar || null,
				videoTrack: joinRole === 'speaker' && cameraEnabled ? (localPreview?.getVideoTracks()[0] ?? null) : null,
				isScreenShare: false,
				focused: activePinnedTrackId === 'local-camera',
				speaking: localSpeaking
			}
		];

		if (joinRole === 'speaker' && screenSharing && screenStreamRef.current) {
			sceneTiles.push({
				key: 'local-screen',
				participantId: 'local',
				label: t('usernameScreen', { username: localDisplayName }),
				avatarUrl: localAvatar || null,
				videoTrack: screenStreamRef.current.getVideoTracks()[0] ?? null,
				isScreenShare: true,
				focused: activePinnedTrackId === 'local-screen',
				speaking: localSpeaking
			});
		}

		participants.forEach((participant) => {
			const profile = getParticipantProfile(participant);
			const participantSpeaking = speakingMap.get(participant.id)?.speaking ?? false;
			sceneTiles.push({
				key: `${participant.id}-camera`,
				participantId: participant.id,
				label: profile.displayName,
				avatarUrl: profile.avatar || null,
				videoTrack: participant.video?.readyState === 'live' && participant.cameraActive !== false ? participant.video : null,
				isScreenShare: false,
				focused: activePinnedTrackId === `${participant.id}-camera`,
				speaking: participantSpeaking
			});
			if (participant.screen?.readyState === 'live' && participant.screenActive) {
				sceneTiles.push({
					key: `${participant.id}-screen`,
					participantId: participant.id,
					label: t('usernameScreen', { username: profile.displayName }),
					avatarUrl: profile.avatar || null,
					videoTrack: participant.screen,
					isScreenShare: true,
					focused: activePinnedTrackId === `${participant.id}-screen`,
					speaking: participantSpeaking
				});
			}
		});

		return sceneTiles;
	}, [
		activePinnedTrackId,
		cameraEnabled,
		getParticipantProfile,
		joinRole,
		localAvatar,
		localDisplayName,
		localPreview,
		localSpeaking,
		participants,
		screenSharing,
		speakingMap,
		t
	]);
	const recordingAudioSources = useMemo<RecordingAudioSource[]>(() => {
		const sources: RecordingAudioSource[] = [];
		if (isLocalAudioEnabled && localAudioTrack?.readyState === 'live') {
			sources.push({ key: 'local-audio', track: localAudioTrack });
		}
		participants.forEach((participant) => {
			if (participant.audio?.readyState === 'live' && !participant.isMute) {
				sources.push({ key: `${participant.id}-audio`, track: participant.audio });
			}
		});
		return sources;
	}, [isLocalAudioEnabled, localAudioTrack, participants]);
	useSfuCallRecorder({ tiles: recordingTiles, audioSources: recordingAudioSources });
	const gridLayout = useSfuGridLayout(gridElRef, conferenceTiles.length);

	if (isGridView && activeSpeakerId && gridLayout.maxTiles > 0) {
		const activeSpeakerIndex = gridTileOrderRef.current.findIndex((id) => tilesById.get(id)?.participantId === activeSpeakerId);
		const firstPageCapacity = Math.max(1, gridLayout.maxTiles);
		if (activeSpeakerIndex >= firstPageCapacity) {
			// Swap with the last visible slot instead of shifting the whole page.
			const replacementIndex = firstPageCapacity - 1;
			[gridTileOrderRef.current[replacementIndex], gridTileOrderRef.current[activeSpeakerIndex]] = [
				gridTileOrderRef.current[activeSpeakerIndex],
				gridTileOrderRef.current[replacementIndex]
			];
		}
	}

	const orderedConferenceTiles = gridTileOrderRef.current.map((id) => tilesById.get(id)).filter(Boolean) as typeof conferenceTiles;
	const focusConferenceTiles = focusTileOrderRef.current.map((id) => tilesById.get(id)).filter(Boolean) as typeof conferenceTiles;
	const pinnedTile = activePinnedTrackId ? tilesById.get(activePinnedTrackId) : undefined;
	const isPopoutTrackAvailable = !popoutTrackId || conferenceTiles.some((tile) => tile.id === popoutTrackId);
	const activeSpeakerTileId = focusConferenceTiles.find((tile) => tile.participantId === activeSpeakerId)?.id;
	const gridPagination = useSfuPagination(gridLayout.maxTiles, orderedConferenceTiles);

	useEffect(() => {
		if (isGridView || !activeSpeakerId) return;
		if (pinnedTile?.participantId === activeSpeakerId) return;
		if (!showFocusThumbnails) {
			if (!hasPinnedTrack && activeSpeakerTileId) setAutoFocusedTrackId(activeSpeakerTileId);
			return;
		}

		const container = focusThumbnailsRef.current;
		const thumbnails = Array.from(container?.querySelectorAll<HTMLElement>('[data-tile-id]') || []);
		if (!container || thumbnails.length === 0) return;

		const containerRect = container.getBoundingClientRect();
		const visibleThumbnails = thumbnails.filter((thumbnail) => {
			const rect = thumbnail.getBoundingClientRect();
			return rect.left >= containerRect.left && rect.right <= containerRect.right;
		});
		if (visibleThumbnails.some((thumbnail) => thumbnail.dataset.participantId === activeSpeakerId)) return;

		const replacementTileId = visibleThumbnails[visibleThumbnails.length - 1]?.dataset.tileId;
		const activeIndex = focusTileOrderRef.current.indexOf(activeSpeakerTileId || '');
		const replacementIndex = focusTileOrderRef.current.indexOf(replacementTileId || '');
		if (activeIndex < 0 || replacementIndex < 0) return;

		[focusTileOrderRef.current[replacementIndex], focusTileOrderRef.current[activeIndex]] = [
			focusTileOrderRef.current[activeIndex],
			focusTileOrderRef.current[replacementIndex]
		];
		renderFocusTileOrder((version) => version + 1);
	}, [activeSpeakerId, activeSpeakerTileId, hasPinnedTrack, isGridView, pinnedTile?.participantId, showFocusThumbnails]);

	useEffect(() => {
		if (!isPopoutTrackAvailable) void closePopout();
	}, [closePopout, isPopoutTrackAvailable]);

	return (
		<div className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#11111b] text-white">
			<ReactionCallHandler />
			<SfuVoiceInteractiveLayer channelId={roomId} />
			<SfuRoomAudioRenderer participants={participants} mutedParticipantIds={mutedParticipantIds} />
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
					<button
						type="button"
						title={t('chat')}
						className={isChatOpen ? 'text-[var(--bg-icon-theme-active)]' : ''}
						onClick={onToggleChat}
						data-e2e={generateE2eId('chat.channel_message.header.button.chat')}
					>
						<Icons.Chat className="h-5 w-5" />
					</button>
				</div>
			</header>

			{isGridView ? (
				<SfuGridLayoutContainer
					ref={gridElRef}
					onWheel={(e) => {
						if (gridPagination.totalPageCount <= 1) return;
						const now = Date.now();
						if (now - lastGridWheelTimeRef.current < 250) return;
						if (e.deltaY > 10) {
							lastGridWheelTimeRef.current = now;
							gridPagination.nextPage();
						} else if (e.deltaY < -10) {
							lastGridWheelTimeRef.current = now;
							gridPagination.prevPage();
						}
					}}
				>
					<div
						className="grid min-h-0 flex-1 gap-2 overflow-hidden"
						style={{
							gridTemplateColumns: `repeat(${gridLayout.columns}, minmax(0, 1fr))`,
							gridTemplateRows: `repeat(${gridLayout.rows}, minmax(0, 1fr))`
						}}
					>
						{gridPagination.pageItems.map((tile) => (
							<button
								key={tile.id}
								type="button"
								className="relative h-full w-full min-h-0 min-w-0 overflow-hidden text-left [&>div]:!h-full [&>div]:!w-full [&>div]:!aspect-auto"
								title="Pin this track"
								onClick={() => {
									setPinnedTrackId(tile.id);
									setIsGridView(false);
								}}
								onContextMenu={(event) => handleParticipantContextMenu(event, tile.contextMenuUserId)}
							>
								{tile.content}
							</button>
						))}
					</div>

					{gridPagination.totalPageCount > 1 && (
						<div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
							{Array.from({ length: gridPagination.totalPageCount }).map((_, idx) => {
								const pageNum = idx + 1;
								const isActive = pageNum === gridPagination.currentPage;
								return (
									<button
										key={pageNum}
										type="button"
										className={`h-2.5 w-2.5 rounded-full transition-all ${
											isActive ? 'bg-white opacity-100' : 'bg-white/40 hover:bg-white/70'
										}`}
										onClick={() => gridPagination.setPage(pageNum)}
										title={`Page ${pageNum}`}
									/>
								);
							})}
						</div>
					)}
				</SfuGridLayoutContainer>
			) : (
				<SfuFocusLayoutContainer>
					<div
						ref={focusVideoContainerRef}
						className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#5d5f66]"
					>
						<div
							className="h-full w-full min-h-0 min-w-0 [&>div]:!h-full [&>div]:!w-full [&>div]:!aspect-auto"
							onContextMenu={(event) => handleParticipantContextMenu(event, pinnedTile?.contextMenuUserId)}
						>
							{pinnedTile?.content}
						</div>
					</div>
					{focusConferenceTiles.length > 1 && (
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
							<div
								ref={focusThumbnailsRef}
								className={`${
									showFocusThumbnails ? 'flex' : 'hidden'
								} h-36 shrink-0 gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6d6f77] [&::-webkit-scrollbar-track]:bg-transparent`}
								onWheel={(e) => {
									e.stopPropagation();
									e.currentTarget.scrollLeft += e.deltaY;
								}}
							>
								{focusConferenceTiles
									.filter((tile) => tile.id !== activePinnedTrackId)
									.map((tile) => (
										<button
											key={tile.id}
											data-tile-id={tile.id}
											data-participant-id={tile.participantId}
											type="button"
											className="w-56 shrink-0 overflow-hidden rounded-xl border-2 border-transparent text-left transition-colors hover:border-zinc-500"
											onClick={() => setPinnedTrackId(tile.id)}
											onContextMenu={(event) => handleParticipantContextMenu(event, tile.contextMenuUserId)}
										>
											{tile.content}
										</button>
									))}
							</div>
						</>
					)}
				</SfuFocusLayoutContainer>
			)}

			<SfuVoiceContextMenu channelId={roomId} onParticipantAction={handleParticipantAction} />
			<SfuControlBar
				channelLabel={channelLabel || roomId}
				joinRole={joinRole}
				hasMicrophoneAccess={hasMicrophoneAccess ?? false}
				hasCameraAccess={hasCameraAccess ?? false}
				pushToTalkActive={pushToTalkActive}
				microphoneEnabled={microphoneEnabled}
				cameraEnabled={cameraEnabled}
				screenSharing={screenSharing}
				isGridView={isGridView}
				showEmojiPanel={showEmojiPanel}
				showSoundPanel={showSoundPanel}
				showVoiceInteractivePanel={showVoiceInteractivePanel}
				microphones={microphones}
				cameras={cameras}
				selectedMicrophone={selectedMicrophone}
				selectedCamera={selectedCamera}
				isPopoutOpen={isPopoutOpen}
				isFullScreen={isFullScreen}
				onEmojiPanelChange={setShowEmojiPanel}
				onSoundPanelChange={setShowSoundPanel}
				onVoiceInteractivePanelChange={setShowVoiceInteractivePanel}
				onEmojiSelect={sendEmojiReaction}
				onSoundSelect={sendSoundReaction}
				onPushToTalk={(active) => void setPushToTalk(active)}
				onMicrophoneToggle={() => dispatch(voiceActions.setShowMicrophone(!microphoneEnabled))}
				onCameraToggle={() => dispatch(voiceActions.setShowCamera(!cameraEnabled))}
				onScreenShareToggle={() => void toggleScreenShare()}
				onMicrophoneSelect={(deviceId) => void changeInputDevice('audioinput', deviceId)}
				onCameraSelect={(deviceId) => void changeInputDevice('videoinput', deviceId)}
				onLeaveRoom={onLeaveRoom}
				onTogglePopout={() => void togglePopout(activePinnedTrackId)}
				onFullScreen={onFullScreen}
			/>
		</div>
	);
}

export default MezonSfuVoiceRoom;
