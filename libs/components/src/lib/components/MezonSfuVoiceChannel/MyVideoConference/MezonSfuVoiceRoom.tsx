import { useAuth } from '@mezon/core';
import {
	generateMeetToken,
	selectEntitesUserClans,
	selectNoiseSuppressionEnabled,
	selectShowCamera,
	selectShowMicrophone,
	toastActions,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	GUEST_NAME,
	createImgproxyUrl,
	ensureMediaPermission,
	generateE2eId,
	getAvatarForPrioritize,
	getMezonNsAudioCaptureOptions,
	getNameForPrioritize,
	getNoiseSuppressionAudioCaptureOptions,
	reportMediaAccessError,
	useMediaPermissions
} from '@mezon/utils';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import { SfuControlBar } from '../ControlBar/SfuControlBar';
import { RecordingIndicator } from '../Recording/RecordingIndicator';
import type { RecordingAudioSource, RecordingSceneTile } from '../Recording/types';
import { useRecordingBroadcast } from '../Recording/useRecordingBroadcast';
import { useSfuCallRecorder } from '../Recording/useSfuCallRecorder';
import type { SfuConnectionState as ConnectionState, SfuRemoteMedia as RemoteMedia, SfuPeer, SfuSignalMessage as SignalMessage } from '../types';
import type { ExternalChatRef } from './ChatMeeting';
import ChatStreamExternal from './ChatMeeting';
import { SfuFocusLayoutContainer } from './FocusLayout/SfuFocusLayoutContainer';
import { SfuGridLayoutContainer } from './GridLayout/SfuGridLayoutContainer';
import { useSfuGridLayout, useSfuPagination } from './GridLayout/useSfuGridLayout';
import { SfuRoomAudioRenderer } from './Media/SfuRoomAudioRenderer';
import { SfuVideo } from './Media/SfuVideo';
import { MezonNsAudioPipeline } from './Media/mezonNs/MezonNsAudioPipeline';
import { SfuParticipantTile } from './ParticipantTile/SfuParticipantTile';
import { ScreenShareFocusContext, SfuScreenShareTile } from './ParticipantTile/SfuScreenShareTile';
import { ReactionCallHandler, useSendReaction } from './Reaction';
import { SfuVoiceContextMenu } from './VoiceContextMenu';
import { SfuVoiceInteractiveLayer } from './VoiceContextMenu/SfuVoiceInteractiveLayer';
import { meetTokenNeedsRefresh } from './meetToken';
import {
	canReactivateMid,
	getDepartedMids,
	getMsidOccupantsByMidFromSdp,
	getRemoteParticipants,
	isCurrentSfuPeer,
	isReceivingRemoteTrack,
	isRemoteScreenSharing,
	mergeRemotePeerState,
	type RetiredSource
} from './remoteMediaLifecycle';
import { ScreenKeyframeRecovery } from './screenKeyframeRecovery';
import {
	SCREEN_SHARE_PROFILES,
	applyScreenShareEncoding,
	getScreenShareConstraints,
	updateScreenShareQuality,
	type ScreenShareMode
} from './screenShareQuality';

import { SfuMediaHealth, SfuNetworkQuality } from './sfuMediaHealth';
import { SfuMuteSync, sfuCloseAction, sfuReconnectDelay, withSfuTimeout } from './sfuReconnect';

const ICE_RECOVERY_GRACE_MS = 4000;
const NETWORK_QUALITY_INTERVAL_MS = 5000;
const TRANSPORT_CONNECT_DEADLINE_MS = 15_000;
const MAX_TOKEN_REFRESH_ATTEMPTS = 3;
const MAX_RECONNECT_ATTEMPTS = 4;
const MAX_RECOVERY_MS = 120_000;
const SFU_SERVER_RESTART_CLOSE_CODE = 1001;
const SFU_ALONE_TIMEOUT_CLOSE_CODE = 4011;
const SFU_DUPLICATE_SESSION_CLOSE_CODE = 4012;
const PREFERRED_MICROPHONE_STORAGE_KEY = 'mezon.voice.inputDeviceId';
const PREFERRED_SPEAKER_STORAGE_KEY = 'mezon.voice.outputDeviceId';
const microphoneDeviceConstraint = (deviceId: string) => ({ deviceId: { exact: deviceId } });
const getNativeMicrophoneCaptureOptions = () => {
	const options = getNoiseSuppressionAudioCaptureOptions(true);
	options.voiceIsolation = false;
	return options;
};
const SFU_PARTICIPANT_ACTION_ERRORS = new Set([
	'invalid_token',
	'token_room_mismatch',
	'target_not_found',
	'invalid_participant_action',
	'unsupported_participant_action',
	'auth_not_configured'
]);

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
			} catch {} // eslint-disable-line no-empty
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
				} catch {} // eslint-disable-line no-empty
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
const SCREEN_KEYFRAME_REFRESH_DELAYS_MS = [1500, 4000];
const SCREEN_KEYFRAME_MIN_INTERVAL_MS = 1000;

const setSenderEncodingsActive = async (sender: RTCRtpSender, active: boolean) => {
	const parameters = sender.getParameters();
	if (!parameters.encodings?.length) return false;
	parameters.encodings.forEach((encoding) => {
		encoding.active = active;
	});
	await sender.setParameters(parameters);
	return true;
};

const CAMERA_TIERS = [
	{ maxCameras: 2, width: 640, height: 360, frameRate: 24, kbps: 1000, uncapped: true },
	{ maxCameras: 4, width: 480, height: 270, frameRate: 24, kbps: 500, uncapped: false },
	{ maxCameras: 8, width: 320, height: 180, frameRate: 20, kbps: 300, uncapped: false },
	{ maxCameras: Number.POSITIVE_INFINITY, width: 320, height: 180, frameRate: 15, kbps: 200, uncapped: false }
];
const UNCAPPED_CAMERA_FRAMERATE = 30;
const CAMERA_TIER_DOWNGRADE_MS = 1500;
const CAMERA_TIER_UPGRADE_MS = 6000;

const cameraTierAt = (index: number) => CAMERA_TIERS[index] ?? CAMERA_TIERS[0];
const cameraTierIndexFor = (cameras: number, margin = 0) => CAMERA_TIERS.findIndex((tier) => cameras <= tier.maxCameras - margin);

const resolveCameraTier = (cameras: number, currentIndex: number) => {
	const target = cameraTierIndexFor(cameras);
	return target >= currentIndex ? target : Math.min(currentIndex, cameraTierIndexFor(cameras, 1));
};

const cameraRange = (value: number, capped: boolean) => (capped ? { ideal: value, max: value } : { ideal: value });

const getCameraConstraints = (index: number): MediaTrackConstraints => {
	const { width, height, frameRate, uncapped } = cameraTierAt(index);
	return { width: cameraRange(width, !uncapped), height: cameraRange(height, !uncapped), frameRate: cameraRange(frameRate, !uncapped) };
};

const SCREEN_MIN_BITRATE_KBPS = 400;
const SCREEN_START_BITRATE_KBPS = 1000;
const SCREEN_MAX_BITRATE_KBPS = 3500;

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
			console.warn(`setCodecPreferences for ${wanted} failed:`, e);
		}
	}
	return false;
};

const mungeVideoSectionBitrate = (section: string, minKbps: number, startKbps: number, maxKbps: number) => {
	const pts = new Set<string>();
	for (const m of section.matchAll(/^a=rtpmap:(\d+) VP8\//gim)) {
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

const mungeVideoBitrates = (sdp: string | undefined, cameraTierIndex: number) => {
	if (!sdp) return sdp;
	const { kbps } = cameraTierAt(cameraTierIndex);
	return sdp
		.split(/(?=^m=)/gm)
		.map((section) => {
			const mid = section.match(/^a=mid:(\S+)/m)?.[1];
			if (mid === '1') {
				return mungeVideoSectionBitrate(section, kbps / 4, kbps / 2, kbps);
			}
			if (mid === '2') {
				return mungeVideoSectionBitrate(section, SCREEN_MIN_BITRATE_KBPS, SCREEN_START_BITRATE_KBPS, SCREEN_MAX_BITRATE_KBPS);
			}
			return section;
		})
		.join('');
};

const applyVideoEncodingParams = async (pc: RTCPeerConnection, cameraTierIndex: number) => {
	const uplink =
		pc.getTransceivers().find((t) => t.mid === '1') ||
		pc.getTransceivers().find((t) => t.sender && t.sender.track && t.sender.track.kind === 'video');
	if (!uplink?.sender) return;

	try {
		const tier = cameraTierAt(cameraTierIndex);
		const params = uplink.sender.getParameters();
		if (!params.encodings?.length) {
			params.encodings = [{}];
		}
		params.degradationPreference = 'maintain-framerate';
		const encoding = params.encodings[0] as RTCRtpEncodingParameters & { scalabilityMode?: string };
		delete encoding.scalabilityMode;
		encoding.maxBitrate = tier.kbps * 1000;
		encoding.maxFramerate = tier.uncapped ? UNCAPPED_CAMERA_FRAMERATE : tier.frameRate;
		encoding.scaleResolutionDownBy = 1;
		encoding.priority = 'high';
		encoding.networkPriority = 'high';
		await uplink.sender.setParameters(params);
	} catch (e) {
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
	isExternalCalling?: boolean;
	onRefreshToken?: () => Promise<string | undefined>;
	onLeaveRoom: () => void;
	onReconnectRequired?: (networkLost: boolean) => void;
	onFullScreen: () => void;
	onToggleChat: () => void;
	username?: string;
	isPrivateVoice?: boolean;
}

type SfuOffer = { sdp: string; offer_generation: number };
const AGENT_AVATAR =
	'https://imgproxy.komu.vn/K0YUZRIosDOcz5lY6qrgC6UIXmQgWzLjZv7VJ1RAA8c/rs:fit:100:100:1/mb:2097152/plain/https://cdn.mezon.vn/0/0/1779484387973271600/1737423959329_undefined173740153013517374015248704886401586613166392.png@webp';
const AGENT_DISPLAY_NAME = 'KOMU Agent';
export function MezonSfuVoiceRoom({
	token,
	joinRole,
	roomId,
	serverUrl,
	channelLabel,
	isChatOpen,
	isFullScreen,
	isExternalCalling,
	onRefreshToken,
	onLeaveRoom,
	onReconnectRequired,
	onFullScreen,
	onToggleChat,
	username,
	isPrivateVoice
}: MezonSfuVoiceRoomProps) {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();
	const { userProfile, userId } = useAuth();
	const currentUserId = userId || '';
	const clanMembers = useSelector(selectEntitesUserClans);
	const microphoneEnabled = useSelector(selectShowMicrophone);
	const cameraEnabled = useSelector(selectShowCamera);
	const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
	const noiseSuppressionEnabledRef = useRef(noiseSuppressionEnabled);
	const { hasMicrophoneAccess, hasCameraAccess, microphonePermissionState, cameraPermissionState } = useMediaPermissions();

	const handleRequestCameraPermission = useCallback(async () => {
		const enableCamera = () => dispatch(voiceActions.setShowCamera(true));
		if (await ensureMediaPermission('camera', enableCamera)) enableCamera();
	}, [dispatch]);
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const localMediaPreparedRef = useRef(false);
	const [localMediaPrepared, setLocalMediaPrepared] = useState(false);
	const mezonNsPipelineRef = useRef<MezonNsAudioPipeline | null>(null);
	const mezonNsGenerationRef = useRef(0);
	const microphoneCaptureModeRef = useRef(new WeakMap<MediaStreamTrack, 'native' | 'mezon-ns'>());
	const preferredMicrophoneIdRef = useRef(localStorage.getItem(PREFERRED_MICROPHONE_STORAGE_KEY) || 'default');
	const [mezonNsUnavailable, setMezonNsUnavailable] = useState(false);
	const mezonNsUnavailableRef = useRef(mezonNsUnavailable);
	mezonNsUnavailableRef.current = mezonNsUnavailable;
	const getMicrophoneCaptureOptions = useCallback(() => {
		const processing =
			noiseSuppressionEnabledRef.current && !mezonNsUnavailableRef.current
				? getMezonNsAudioCaptureOptions()
				: getNativeMicrophoneCaptureOptions();
		return { ...processing, ...microphoneDeviceConstraint(preferredMicrophoneIdRef.current) };
	}, []);
	const openPreferredMicrophone = useCallback(async (audio: MediaTrackConstraints, video: MediaTrackConstraints | boolean) => {
		try {
			return await navigator.mediaDevices.getUserMedia({ audio, video });
		} catch (cause) {
			if ((cause as { name?: string } | null)?.name !== 'OverconstrainedError') throw cause;
			const preferred = preferredMicrophoneIdRef.current;
			const microphoneIds = (await navigator.mediaDevices.enumerateDevices())
				.filter((device) => device.kind === 'audioinput')
				.map((device) => device.deviceId);
			if (microphoneIds.includes(preferred)) throw cause;
			const systemDefault = preferred !== 'default' && microphoneIds.includes('default') ? { exact: 'default' } : undefined;
			return navigator.mediaDevices.getUserMedia({ audio: { ...audio, deviceId: systemDefault }, video });
		}
	}, []);
	const getOutgoingAudioTrack = useCallback((inputTrack: MediaStreamTrack | null | undefined) => {
		if (!inputTrack) return null;
		const pipeline = mezonNsPipelineRef.current;
		if (noiseSuppressionEnabledRef.current && pipeline?.inputTrack === inputTrack && pipeline.isDenoisingReady) return pipeline.track;
		return microphoneCaptureModeRef.current.get(inputTrack) === 'native' ? inputTrack : null;
	}, []);
	const setAudioTrackEnabled = useCallback((inputTrack: MediaStreamTrack, enabled: boolean) => {
		inputTrack.enabled = enabled;
		const pipeline = mezonNsPipelineRef.current;
		if (pipeline?.inputTrack === inputTrack) pipeline.setOutputEnabled(enabled);
	}, []);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const screenShareModeRef = useRef<ScreenShareMode>('text');
	const changingScreenShareModeRef = useRef(false);
	const screenKeyFrameTimersRef = useRef<number[]>([]);
	const lastScreenKeyFrameAtRef = useRef(0);
	const refreshingScreenKeyFrameRef = useRef(false);
	const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
	const cameraQualityTierRef = useRef(0);
	const localTracksAddedRef = useRef(false);
	const negotiatingRef = useRef(false);
	const joinedRef = useRef(false);
	const pushToTalkRequestedRef = useRef(false);
	const pendingOfferRef = useRef<SfuOffer | null>(null);
	const lastOfferGenerationRef = useRef(-1);
	const retiredMidsRef = useRef(new Map<string, RetiredSource>());
	const userIdsByMidRef = useRef(new Map<string, string>());
	const peerIdsByMidRef = useRef(new Map<string, string>());
	const rolesByMidRef = useRef(new Map<string, 'speaker' | 'audience'>());
	const [selfPeerId, setSelfPeerId] = useState<string>();
	const selfPeerIdRef = useRef<string>();
	const peerStateByIdRef = useRef(new Map<string, SfuPeer>());
	const currentSfuRoleRef = useRef(joinRole);
	const microphonePermissionRevokedRef = useRef(false);
	const desiredMediaRef = useRef({ microphoneEnabled, cameraEnabled });
	const onLeaveRoomRef = useRef(onLeaveRoom);
	const onReconnectRequiredRef = useRef(onReconnectRequired);
	onReconnectRequiredRef.current = onReconnectRequired;
	const requestManualRejoinRef = useRef<() => void>(() => undefined);
	const handleAudioPlaybackFailure = useCallback((track: MediaStreamTrack) => {
		const pc = pcRef.current;
		if (pc?.getReceivers().some((receiver) => receiver.track === track)) requestManualRejoinRef.current();
	}, []);
	const onRefreshTokenRef = useRef(onRefreshToken);
	const tRef = useRef(t);
	const muteSyncRef = useRef(new SfuMuteSync());
	const connectionEpochRef = useRef(0);
	const restartSessionRef = useRef<() => void>(() => undefined);
	const pendingForcedMuteRef = useRef<number>();
	const refreshingTokenRef = useRef(false);

	const sendMute = useCallback((muted: boolean) => {
		const ws = wsRef.current;
		if (!joinedRef.current || ws?.readyState !== WebSocket.OPEN) return;
		if (pendingForcedMuteRef.current !== undefined) window.clearTimeout(pendingForcedMuteRef.current);
		pendingForcedMuteRef.current = undefined;
		try {
			ws.send(JSON.stringify({ type: 'mute', is_mute: muted }));
			muteSyncRef.current.sent(muted, Date.now());
		} catch {
			restartSessionRef.current();
		}
	}, []);

	useEffect(() => {
		onRefreshTokenRef.current = onRefreshToken;
	}, [onRefreshToken]);
	const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
	const [weakNetwork, setWeakNetwork] = useState(false);
	const weakNetworkRef = useRef(weakNetwork);
	weakNetworkRef.current = weakNetwork;
	const [error, setError] = useState<string>();
	const [localPreview, setLocalPreview] = useState<MediaStream>();
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack>();
	const [remoteMedia, setRemoteMedia] = useState<Map<string, RemoteMedia>>(() => new Map());
	const remoteMediaRef = useRef(remoteMedia);
	remoteMediaRef.current = remoteMedia;
	const [screenKeyframeRecovery] = useState(
		() =>
			new ScreenKeyframeRecovery({
				canSend: () =>
					joinedRef.current &&
					!negotiatingRef.current &&
					wsRef.current?.readyState === WebSocket.OPEN &&
					pcRef.current?.connectionState === 'connected' &&
					pcRef.current.signalingState === 'stable',
				isCurrent: (publisherId, track) =>
					String(publisherId) !== selfPeerIdRef.current &&
					[...remoteMediaRef.current.values()].some(
						(participant) =>
							participant.peerId === String(publisherId) && participant.screen === track && isRemoteScreenSharing(participant)
					),
				send: (publisherId) => {
					const ws = wsRef.current;
					if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('SFU signaling is not connected');
					ws.send(JSON.stringify({ type: 'request_keyframe', kind: 'screen', publisher_id: publisherId }));
				}
			})
	);
	useEffect(() => screenKeyframeRecovery.wake(), [remoteMedia, screenKeyframeRecovery]);
	const [roomParticipantCount, setRoomParticipantCount] = useState(1);
	const [screenSharing, setScreenSharing] = useState(false);
	const [screenShareMode, setScreenShareMode] = useState<ScreenShareMode>('text');
	const [changingScreenShareMode, setChangingScreenShareMode] = useState(false);
	const [pushToTalkActive, setPushToTalkActive] = useState(false);
	const [pushToTalkHintDismissed, setPushToTalkHintDismissed] = useState(false);
	useEffect(() => {
		setPushToTalkHintDismissed(false);
	}, [roomId, joinRole]);
	const holdToTalkRef = useRef(false);
	const microphoneEnabledRef = useRef(microphoneEnabled);
	microphoneEnabledRef.current = microphoneEnabled;
	const microphonePermissionStateRef = useRef(microphonePermissionState);
	microphonePermissionStateRef.current = microphonePermissionState;
	const cameraPermissionStateRef = useRef(cameraPermissionState);
	cameraPermissionStateRef.current = cameraPermissionState;
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
	const [selectedMicrophone, setSelectedMicrophone] = useState(preferredMicrophoneIdRef.current);
	const [selectedSpeaker, setSelectedSpeaker] = useState(() => localStorage.getItem(PREFERRED_SPEAKER_STORAGE_KEY) || 'default');
	const [selectedCamera, setSelectedCamera] = useState('default');
	useEffect(() => {
		const handleOutputDeviceChange = (e: Event) => {
			const customEvent = e as CustomEvent<string | { deviceId?: string }>;
			const nextId =
				typeof customEvent.detail === 'string'
					? customEvent.detail
					: (customEvent.detail as { deviceId?: string })?.deviceId || localStorage.getItem(PREFERRED_SPEAKER_STORAGE_KEY) || 'default';
			setSelectedSpeaker((prev) => (prev !== nextId ? nextId : prev));
		};
		window.addEventListener('mezon:outputDeviceChange', handleOutputDeviceChange);
		window.addEventListener('storage', handleOutputDeviceChange);
		return () => {
			window.removeEventListener('mezon:outputDeviceChange', handleOutputDeviceChange);
			window.removeEventListener('storage', handleOutputDeviceChange);
		};
	}, []);
	const syncSelectedMicrophone = useCallback((track: MediaStreamTrack) => {
		setSelectedMicrophone(track.getSettings().deviceId || preferredMicrophoneIdRef.current);
	}, []);
	const lastShownErrorRef = useRef<string>();
	const lastGridWheelTimeRef = useRef<number>(0);
	const gridElRef = useRef<HTMLElement>(null);
	const gridTileOrderRef = useRef<string[]>([]);
	const focusTileOrderRef = useRef<string[]>([]);
	const focusThumbnailsRef = useRef<HTMLDivElement>(null);
	const focusVideoContainerRef = useRef<HTMLDivElement>(null);
	const [, renderFocusTileOrder] = useState(0);
	onLeaveRoomRef.current = onLeaveRoom;
	tRef.current = t;
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
		dispatch(toastActions.addToast({ message: error, type: 'error', autoClose: 3000 }));
	}, [dispatch, error]);

	useEffect(() => {
		if (connectionState !== 'connected') {
			setWeakNetwork(false);
			return;
		}
		let cancelled = false;
		const quality = new SfuNetworkQuality();
		const timer = window.setInterval(() => {
			const pc = pcRef.current;
			if (!pc) return;
			void withSfuTimeout(pc.getStats(), 2000)
				.then((report) => {
					if (!cancelled && pcRef.current === pc) setWeakNetwork(quality.isWeak(report));
				})
				.catch(() => undefined);
		}, NETWORK_QUALITY_INTERVAL_MS);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [connectionState]);

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
			await applyScreenShareEncoding(sender, screenShareModeRef.current);
		} catch (e) {
			console.warn('applyScreenEncodingParams failed:', e);
		}
	}, []);

	const changeScreenShareMode = useCallback(
		async (mode: ScreenShareMode) => {
			if (changingScreenShareModeRef.current || mode === screenShareModeRef.current) return;
			changingScreenShareModeRef.current = true;
			setChangingScreenShareMode(true);
			try {
				const track = screenStreamRef.current?.getVideoTracks()[0];
				if (track?.readyState === 'live') {
					const sender = findUplinkVideoSender('2');
					if (!sender) throw new Error('Screen sender is not negotiated');
					await updateScreenShareQuality(track, sender, mode);
				}
				screenShareModeRef.current = mode;
				setScreenShareMode(mode);
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : 'Unable to change screen share mode');
			} finally {
				changingScreenShareModeRef.current = false;
				setChangingScreenShareMode(false);
			}
		},
		[findUplinkVideoSender]
	);

	const refreshScreenKeyFrame = useCallback(async () => {
		const track = screenStreamRef.current?.getVideoTracks()[0];
		if (track?.readyState !== 'live' || refreshingScreenKeyFrameRef.current || changingScreenShareModeRef.current) return;
		const sender = findUplinkVideoSender('2');
		if (!sender || sender.track !== track) return;
		const now = Date.now();
		if (now - lastScreenKeyFrameAtRef.current < SCREEN_KEYFRAME_MIN_INTERVAL_MS) return;
		lastScreenKeyFrameAtRef.current = now;
		refreshingScreenKeyFrameRef.current = true;
		try {
			if (await setSenderEncodingsActive(sender, false)) await setSenderEncodingsActive(sender, true);
		} catch (e) {
			console.warn('refreshScreenKeyFrame failed:', e);
			await setSenderEncodingsActive(sender, true).catch(() => false);
		} finally {
			refreshingScreenKeyFrameRef.current = false;
		}
	}, [findUplinkVideoSender]);

	const scheduleScreenKeyFrameRefresh = useCallback(() => {
		if (screenStreamRef.current?.getVideoTracks()[0]?.readyState !== 'live') return;
		for (const delay of SCREEN_KEYFRAME_REFRESH_DELAYS_MS) {
			const timer = window.setTimeout(() => {
				screenKeyFrameTimersRef.current = screenKeyFrameTimersRef.current.filter((item) => item !== timer);
				void refreshScreenKeyFrame();
			}, delay);
			screenKeyFrameTimersRef.current.push(timer);
		}
	}, [refreshScreenKeyFrame]);

	const clearScreenKeyFrameRefresh = useCallback(() => {
		screenKeyFrameTimersRef.current.forEach((timer) => window.clearTimeout(timer));
		screenKeyFrameTimersRef.current = [];
	}, []);

	const syncRemoteMedia = useCallback((pc: RTCPeerConnection) => {
		if (pcRef.current !== pc || negotiatingRef.current) return;
		setRemoteMedia((current) => {
			if (pcRef.current !== pc || negotiatingRef.current) return current;
			const next = new Map(current);
			for (const transceiver of pc.getTransceivers()) {
				const mid = transceiver.mid;
				if (!mid || !getRemoteMediaKind(mid)) continue;
				const track = transceiver.receiver.track;
				const id = getRemoteParticipantId(mid);
				const kind = getRemoteMediaKind(mid);
				const field = kind === 'audio' ? 'audio' : kind === 'camera' ? 'video' : 'screen';
				const previous = next.get(id);
				if (retiredMidsRef.current.has(mid) || !isReceivingRemoteTrack(transceiver)) {
					if (previous) {
						const participant = { ...previous, [field]: undefined };
						if (!participant.audio && !participant.video && !participant.screen) next.delete(id);
						else next.set(id, participant);
					}
					continue;
				}
				const peerId = peerIdsByMidRef.current.get(mid) || previous?.peerId;
				const userId = userIdsByMidRef.current.get(mid) || previous?.userId;
				const changedUser = previous?.userId && userId && previous.userId !== userId;
				let participant: RemoteMedia = changedUser ? { id } : { ...previous, id };
				if (peerId) {
					participant = mergeRemotePeerState(
						participant,
						peerStateByIdRef.current.get(peerId) || { peer_id: peerId, user_id: userId, role: rolesByMidRef.current.get(mid) }
					);
				} else {
					participant.userId = userId;
				}
				participant[field] = track;
				next.set(id, participant);
			}
			return next;
		});
	}, []);

	const applySfuPeers = useCallback(
		(peers: SfuPeer[]) => {
			const updatedPeers = peers.map((peer) => {
				const peerId = String(peer.peer_id);
				const updated = { ...peerStateByIdRef.current.get(peerId), ...peer };
				peerStateByIdRef.current.set(peerId, updated);
				return updated;
			});
			for (const peer of peers) {
				for (const mid of [peer.mid_audio, peer.mid_video, peer.mid_screen].filter((mid) => mid != null && Number(mid) >= 3).map(String)) {
					peerIdsByMidRef.current.set(mid, String(peer.peer_id));
					if (peer.user_id) userIdsByMidRef.current.set(mid, peer.user_id);
					if (peer.role) rolesByMidRef.current.set(mid, peer.role);
				}
			}
			setRemoteMedia((current) => {
				const next = new Map(current);
				for (const peer of updatedPeers) {
					const peerId = String(peer.peer_id);
					const mids = [peer.mid_audio, peer.mid_video, peer.mid_screen]
						.filter((mid) => mid != null && Number(mid) >= 3)
						.map(String)
						.filter((mid) => peerIdsByMidRef.current.get(mid) === peerId);

					const existingEntry = Array.from(next.entries()).find(([, participant]) => participant.peerId === peerId);
					const participantId = existingEntry?.[0] || (mids[0] ? getRemoteParticipantId(mids[0]) : undefined);
					if (!participantId) continue;
					const participant = next.get(participantId) || { id: participantId };
					next.set(participantId, mergeRemotePeerState(participant, peer));
				}
				return next;
			});
			if (pcRef.current) {
				syncRemoteMedia(pcRef.current);
			}
		},
		[syncRemoteMedia]
	);

	const claimRemoteMid = useCallback(
		(mid: string, peerId: string) => {
			peerIdsByMidRef.current.set(mid, peerId);
			const peer = peerStateByIdRef.current.get(peerId);
			const mediaKind = getRemoteMediaKind(mid);
			if (!peer || !mediaKind) return;
			const midPatch: Pick<SfuPeer, 'mid_audio' | 'mid_video' | 'mid_screen'> =
				mediaKind === 'audio' ? { mid_audio: mid } : mediaKind === 'camera' ? { mid_video: mid } : { mid_screen: mid };
			applySfuPeers([{ peer_id: peer.peer_id, ...midPatch }]);
		},
		[applySfuPeers]
	);

	const acquireMicrophoneTrack = useCallback(async () => {
		if (!localMediaPreparedRef.current) return undefined;
		try {
			const usingMezonNsCapture = noiseSuppressionEnabledRef.current && !mezonNsUnavailableRef.current;
			const stream = await openPreferredMicrophone(getMicrophoneCaptureOptions(), false);
			if (!localMediaPreparedRef.current) {
				stream.getTracks().forEach((track) => track.stop());
				return undefined;
			}
			const audioTrack = stream.getAudioTracks()[0];
			if (!audioTrack) return undefined;
			microphoneCaptureModeRef.current.set(audioTrack, usingMezonNsCapture ? 'mezon-ns' : 'native');
			audioTrack.enabled = desiredMediaRef.current.microphoneEnabled;
			const localStream = localStreamRef.current || new MediaStream();
			localStream.getAudioTracks().forEach((track) => {
				localStream.removeTrack(track);
				track.stop();
			});
			localStream.addTrack(audioTrack);
			localStreamRef.current = localStream;
			setLocalAudioTrack(audioTrack);
			syncSelectedMicrophone(audioTrack);
			setLocalPreview(new MediaStream(localStream.getTracks()));
			return audioTrack;
		} catch (cause) {
			if (reportMediaAccessError('microphone', cause)) {
				dispatch(voiceActions.setShowMicrophone(false));
			} else {
				setError(cause instanceof Error ? cause.message : 'Unable to access microphone');
			}
			return undefined;
		}
	}, [dispatch, getMicrophoneCaptureOptions, openPreferredMicrophone, syncSelectedMicrophone]);

	const previousMicrophonePermissionRef = useRef(microphonePermissionState);
	useEffect(() => {
		const previous = previousMicrophonePermissionRef.current;
		previousMicrophonePermissionRef.current = microphonePermissionState;
		if (
			!localMediaPreparedRef.current ||
			previous === null ||
			previous === 'granted' ||
			microphonePermissionState !== 'granted' ||
			!noiseSuppressionEnabled
		)
			return;
		if (localStreamRef.current?.getAudioTracks()[0]?.readyState === 'live') return;
		void acquireMicrophoneTrack();
	}, [acquireMicrophoneTrack, microphonePermissionState, noiseSuppressionEnabled]);

	const handleRequestMicrophonePermission = useCallback(async () => {
		if (joinRole !== 'speaker') {
			await ensureMediaPermission('microphone');
			return;
		}
		const enableMicrophone = () => dispatch(voiceActions.setShowMicrophone(true));
		if (await ensureMediaPermission('microphone', enableMicrophone)) enableMicrophone();
	}, [dispatch, joinRole]);

	useEffect(() => {
		desiredMediaRef.current = { microphoneEnabled, cameraEnabled };
		muteSyncRef.current.cancelInference();
		if (!localMediaPreparedRef.current) return;
		let cancelled = false;
		const pc = pcRef.current;
		const ws = wsRef.current;
		const isCurrent = () => !cancelled && pcRef.current === pc && wsRef.current === ws;
		void (async () => {
			let audioTrack = localStreamRef.current?.getAudioTracks()[0];
			if (microphoneEnabled && audioTrack?.readyState !== 'live') audioTrack = await acquireMicrophoneTrack();
			if (!isCurrent()) return;
			if (audioTrack) {
				setAudioTrackEnabled(audioTrack, desiredMediaRef.current.microphoneEnabled);
				const audioSender = pc?.getTransceivers().find((item) => item.mid === '0')?.sender;
				if (audioSender) await audioSender.replaceTrack(desiredMediaRef.current.microphoneEnabled ? getOutgoingAudioTrack(audioTrack) : null);
			}
			if (isCurrent()) sendMute(!desiredMediaRef.current.microphoneEnabled);
		})().catch(() => {
			if (isCurrent()) restartSessionRef.current();
		});
		return () => {
			cancelled = true;
		};
	}, [
		acquireMicrophoneTrack,
		cameraEnabled,
		microphoneEnabled,
		hasMicrophoneAccess,
		getOutgoingAudioTrack,
		localMediaPrepared,
		setAudioTrackEnabled,
		sendMute
	]);

	useEffect(() => {
		if (!localMediaPreparedRef.current) return;
		let cancelled = false;
		const ws = wsRef.current;
		const pc = pcRef.current;

		void (async () => {
			try {
				let cameraTrack = cameraTrackRef.current;
				if (cameraEnabled && cameraTrack?.readyState !== 'live') {
					const video = getCameraConstraints(cameraQualityTierRef.current);
					const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video }).catch((cause) => {
						if (reportMediaAccessError('camera', cause)) dispatch(voiceActions.setShowCamera(false));
						throw cause;
					});
					if (cancelled) {
						stream.getTracks().forEach((track) => track.stop());
						return;
					}
					cameraTrack = stream.getVideoTracks()[0];
					if (cancelled || pcRef.current !== pc || wsRef.current !== ws) return;
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

				if (cancelled || pcRef.current !== pc || wsRef.current !== ws) return;
				if (cameraTrack) {
					cameraTrack.enabled = cameraEnabled;
					if ('contentHint' in cameraTrack && cameraTrack.contentHint !== 'detail') {
						try {
							cameraTrack.contentHint = 'motion';
						} catch {} // eslint-disable-line no-empty
					}
					const videoSender = findUplinkVideoSender();
					if (videoSender) {
						await videoSender.replaceTrack(cameraEnabled ? cameraTrack : null);
						if (cancelled || pcRef.current !== pc || wsRef.current !== ws) return;
						const videoTransceiver = pc?.getTransceivers().find((item) => item.mid === '1');
						if (videoTransceiver && cameraEnabled && videoTransceiver.direction !== 'sendonly') {
							videoTransceiver.direction = 'sendonly';
						}
						if (cameraEnabled && pcRef.current && videoTransceiver) {
							forceVideoCodec(videoTransceiver, CAMERA_CODEC);
							await applyVideoEncodingParams(pcRef.current, cameraQualityTierRef.current);
						}
					}
				}
			} catch {} // eslint-disable-line no-empty

			const signal = { type: 'camera', active: cameraEnabled } as const;
			if (!cancelled && wsRef.current === ws && joinRole === 'speaker' && joinedRef.current && ws?.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(signal));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [cameraEnabled, dispatch, findUplinkVideoSender, joinRole, hasCameraAccess, localMediaPrepared]);

	const handleMezonNsFailure = useCallback(
		(cause: unknown, pipeline?: MezonNsAudioPipeline) => {
			if (pipeline && mezonNsPipelineRef.current !== pipeline) return;
			console.warn('[MezonSFU][Mezon-NS] unavailable; restoring native microphone processing', cause);
			if (noiseSuppressionEnabledRef.current) {
				dispatch(
					toastActions.addToast({
						message: 'Noise suppression could not start. Standard noise suppression is used instead.',
						type: 'warning',
						autoClose: 5000
					})
				);
			}
			const activePipeline = mezonNsPipelineRef.current;
			activePipeline?.setOutputEnabled(false);
			mezonNsPipelineRef.current = null;
			setMezonNsUnavailable(true);
			dispatch(voiceActions.setNoiseSuppressionReady(false));
			dispatch(voiceActions.setNoiseSuppressionEnabled(false));
			activePipeline?.dispose();
		},
		[dispatch]
	);

	useLayoutEffect(() => {
		const generation = ++mezonNsGenerationRef.current;
		const inputTrack = localStreamRef.current?.getAudioTracks()[0] || localAudioTrack;
		const enabled = noiseSuppressionEnabled;
		let cancelled = false;
		let candidate: MezonNsAudioPipeline | null = null;
		let pendingInput: MediaStreamTrack | null = null;
		const isCurrent = () => !cancelled && mezonNsGenerationRef.current === generation;
		const currentPipeline = mezonNsPipelineRef.current;
		if (enabled && mezonNsUnavailable) {
			setMezonNsUnavailable(false);
			return;
		}
		if (enabled && currentPipeline?.inputTrack === inputTrack && currentPipeline?.isDenoisingReady) return;
		if (!enabled && !currentPipeline && inputTrack?.readyState === 'live' && microphoneCaptureModeRef.current.get(inputTrack) === 'native') {
			dispatch(voiceActions.setNoiseSuppressionReady(false));
			const sender = pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
			const outgoing = inputTrack.enabled ? inputTrack : null;
			if (sender && sender.track !== outgoing) {
				void sender.replaceTrack(outgoing).catch((cause) => console.warn('[MezonSFU][Mezon-NS] cannot restore native audio', cause));
			}
			return;
		}
		dispatch(voiceActions.setNoiseSuppressionReady(false));
		currentPipeline?.setOutputEnabled(false);

		const sender = () => pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
		const openMicrophone = async (audio: MediaTrackConstraints) => {
			const liveDeviceId = inputTrack?.readyState === 'live' ? inputTrack.getSettings().deviceId : undefined;
			const open = () =>
				liveDeviceId
					? navigator.mediaDevices.getUserMedia({ audio: { ...audio, deviceId: { exact: liveDeviceId } }, video: false })
					: openPreferredMicrophone(audio, false);
			try {
				return await open();
			} catch (cause) {
				if (!(cause instanceof DOMException) || cause.name !== 'OverconstrainedError' || inputTrack?.readyState !== 'live' || !isCurrent())
					throw cause;
				inputTrack.stop();
				return open();
			}
		};
		void (async () => {
			try {
				const activeSender = sender();
				if (activeSender && !enabled) await activeSender.replaceTrack(null);
				if (!isCurrent()) return;
				currentPipeline?.dispose();
				if (mezonNsPipelineRef.current === currentPipeline) mezonNsPipelineRef.current = null;
				if (!inputTrack) return;
				let nextTrack = inputTrack;
				const capture = inputTrack.getSettings() as MediaTrackSettings & { voiceIsolation?: boolean };
				const device = microphoneDeviceConstraint(preferredMicrophoneIdRef.current);
				if (!enabled) {
					if (
						inputTrack.readyState !== 'live' ||
						microphoneCaptureModeRef.current.get(inputTrack) !== 'native' ||
						capture.noiseSuppression === false
					) {
						const stream = await openMicrophone({ ...getNativeMicrophoneCaptureOptions(), ...device });
						nextTrack = stream.getAudioTracks()[0];
						if (!nextTrack) throw new Error('Microphone capture returned no audio track');
						pendingInput = nextTrack;
						microphoneCaptureModeRef.current.set(nextTrack, 'native');
					}
				} else {
					candidate = await MezonNsAudioPipeline.create(
						async () => {
							if (!isCurrent()) throw new Error('Mezon-NS preparation was superseded');
							if (
								inputTrack.readyState !== 'live' ||
								microphoneCaptureModeRef.current.get(inputTrack) !== 'mezon-ns' ||
								capture.noiseSuppression === true ||
								capture.autoGainControl === false ||
								capture.voiceIsolation === true
							) {
								const stream = await openMicrophone({ ...getMezonNsAudioCaptureOptions(), ...device });
								nextTrack = stream.getAudioTracks()[0];
								if (!nextTrack) throw new Error('Microphone capture returned no audio track');
								pendingInput = nextTrack;
								microphoneCaptureModeRef.current.set(nextTrack, 'mezon-ns');
							}
							if (!isCurrent()) throw new Error('Mezon-NS preparation was superseded');
							if (nextTrack.getSettings().noiseSuppression === true) throw new Error('Native noise suppression could not be disabled');
							nextTrack.enabled = inputTrack.enabled;
							return nextTrack;
						},
						(cause) => {
							if (candidate && mezonNsPipelineRef.current === candidate) handleMezonNsFailure(cause, candidate);
						},
						true
					);
					candidate.setPreparationEnabled(true);
					if (!(await candidate.setDenoisingEnabled(true))) throw new Error('Mezon-NS mode could not become ready');
				}
				const localStream = localStreamRef.current;
				if (!isCurrent() || !localStream?.getAudioTracks().includes(inputTrack)) return;
				nextTrack.enabled = inputTrack.enabled;
				mezonNsPipelineRef.current = candidate;
				if (nextTrack !== inputTrack) {
					localStream.removeTrack(inputTrack);
					localStream.addTrack(nextTrack);
				}
				if (activeSender) await activeSender.replaceTrack(nextTrack.enabled ? getOutgoingAudioTrack(nextTrack) : null);
				if (!isCurrent()) return;
				if (nextTrack !== inputTrack) inputTrack.stop();
				candidate?.setPreparationEnabled(false);
				candidate?.setOutputEnabled(nextTrack.enabled);
				setLocalAudioTrack(nextTrack);
				syncSelectedMicrophone(nextTrack);
				setLocalPreview(new MediaStream(localStream.getTracks()));
				dispatch(voiceActions.setNoiseSuppressionReady(enabled && !!candidate?.isDenoisingReady));
			} catch (cause) {
				if (!isCurrent()) return;
				if (enabled) handleMezonNsFailure(cause);
				else console.warn('[MezonSFU][Mezon-NS] unable to restore native microphone', cause);
			} finally {
				if (candidate && mezonNsPipelineRef.current !== candidate) candidate.dispose();
				if (pendingInput && !localStreamRef.current?.getAudioTracks().includes(pendingInput)) pendingInput.stop();
			}
		})();
		return () => {
			cancelled = true;
			if (candidate && mezonNsPipelineRef.current !== candidate) candidate.dispose();
			if (pendingInput && !localStreamRef.current?.getAudioTracks().includes(pendingInput)) pendingInput.stop();
		};
	}, [
		dispatch,
		getOutgoingAudioTrack,
		handleMezonNsFailure,
		localAudioTrack,
		mezonNsUnavailable,
		noiseSuppressionEnabled,
		openPreferredMicrophone,
		syncSelectedMicrophone
	]);

	useEffect(() => {
		const refreshDevices = async () => {
			const enumerated = await navigator.mediaDevices.enumerateDevices();
			setDevices(enumerated);
			const currentOutputs = enumerated.filter((d) => d.kind === 'audiooutput');
			if (currentOutputs.length > 0) {
				setSelectedSpeaker((prev) => {
					if (!prev || prev === 'default') return prev;
					const exists = currentOutputs.some((d) => d.deviceId === prev);
					if (!exists) {
						localStorage.setItem(PREFERRED_SPEAKER_STORAGE_KEY, 'default');
						window.dispatchEvent(new CustomEvent('mezon:outputDeviceChange', { detail: 'default' }));
						return 'default';
					}
					return prev;
				});
			}
		};
		void refreshDevices();
		navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
		return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
	}, [localPreview]);

	const changeInputDevice = useCallback(
		async (kind: 'audioinput' | 'videoinput', deviceId: string) => {
			let stream: MediaStream | null = null;
			try {
				if (kind === 'audioinput') {
					if (microphonePermissionStateRef.current !== 'granted' && !(await ensureMediaPermission('microphone'))) {
						return;
					}
				} else if (kind === 'videoinput') {
					if (cameraPermissionStateRef.current !== 'granted' && !(await ensureMediaPermission('camera'))) {
						return;
					}
				}

				const usingMezonNsCapture = noiseSuppressionEnabledRef.current && !mezonNsUnavailableRef.current;
				stream = await navigator.mediaDevices.getUserMedia({
					audio:
						kind === 'audioinput'
							? {
									...getMicrophoneCaptureOptions(),
									...microphoneDeviceConstraint(deviceId)
								}
							: false,
					video: kind === 'videoinput' ? { ...getCameraConstraints(cameraQualityTierRef.current), deviceId: { exact: deviceId } } : false
				});
				const nextTrack = kind === 'audioinput' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
				if (!nextTrack) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}

				const localStream = localStreamRef.current || new MediaStream();
				localStreamRef.current = localStream;

				if (kind === 'audioinput') {
					const isAudioActive =
						joinRole === 'audience'
							? Boolean(pushToTalkActive || pushToTalkRequestedRef.current || holdToTalkRef.current)
							: microphoneEnabled;

					if (joinRole === 'audience' && !isAudioActive) {
						stream.getTracks().forEach((t) => t.stop());
						const previousTrack = localStream.getAudioTracks()[0];
						if (previousTrack) {
							localStream.removeTrack(previousTrack);
							previousTrack.stop();
						}
						preferredMicrophoneIdRef.current = deviceId;
						localStorage.setItem(PREFERRED_MICROPHONE_STORAGE_KEY, deviceId);
						setSelectedMicrophone(deviceId);
						return;
					}

					microphoneCaptureModeRef.current.set(nextTrack, usingMezonNsCapture ? 'mezon-ns' : 'native');
					const previousTrack = localStream.getAudioTracks()[0];
					setAudioTrackEnabled(nextTrack, isAudioActive);
					const audioTransceiver = pcRef.current
						?.getTransceivers()
						.find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
					if (audioTransceiver) {
						await audioTransceiver.sender.replaceTrack(isAudioActive ? getOutgoingAudioTrack(nextTrack) : null);
						if (isAudioActive && audioTransceiver.direction !== 'sendonly' && audioTransceiver.direction !== 'sendrecv') {
							audioTransceiver.direction = 'sendonly';
						}
					}
					if (previousTrack) {
						localStream.removeTrack(previousTrack);
						previousTrack.stop();
					}
					localStream.addTrack(nextTrack);
					setLocalAudioTrack(nextTrack);
					preferredMicrophoneIdRef.current = deviceId;
					localStorage.setItem(PREFERRED_MICROPHONE_STORAGE_KEY, deviceId);
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
				if (stream) {
					stream.getTracks().forEach((t) => t.stop());
				}
				setError(cause instanceof Error ? cause.message : 'Unable to switch device');
			}
		},
		[
			cameraEnabled,
			findUplinkVideoSender,
			getMicrophoneCaptureOptions,
			getOutgoingAudioTrack,
			joinRole,
			microphoneEnabled,
			pushToTalkActive,
			setAudioTrackEnabled
		]
	);
	const changeOutputDevice = useCallback((deviceId: string) => {
		setSelectedSpeaker(deviceId);
		localStorage.setItem(PREFERRED_SPEAKER_STORAGE_KEY, deviceId);
		window.dispatchEvent(new CustomEvent('mezon:outputDeviceChange', { detail: deviceId }));
	}, []);
	const handleSinkIdFailure = useCallback((failedSinkId?: string) => {
		setSelectedSpeaker((prev) => {
			if (prev && prev !== 'default' && (failedSinkId === undefined || prev === failedSinkId)) {
				localStorage.setItem(PREFERRED_SPEAKER_STORAGE_KEY, 'default');
				window.dispatchEvent(new CustomEvent('mezon:outputDeviceChange', { detail: 'default' }));
				return 'default';
			}
			return prev;
		});
	}, []);
	const chatRef = useRef<ExternalChatRef>(null);
	const handleAddMessage = useCallback((message: string) => {
		chatRef.current?.setMessages((prev) => [...prev, message]);
	}, []);
	const [roomPeerId, setRoomPeerId] = useState('');
	const signalingTokenRef = useRef(token);
	useEffect(() => {
		signalingTokenRef.current = token;
	}, [token]);
	useEffect(() => {
		let disposed = false;
		localMediaPreparedRef.current = false;
		setLocalMediaPrepared(false);
		let reconnectAllowed = true;
		let sessionToken = signalingTokenRef.current;
		let tokenRejected = false;
		let everJoined = false;
		let serverRestarting = false;
		let removeVisibilityListener: () => void = () => undefined;
		let removeNetworkListeners: () => void = () => undefined;
		const mediaSyncInterval = setInterval(() => {
			if (!disposed && reconnectAllowed && pcRef.current) {
				syncRemoteMedia(pcRef.current);
				void checkMediaRecovery(pcRef.current);
			}
		}, 5000);
		let heartbeatInterval: ReturnType<typeof setInterval> | undefined;
		let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
		let iceRecoveryTimer: ReturnType<typeof setTimeout> | undefined;
		let transportDeadlineTimer: ReturnType<typeof setTimeout> | undefined;
		let mediaHealth = new SfuMediaHealth();
		let monitorMediaRecovery = false;
		let recoveryDeadlineTimer: ReturnType<typeof setTimeout> | undefined;
		let recoveryStartedAt: number | undefined;
		let checkingMediaHealth = false;
		const checkMediaRecovery = async (pc: RTCPeerConnection) => {
			if (checkingMediaHealth || !monitorMediaRecovery || !joinedRef.current || pc.connectionState !== 'connected') return;
			checkingMediaHealth = true;
			try {
				const report = await withSfuTimeout(pc.getStats(), 2000);
				if (disposed || !reconnectAllowed || pcRef.current !== pc) return;
				const microphone = localStreamRef.current?.getAudioTracks()[0];

				if (monitorMediaRecovery && joinedRef.current && pc.connectionState === 'connected') {
					const sender = pc.getSenders().find((item) => item.track?.kind === 'audio')?.track;
					const micExpected =
						currentSfuRoleRef.current === 'speaker' ? desiredMediaRef.current.microphoneEnabled : pushToTalkRequestedRef.current;
					const reason = mediaHealth.check(
						report,
						{
							micExpected: !!micExpected,
							captureHealthy: !!microphone && microphone.readyState === 'live' && microphone.enabled && !microphone.muted,
							senderHealthy: !!sender && sender.readyState === 'live' && sender.enabled
						},
						Date.now()
					);
					if (reason) endCallAfterReconnectFailure();
				}
			} catch {
				// A closing transport can reject getStats; retry on the next health check.
			} finally {
				checkingMediaHealth = false;
			}
		};
		let signalingOpenedAt = 0;
		let lastSignalingAt = 0;
		let lastPingAt = 0;
		const negotiationTimers = new Set<ReturnType<typeof setTimeout>>();
		let reconnectAttempts = 0;
		let tokenRefreshAttempts = 0;
		let requestReconnect: () => void = () => undefined;
		const endCallAfterReconnectFailure = (networkLost = false) => {
			if (!reconnectAllowed || disposed) return;
			reconnectAllowed = false;

			if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
			reconnectTimer = undefined;
			clearRecoveryDeadline();
			if (heartbeatInterval !== undefined) clearInterval(heartbeatInterval);
			const ws = wsRef.current;
			wsRef.current = null;
			ws?.close();
			discardPeerConnection();
			setConnectionState('failed');
			localMediaPreparedRef.current = false;
			setLocalMediaPrepared(false);
			if (onReconnectRequiredRef.current) {
				onReconnectRequiredRef.current(networkLost);
				return;
			}
			dispatch(
				toastActions.addToast({
					message: tRef.current(networkLost ? 'toast.weakNetworkDisconnected' : 'toast.disconnectedRejoin'),
					type: 'warning',
					autoClose: 5000
				})
			);
			onLeaveRoomRef.current();
		};

		const clearRecoveryDeadline = () => {
			if (recoveryDeadlineTimer !== undefined) clearTimeout(recoveryDeadlineTimer);
			recoveryDeadlineTimer = undefined;
			recoveryStartedAt = undefined;
		};
		const recoveryExpired = () => {
			if (recoveryStartedAt === undefined || Date.now() - recoveryStartedAt < MAX_RECOVERY_MS) return false;
			endCallAfterReconnectFailure();
			return true;
		};
		const beginRecovery = () => {
			if (disposed || !reconnectAllowed || recoveryDeadlineTimer !== undefined) return;
			recoveryStartedAt = Date.now();

			recoveryDeadlineTimer = setTimeout(() => endCallAfterReconnectFailure(), MAX_RECOVERY_MS);
		};

		const clearIceRecoveryTimer = () => {
			if (iceRecoveryTimer === undefined) return;
			clearTimeout(iceRecoveryTimer);
			iceRecoveryTimer = undefined;
		};

		const clearTransportDeadlineTimer = () => {
			if (transportDeadlineTimer === undefined) return;
			clearTimeout(transportDeadlineTimer);
			transportDeadlineTimer = undefined;
		};
		const markMediaConnected = (pc: RTCPeerConnection) => {
			if (disposed || !reconnectAllowed || recoveryExpired() || pcRef.current !== pc) return;
			setConnectionState('connected');
			screenKeyframeRecovery.wake();
			if (!joinedRef.current) return;

			clearRecoveryDeadline();
			serverRestarting = false;

			reconnectAttempts = 0;
		};
		requestManualRejoinRef.current = () => {
			if (monitorMediaRecovery && joinedRef.current && pcRef.current?.connectionState === 'connected') endCallAfterReconnectFailure();
		};

		const restartSession = () => {
			if (disposed || !reconnectAllowed || reconnectTimer !== undefined || refreshingTokenRef.current) return;

			const ws = wsRef.current;
			wsRef.current = null;
			ws?.close();
			discardPeerConnection();
			requestReconnect();
		};

		restartSessionRef.current = restartSession;

		const handleNetworkLoss = () => endCallAfterReconnectFailure(true);

		const armTransportDeadline = (pc: RTCPeerConnection) => {
			if (transportDeadlineTimer !== undefined) return;
			transportDeadlineTimer = setTimeout(() => {
				transportDeadlineTimer = undefined;
				if (disposed || pcRef.current !== pc || pc.connectionState === 'connected') return;
				handleNetworkLoss();
			}, TRANSPORT_CONNECT_DEADLINE_MS);
		};

		const peerIdsByMid = peerIdsByMidRef.current;
		const rolesByMid = rolesByMidRef.current;
		currentSfuRoleRef.current = joinRole;

		const prepareLocalMedia = async () => {
			let stream: MediaStream;
			let usingMezonNsCapture = noiseSuppressionEnabledRef.current && !mezonNsUnavailableRef.current;
			try {
				stream = await openPreferredMicrophone(getMicrophoneCaptureOptions(), getCameraConstraints(cameraQualityTierRef.current));
			} catch {
				usingMezonNsCapture = false;
				try {
					stream = await openPreferredMicrophone(
						{ ...getNativeMicrophoneCaptureOptions(), ...microphoneDeviceConstraint(preferredMicrophoneIdRef.current) },
						false
					);
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
				microphoneCaptureModeRef.current.set(audioTrack, usingMezonNsCapture ? 'mezon-ns' : 'native');
				setAudioTrackEnabled(audioTrack, desiredMediaRef.current.microphoneEnabled);
				syncSelectedMicrophone(audioTrack);
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

		const discardPeerConnection = () => {
			negotiationTimers.forEach(clearTimeout);
			negotiationTimers.clear();
			clearIceRecoveryTimer();
			removeVisibilityListener();
			if (pendingForcedMuteRef.current !== undefined) window.clearTimeout(pendingForcedMuteRef.current);
			pendingForcedMuteRef.current = undefined;
			muteSyncRef.current = new SfuMuteSync();
			currentSfuRoleRef.current = joinRole;
			joinedRef.current = false;
			const audio = localStreamRef.current?.getAudioTracks()[0];
			if (audio) setAudioTrackEnabled(audio, false);
			setPushToTalkActive(false);
			screenKeyframeRecovery.reset();
			clearTransportDeadlineTimer();
			const oldPc = pcRef.current;
			pcRef.current = null;
			oldPc?.close();
			localTracksAddedRef.current = false;
			negotiatingRef.current = false;
			pendingOfferRef.current = null;
			lastOfferGenerationRef.current = -1;
			selfPeerIdRef.current = undefined;
			setSelfPeerId(undefined);
			retiredMidsRef.current.clear();
			userIdsByMidRef.current.clear();
			peerIdsByMid.clear();
			rolesByMid.clear();
			peerStateByIdRef.current.clear();
			setRemoteMedia(new Map());
		};

		const resetAndCreatePeerConnection = () => {
			discardPeerConnection();
			mediaHealth = new SfuMediaHealth();
			monitorMediaRecovery = everJoined;
			const pc = new RTCPeerConnection({ iceServers: [] });
			pcRef.current = pc;
			armTransportDeadline(pc);
			pc.oniceconnectionstatechange = () => {
				if (pcRef.current !== pc) return;
				const iceState = pc.iceConnectionState;

				if (iceState === 'connected' || iceState === 'completed') {
					clearIceRecoveryTimer();
					if (pc.connectionState === 'connected') {
						clearTransportDeadlineTimer();
						markMediaConnected(pc);
					} else {
						armTransportDeadline(pc);
					}
					return;
				}
				if (iceState === 'failed') {
					handleNetworkLoss();
					return;
				}
				if (iceState === 'disconnected') {
					setConnectionState('disconnected');
					if (iceRecoveryTimer !== undefined) return;
					iceRecoveryTimer = setTimeout(() => {
						iceRecoveryTimer = undefined;
						handleNetworkLoss();
					}, ICE_RECOVERY_GRACE_MS);
				}
			};
			pc.onconnectionstatechange = () => {
				if (pcRef.current !== pc) return;

				if (pc.connectionState === 'connected') {
					clearTransportDeadlineTimer();
					markMediaConnected(pc);
					return;
				}
				if (pc.connectionState === 'failed') {
					handleNetworkLoss();
				}
			};
			pc.ontrack = ({ track, transceiver }) => {
				const refresh = () => {
					if (disposed || pcRef.current !== pc || transceiver.receiver.track !== track) return;

					syncRemoteMedia(pc);
				};
				refresh();
				track.addEventListener('mute', refresh);
				track.addEventListener('unmute', refresh);
				track.addEventListener('ended', refresh);
			};
			return pc;
		};

		const handleOffer = async (offer: SfuOffer): Promise<void> => {
			const pc = pcRef.current;
			const ws = wsRef.current;
			if (!pc || !ws || disposed || offer.offer_generation <= lastOfferGenerationRef.current) return;
			if (negotiatingRef.current) {
				if (!pendingOfferRef.current || offer.offer_generation > pendingOfferRef.current.offer_generation) pendingOfferRef.current = offer;
				return;
			}

			negotiatingRef.current = true;
			const negotiationTimer = setTimeout(() => {
				if (!disposed && pcRef.current === pc && wsRef.current === ws) restartSession();
			}, 15_000);
			negotiationTimers.add(negotiationTimer);
			screenKeyframeRecovery.wake();
			try {
				const localStream = localStreamRef.current || (await prepareLocalMedia());
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				const stabilizedSdp = stabilizeInactiveVideoSections(offer.sdp, pc.currentRemoteDescription?.sdp);
				await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: stabilizedSdp }));
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
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
						} catch {} // eslint-disable-line no-empty
					}
					const audioTransceiver = pc.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
					const videoTransceiver = uplinkVideoTransceiver;
					if (audioTransceiver) {
						const audioEnabled =
							joinRole === 'audience'
								? currentSfuRoleRef.current === 'speaker' && pushToTalkRequestedRef.current
								: desiredMediaRef.current.microphoneEnabled;
						if (audioTrack) setAudioTrackEnabled(audioTrack, audioEnabled);
						await audioTransceiver.sender.replaceTrack(
							joinRole === 'audience' ? getOutgoingAudioTrack(audioTrack) : audioEnabled ? getOutgoingAudioTrack(audioTrack) : null
						);
						if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
						audioTransceiver.direction = 'sendonly';
					}
					if (joinRole === 'speaker' && videoTransceiver) {
						await videoTransceiver.sender.replaceTrack(videoTrack);
						videoTransceiver.direction = 'sendonly';
						await applyVideoEncodingParams(pc, cameraQualityTierRef.current);
						if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
					}
					const screenTrack = screenStreamRef.current?.getVideoTracks()[0] || null;
					if (screenTransceiver && screenTrack) {
						await screenTransceiver.sender.replaceTrack(screenTrack);
						screenTransceiver.direction = 'sendonly';
						await applyScreenEncodingParams(screenTransceiver.sender);
					}
					if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
					localTracksAddedRef.current = true;
				} else if (screenStreamRef.current) {
					const screenTrack = screenStreamRef.current.getVideoTracks()[0];
					const sender = screenTransceiver?.sender;
					if (screenTrack && sender && sender.track !== screenTrack) {
						await sender.replaceTrack(screenTrack);
						await applyScreenEncodingParams(sender);
					}
				}
				const answer = await pc.createAnswer();
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				const mungedSdp = mungeVideoBitrates(answer.sdp, cameraQualityTierRef.current);
				await pc.setLocalDescription(new RTCSessionDescription({ type: 'answer', sdp: mungedSdp }));
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				for (const [mid, occupant] of getMsidOccupantsByMidFromSdp(offer.sdp)) {
					if (!getRemoteMediaKind(mid) || !canReactivateMid(retiredMidsRef.current.get(mid), occupant, peerIdsByMidRef.current.get(mid)))
						continue;
					retiredMidsRef.current.delete(mid);
					userIdsByMidRef.current.set(mid, occupant.userId);
					if (occupant.peerId) claimRemoteMid(mid, occupant.peerId);
				}

				lastOfferGenerationRef.current = offer.offer_generation;
				if (wsRef.current?.readyState === WebSocket.OPEN && pc.localDescription?.sdp) {
					wsRef.current.send(
						JSON.stringify({
							type: 'answer',
							sdp: pc.localDescription.sdp,
							offer_generation: offer.offer_generation
						})
					);
				}
				if (!desiredMediaRef.current.cameraEnabled) {
					await pc
						.getTransceivers()
						.find((item) => item.mid === '1')
						?.sender.replaceTrack(null);
				}
			} catch (cause) {
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				setError(cause instanceof Error ? cause.message : 'WebRTC negotiation failed');
				restartSession();
			} finally {
				clearTimeout(negotiationTimer);
				negotiationTimers.delete(negotiationTimer);
				if (!disposed && pcRef.current === pc && wsRef.current === ws) {
					negotiatingRef.current = false;
					syncRemoteMedia(pc);
					const pending = pendingOfferRef.current;
					pendingOfferRef.current = null;
					if (pending) await handleOffer(pending);
					else screenKeyframeRecovery.wake();
				}
			}
		};

		const handleRoleChanged = async (role: 'speaker' | 'audience') => {
			currentSfuRoleRef.current = role;
			const audioTrack = localStreamRef.current?.getAudioTracks()[0];
			const audioTransceiver = pcRef.current?.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
			if (role === 'speaker' && (joinRole !== 'audience' || pushToTalkRequestedRef.current)) {
				if (audioTrack) setAudioTrackEnabled(audioTrack, true);
				if (audioTransceiver && audioTrack) {
					await audioTransceiver.sender.replaceTrack(getOutgoingAudioTrack(audioTrack));
					audioTransceiver.direction = 'sendonly';
				}
				setPushToTalkActive(true);
				return;
			}

			if (audioTrack) setAudioTrackEnabled(audioTrack, false);
			if (audioTransceiver) {
				await audioTransceiver.sender.replaceTrack(null);
				audioTransceiver.direction = 'inactive';
			}
			setPushToTalkActive(false);
		};

		const refreshToken = (onReady: () => void) => {
			if (refreshingTokenRef.current || disposed || !reconnectAllowed) return;
			if (tokenRefreshAttempts >= MAX_TOKEN_REFRESH_ATTEMPTS) {
				endCallAfterReconnectFailure();
				return;
			}
			tokenRefreshAttempts += 1;

			refreshingTokenRef.current = true;
			void withSfuTimeout(
				Promise.resolve().then(() =>
					onRefreshTokenRef.current
						? onRefreshTokenRef.current()
						: dispatch(generateMeetToken({ channelId: roomId, roomName: '' })).unwrap()
				),
				10_000
			)
				.then((newToken) => {
					if (disposed || !reconnectAllowed) return;
					refreshingTokenRef.current = false;
					if (!newToken) throw new Error('SFU token unavailable');
					if (tokenRejected && newToken === sessionToken) {
						endCallAfterReconnectFailure();
						return;
					}

					sessionToken = newToken;
					signalingTokenRef.current = newToken;
					tokenRejected = false;
					dispatch(voiceActions.setToken(newToken));
					onReady();
				})
				.catch(() => {
					if (disposed || !reconnectAllowed) return;
					refreshingTokenRef.current = false;

					if (everJoined) {
						tokenRefreshAttempts = Math.max(0, tokenRefreshAttempts - 1);
						requestReconnect();
					} else endCallAfterReconnectFailure();
				});
		};

		const canOpenSignaling = () =>
			reconnectAllowed &&
			!disposed &&
			!recoveryExpired() &&
			navigator.onLine !== false &&
			!(wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED);

		const openSignaling = () => {
			if (!canOpenSignaling()) return;
			resetAndCreatePeerConnection();
			const secureServerUrl =
				window.location.protocol === 'https:' && serverUrl.startsWith('ws://') ? `wss://${serverUrl.slice(5)}` : serverUrl;
			const wsUrl = new URL(secureServerUrl);
			wsUrl.searchParams.set('access_token', sessionToken);
			const ws = new WebSocket(wsUrl.toString());
			wsRef.current = ws;
			++connectionEpochRef.current;
			signalingOpenedAt = lastSignalingAt = Date.now();
			setConnectionState('connecting');

			ws.onopen = () => {
				if (disposed || wsRef.current !== ws || recoveryExpired()) return;
				setError(undefined);
				setConnectionState('joining');

				const joinMessage = { type: 'join', room: roomId, token: sessionToken, role: joinRole, screen_codec: SCREEN_CODEC.toLowerCase() };
				ws.send(JSON.stringify(joinMessage));
				const sendVisibility = () => {
					screenKeyframeRecovery.setDocumentVisible(document.visibilityState === 'visible');
					if (joinedRef.current && ws.readyState === WebSocket.OPEN) {
						// Keep receiving the selected share while its video is in PiP, even on a hidden tab.
						ws.send(
							JSON.stringify({
								type: 'visibility',
								visible: document.visibilityState === 'visible' || document.pictureInPictureElement != null
							})
						);
					}
				};
				removeVisibilityListener();
				document.addEventListener('visibilitychange', sendVisibility);
				document.addEventListener('enterpictureinpicture', sendVisibility, true);
				document.addEventListener('leavepictureinpicture', sendVisibility, true);
				removeVisibilityListener = () => {
					document.removeEventListener('visibilitychange', sendVisibility);
					document.removeEventListener('enterpictureinpicture', sendVisibility, true);
					document.removeEventListener('leavepictureinpicture', sendVisibility, true);
				};
				sendVisibility();
			};
			ws.onmessage = ({ data }) => {
				if (disposed || wsRef.current !== ws || recoveryExpired()) return;
				lastSignalingAt = Date.now();
				let message: SignalMessage;
				try {
					message = JSON.parse(data) as SignalMessage;
				} catch {
					return;
				}
				if (typeof message.participant_count === 'number') {
					setRoomParticipantCount(message.participant_count);
				}
				const ownPeerId = message.type === 'joined' ? message.peer_id : message.type === 'room_snapshot' ? message.self_peer_id : undefined;
				if (ownPeerId != null) {
					selfPeerIdRef.current = String(ownPeerId);
					setSelfPeerId(String(ownPeerId));
				}
				if (message.type === 'room_snapshot' && message.members) applySfuPeers(message.members);
				if (message.type === 'mute_changed' && typeof message.is_mute === 'boolean') {
					muteSyncRef.current.acknowledge(message.is_mute);
				}
				if ((message.type === 'peer_joined' || message.type === 'peer_updated') && message.peer) {
					applySfuPeers([message.peer]);
					const isCurrentPeer = isCurrentSfuPeer(message.peer.peer_id, selfPeerIdRef.current);
					if (message.type === 'peer_joined' && !isCurrentPeer) scheduleScreenKeyFrameRefresh();
					if (message.type === 'peer_updated' && isCurrentPeer && typeof message.peer.is_mute === 'boolean') {
						const sync = muteSyncRef.current;

						sync.observeSelf(message.peer.is_mute, !desiredMediaRef.current.microphoneEnabled, Date.now());
						if (pendingForcedMuteRef.current !== undefined) window.clearTimeout(pendingForcedMuteRef.current);
						pendingForcedMuteRef.current = undefined;
						if (sync.deadline !== undefined) {
							pendingForcedMuteRef.current = window.setTimeout(
								() => {
									pendingForcedMuteRef.current = undefined;
									if (disposed || wsRef.current !== ws || muteSyncRef.current !== sync || !sync.takeForcedMute(Date.now())) return;
									desiredMediaRef.current.microphoneEnabled = false;
									const audioTrack = localStreamRef.current?.getAudioTracks()[0];
									if (audioTrack) setAudioTrackEnabled(audioTrack, false);
									const sender = pcRef.current?.getTransceivers().find((item) => item.mid === '0')?.sender;
									void sender?.replaceTrack(null).catch(() => undefined);
									dispatch(voiceActions.setShowMicrophone(false));
								},
								Math.max(0, sync.deadline - Date.now())
							);
						}
					}
				}
				if (message.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: message.timestamp }));
				if (message.type === 'joined') {
					setError(undefined);
					setConnectionState('awaiting offer');
					if ((message as unknown as { room: string })?.room) {
						setRoomPeerId((message as unknown as { room: string }).room);
					}
				}
				if (message.type === 'room_snapshot' && !joinedRef.current) {
					joinedRef.current = true;

					if (pcRef.current?.connectionState === 'connected') markMediaConnected(pcRef.current);
					everJoined = true;
					tokenRefreshAttempts = 0;
					const resumePushToTalk = joinRole === 'audience' && pushToTalkRequestedRef.current;
					if (desiredMediaRef.current.microphoneEnabled || resumePushToTalk) sendMute(false);
					if (resumePushToTalk) {
						ws.send(JSON.stringify({ type: 'push_to_talk', active: true }));
					}
					if (joinRole === 'speaker') {
						ws.send(JSON.stringify({ type: 'camera', active: desiredMediaRef.current.cameraEnabled }));
					}
					const activeScreenTrack = screenStreamRef.current?.getVideoTracks()[0];
					if (activeScreenTrack && activeScreenTrack.readyState === 'live') {
						ws.send(JSON.stringify({ type: 'share_screen', active: true }));
					}
					screenKeyframeRecovery.setDocumentVisible(document.visibilityState === 'visible');
					ws.send(
						JSON.stringify({
							type: 'visibility',
							visible: document.visibilityState === 'visible' || document.pictureInPictureElement != null
						})
					);
					screenKeyframeRecovery.wake();
				}
				if (message.type === 'push_to_talk_changed' && typeof message.active === 'boolean') {
					const audioTrack = localStreamRef.current?.getAudioTracks()[0];
					if (audioTrack) setAudioTrackEnabled(audioTrack, message.active && pushToTalkRequestedRef.current);
					setPushToTalkActive(message.active && pushToTalkRequestedRef.current);
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
					const leavingPeerId = message.peer_id != null ? String(message.peer_id) : undefined;
					if (leavingPeerId) peerStateByIdRef.current.delete(leavingPeerId);
					const mids = getDepartedMids(
						leavingPeerId,
						message.user_id,
						[message.mid_audio, message.mid_video, message.mid_screen],
						peerIdsByMidRef.current,
						userIdsByMidRef.current
					);
					for (const mid of mids) {
						retiredMidsRef.current.set(mid, { peerId: leavingPeerId, userId: userIdsByMidRef.current.get(mid) || message.user_id });
						peerIdsByMidRef.current.delete(mid);
						userIdsByMidRef.current.delete(mid);
						rolesByMidRef.current.delete(mid);
					}
					setRemoteMedia((current) => {
						const next = new Map(current);
						for (const [id, participant] of next) {
							if (
								leavingPeerId &&
								participant.peerId === leavingPeerId &&
								![...peerIdsByMidRef.current].some(([mid, owner]) => getRemoteParticipantId(mid) === id && owner !== leavingPeerId)
							) {
								next.delete(id);
								continue;
							}
							const participantMids = mids.filter(
								(mid) =>
									getRemoteParticipantId(mid) === id &&
									retiredMidsRef.current.get(mid)?.peerId === leavingPeerId &&
									retiredMidsRef.current.has(mid)
							);
							if (!participantMids.length) continue;
							const updated = { ...participant };
							for (const mid of participantMids) {
								const kind = getRemoteMediaKind(mid);
								if (kind === 'audio') updated.audio = undefined;
								if (kind === 'camera') updated.video = undefined;
								if (kind === 'screen') updated.screen = undefined;
							}
							if (!updated.audio && !updated.video && !updated.screen) next.delete(id);
							else next.set(id, updated);
						}
						return next;
					});
				}
				if (message.type === 'room_message' && message.message) {
					handleAddMessage(message.message);
				}
				if (message.type === 'error') {
					const errorMsg = message.message || 'SFU signaling error';
					if (screenKeyframeRecovery.isRecentRequestError(errorMsg)) return;
					if (errorMsg === 'invalid_push_to_talk' || errorMsg === 'push_to_talk_rejected') {
						setPushToTalkActive(false);
						return;
					}
					if (errorMsg === 'stale_offer_generation' || errorMsg === 'future_offer_generation') {
						return;
					}
					if (joinedRef.current && SFU_PARTICIPANT_ACTION_ERRORS.has(errorMsg)) {
						return;
					}
					if (!joinedRef.current && (errorMsg === 'invalid_token' || errorMsg === 'missing_token')) {
						tokenRejected = true;
						restartSession();
						return;
					}
					setError(errorMsg);
					endCallAfterReconnectFailure();
				}
			};
			ws.onerror = () => {
				if (disposed || wsRef.current !== ws) return;

				setError('Unable to connect to SFU signaling');
				setConnectionState('disconnected');
			};
			ws.onclose = (event) => {
				if (wsRef.current !== ws) return;
				wsRef.current = null;
				if (disposed || !reconnectAllowed) return;
				const action = sfuCloseAction(event.code);
				if (action === 'network-lost' && !serverRestarting) {
					handleNetworkLoss();
					return;
				}
				if (event.code === SFU_SERVER_RESTART_CLOSE_CODE) serverRestarting = true;

				discardPeerConnection();
				reconnectAllowed = action !== 'stop';
				if (action === 'refresh-token') tokenRejected = true;

				setConnectionState('disconnected');
				if (!reconnectAllowed) {
					clearRecoveryDeadline();

					dispatch(
						toastActions.addToast({
							message:
								event.code === SFU_ALONE_TIMEOUT_CLOSE_CODE
									? tRef.current('toast.aloneTimeoutDisconnected')
									: event.code === 4006
										? event.reason || tRef.current('disconnectModal.content.removed')
										: event.code === SFU_DUPLICATE_SESSION_CLOSE_CODE
											? tRef.current('toast.duplicateSessionDisconnected')
											: tRef.current('toast.disconnectedRejoin'),
							type: 'warning',
							autoClose: 5000
						})
					);
					onLeaveRoomRef.current();
					return;
				}

				if (reconnectAllowed) requestReconnect();
			};
		};

		const reconnect = () => {
			if (!canOpenSignaling() || refreshingTokenRef.current || navigator.onLine === false) return;
			sessionToken = signalingTokenRef.current;
			if (tokenRejected || meetTokenNeedsRefresh(sessionToken)) {
				if (tokenRefreshAttempts >= MAX_TOKEN_REFRESH_ATTEMPTS) {
					endCallAfterReconnectFailure();
					return;
				}
				refreshToken(openSignaling);
				return;
			}
			openSignaling();
		};

		requestReconnect = () => {
			if (disposed || !reconnectAllowed || refreshingTokenRef.current || (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED))
				return;
			if (weakNetworkRef.current) {
				handleNetworkLoss();
				return;
			}
			beginRecovery();
			if (!canOpenSignaling() || refreshingTokenRef.current || reconnectTimer !== undefined) return;
			if (typeof navigator !== 'undefined' && navigator.onLine === false) {
				return;
			}
			if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
				endCallAfterReconnectFailure();
				return;
			}
			const delayMs = sfuReconnectDelay(reconnectAttempts);

			reconnectTimer = setTimeout(() => {
				reconnectTimer = undefined;
				if (navigator.onLine === false || disposed || !reconnectAllowed) return;
				reconnectAttempts += 1;

				reconnect();
			}, delayMs);
		};

		const handleOnline = () => {
			if (disposed || !reconnectAllowed || recoveryExpired()) return;

			if (pcRef.current?.connectionState === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) return;
			restartSession();
		};
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleNetworkLoss);
		removeNetworkListeners = () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleNetworkLoss);
		};

		void prepareLocalMedia().finally(() => {
			if (disposed || !reconnectAllowed) return;
			localMediaPreparedRef.current = true;
			setLocalMediaPrepared(true);
			reconnect();
			heartbeatInterval = setInterval(() => {
				const ws = wsRef.current;
				const now = Date.now();
				const muteTimeout = muteSyncRef.current.timedOutRevision(now);
				if (
					ws &&
					((ws.readyState === WebSocket.CONNECTING && now - signalingOpenedAt >= 10_000) ||
						(!joinedRef.current && now - signalingOpenedAt >= 30_000) ||
						now - lastSignalingAt >= 60_000 ||
						muteTimeout !== undefined)
				) {
					handleNetworkLoss();
					return;
				}
				if (ws?.readyState === WebSocket.OPEN) {
					if (now - lastPingAt >= 10_000) {
						lastPingAt = now;
						try {
							ws.send(JSON.stringify({ type: 'ping', timestamp: now }));
						} catch {
							handleNetworkLoss();
						}
					}
					return;
				}
				requestReconnect();
			}, 1000);
		});

		const peerStateById = peerStateByIdRef.current;
		const userIdsByMid = userIdsByMidRef.current;

		return () => {
			disposed = true;
			clearRecoveryDeadline();
			negotiationTimers.forEach(clearTimeout);
			negotiationTimers.clear();
			restartSessionRef.current = () => undefined;
			requestManualRejoinRef.current = () => undefined;
			localMediaPreparedRef.current = false;
			refreshingTokenRef.current = false;
			clearInterval(mediaSyncInterval);
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			if (pendingForcedMuteRef.current !== undefined) {
				window.clearTimeout(pendingForcedMuteRef.current);
				pendingForcedMuteRef.current = undefined;
			}
			removeVisibilityListener();
			removeNetworkListeners();
			clearIceRecoveryTimer();
			clearTransportDeadlineTimer();
			clearScreenKeyFrameRefresh();
			if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
			wsRef.current?.close();
			pcRef.current?.close();
			mezonNsGenerationRef.current++;
			mezonNsPipelineRef.current?.dispose();
			mezonNsPipelineRef.current = null;
			dispatch(voiceActions.setNoiseSuppressionReady(false));
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
			peerStateById.clear();
			userIdsByMid.clear();
			retiredMidsRef.current.clear();
			setRemoteMedia(new Map());
			screenKeyframeRecovery.reset();
		};
	}, [
		applyScreenEncodingParams,
		applySfuPeers,
		claimRemoteMid,
		clearScreenKeyFrameRefresh,
		currentUserId,
		dispatch,
		findUplinkVideoSender,
		getMicrophoneCaptureOptions,
		openPreferredMicrophone,
		getOutgoingAudioTrack,
		setAudioTrackEnabled,
		sendMute,
		isExternalCalling,
		joinRole,
		roomId,
		scheduleScreenKeyFrameRefresh,
		serverUrl,
		screenKeyframeRecovery,
		syncRemoteMedia,
		syncSelectedMicrophone
	]);

	const toggleScreenShare = async () => {
		const pc = pcRef.current;
		if (!pc) return;
		const sender = findUplinkVideoSender('2');
		if (screenStreamRef.current) {
			clearScreenKeyFrameRefresh();
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
				video: getScreenShareConstraints(screenShareModeRef.current),
				audio: false,
				...(captureController ? { controller: captureController } : {})
			} as DisplayMediaStreamOptions);
			try {
				captureController?.setFocusBehavior('focus-capturing-application');
			} catch {} // eslint-disable-line no-empty
			window.focus();
			const track = stream.getVideoTracks()[0];
			if (!track) throw new Error('Unable to get the screen track');
			track.contentHint = SCREEN_SHARE_PROFILES[screenShareModeRef.current].contentHint;
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
			wsRef.current?.send(JSON.stringify({ type: 'share_screen', active: true }));
			track.onended = () => void toggleScreenShare();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to share the screen');
		}
	};

	const setPushToTalk = useCallback(
		async (active: boolean) => {
			if (joinRole !== 'audience') return;
			if (active && microphonePermissionStateRef.current !== 'granted' && !(await ensureMediaPermission('microphone'))) {
				pushToTalkRequestedRef.current = false;
				return;
			}
			pushToTalkRequestedRef.current = active;
			const epoch = connectionEpochRef.current;
			const isCurrent = () =>
				localMediaPreparedRef.current && connectionEpochRef.current === epoch && pushToTalkRequestedRef.current === active;
			if (pushToTalkActive === active) return;
			let audioTrack = localStreamRef.current?.getAudioTracks()[0];
			if (active && (microphonePermissionRevokedRef.current || audioTrack?.readyState !== 'live' || audioTrack.muted)) {
				try {
					const usingMezonNsCapture = noiseSuppressionEnabledRef.current && !mezonNsUnavailableRef.current;
					const stream = await openPreferredMicrophone(getMicrophoneCaptureOptions(), false);
					if (!isCurrent()) {
						stream.getTracks().forEach((track) => track.stop());
						return;
					}
					const nextAudioTrack = stream.getAudioTracks()[0];
					if (!nextAudioTrack) return;
					microphoneCaptureModeRef.current.set(nextAudioTrack, usingMezonNsCapture ? 'mezon-ns' : 'native');
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
					syncSelectedMicrophone(nextAudioTrack);
					setLocalPreview(new MediaStream(localStream.getTracks()));
				} catch (cause) {
					if (!reportMediaAccessError('microphone', cause)) {
						setError(cause instanceof Error ? cause.message : 'Unable to access microphone');
					}
					return;
				}
			}
			if (active && audioTrack) {
				const audioTransceiver = pcRef.current?.getTransceivers().find((item) => item.mid === '0' || item.receiver.track.kind === 'audio');
				if (!audioTransceiver) {
					setError('Audio sender is not negotiated');
					return;
				}
				await audioTransceiver.sender.replaceTrack(getOutgoingAudioTrack(audioTrack));
				if (audioTransceiver.direction !== 'sendonly' && audioTransceiver.direction !== 'sendrecv') {
					audioTransceiver.direction = 'sendonly';
				}
			}
			if (!isCurrent()) return;
			if (audioTrack) setAudioTrackEnabled(audioTrack, active);
			setPushToTalkActive(active);
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				if (active) {
					sendMute(false);
					wsRef.current.send(JSON.stringify({ type: 'push_to_talk', active: true }));
				} else {
					wsRef.current.send(JSON.stringify({ type: 'push_to_talk', active: false }));
					sendMute(true);
				}
			}
		},
		[
			dispatch,
			getMicrophoneCaptureOptions,
			getOutgoingAudioTrack,
			joinRole,
			openPreferredMicrophone,
			pushToTalkActive,
			setAudioTrackEnabled,
			sendMute,
			syncSelectedMicrophone
		]
	);

	const releaseHoldToTalk = useCallback(() => {
		if (!holdToTalkRef.current) return;
		holdToTalkRef.current = false;
		dispatch(voiceActions.setShowMicrophone(false));
	}, [dispatch]);

	const setPushToTalkRef = useRef(setPushToTalk);
	setPushToTalkRef.current = setPushToTalk;

	useEffect(() => {
		const isTyping = (target: EventTarget | null) => {
			const el = target as HTMLElement | null;
			if (!el || typeof el.tagName !== 'string') return false;
			return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
			if (isTyping(event.target) || isTyping(document.activeElement)) return;
			if ((event.target as HTMLElement | null)?.closest?.('[role="dialog"]')) return;
			event.preventDefault();
			if (joinRole === 'audience') {
				void setPushToTalkRef.current(true);
				return;
			}
			if (holdToTalkRef.current || microphoneEnabledRef.current) return;
			if (microphonePermissionStateRef.current !== 'granted') {
				void ensureMediaPermission('microphone');
				return;
			}
			holdToTalkRef.current = true;
			dispatch(voiceActions.setShowMicrophone(true));
		};
		const onKeyUp = (event: KeyboardEvent) => {
			if (event.code !== 'Space') return;
			if (joinRole === 'audience') {
				void setPushToTalkRef.current(false);
				return;
			}
			if (holdToTalkRef.current) event.preventDefault();
			releaseHoldToTalk();
		};
		const onBlur = () => {
			if (joinRole === 'audience') {
				void setPushToTalkRef.current(false);
				return;
			}
			releaseHoldToTalk();
		};
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
			releaseHoldToTalk();
		};
	}, [dispatch, joinRole, releaseHoldToTalk]);

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

	const participants = useMemo(() => getRemoteParticipants(remoteMedia.values(), selfPeerId), [remoteMedia, selfPeerId]);

	const activeCameraCount = useMemo(() => {
		const remoteCameras = participants.filter(
			(participant) => participant.cameraActive !== false && participant.video?.readyState === 'live' && !participant.video.muted
		).length;
		return remoteCameras + (cameraEnabled ? 1 : 0);
	}, [cameraEnabled, participants]);

	useEffect(() => {
		const currentTier = cameraQualityTierRef.current;
		const nextTier = resolveCameraTier(activeCameraCount, currentTier);
		if (nextTier === currentTier) return;
		const timer = setTimeout(
			() => {
				void (async () => {
					const cameraTrack = cameraTrackRef.current;
					if (cameraTrack?.readyState === 'live') await cameraTrack.applyConstraints(getCameraConstraints(nextTier));
					if (pcRef.current) await applyVideoEncodingParams(pcRef.current, nextTier);
					cameraQualityTierRef.current = nextTier;
				})().catch(() => undefined);
			},
			nextTier > currentTier ? CAMERA_TIER_DOWNGRADE_MS : CAMERA_TIER_UPGRADE_MS
		);
		return () => clearTimeout(timer);
	}, [activeCameraCount]);

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
	const speakers = devices.filter((device) => device.kind === 'audiooutput');
	const { sendEmojiReaction: sendMezonEmojiReaction, sendSoundReaction: sendMezonSoundReaction } = useSendReaction();
	const sendEmojiReaction = (emojiId: string, emoji: string) => {
		sendMezonEmojiReaction(emoji, emojiId);
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
					participant.username ||
					participant.userId ||
					GUEST_NAME,
				avatar: getAvatarForPrioritize(member?.clan_avatar, member?.user?.avatar_url) || participant.avatar || ''
			};
		},
		[clanMembers]
	);
	const localMember = currentUserId ? clanMembers[currentUserId] || userProfile : undefined;
	const localDisplayName =
		getNameForPrioritize(localMember?.clan_nick, localMember?.user?.display_name, localMember?.user?.username) ||
		username ||
		currentUserId ||
		GUEST_NAME;

	const localAvatar = getAvatarForPrioritize(localMember?.clan_avatar, localMember?.user?.avatar_url);
	const presentUserIds = useMemo(
		() => [currentUserId, ...participants.map((participant) => participant.userId)].filter((id): id is string => !!id),
		[currentUserId, participants]
	);
	const resolveRecorderName = useCallback(
		(userId: string) => {
			if (userId === currentUserId) return localDisplayName;
			const participant = participants.find((item) => item.userId === userId);
			return participant ? getParticipantProfile(participant).displayName : userId;
		},
		[currentUserId, getParticipantProfile, localDisplayName, participants]
	);

	const isLocalAudioEnabled = joinRole === 'audience' ? pushToTalkActive : microphoneEnabled;
	const outgoingLocalAudioTrack = getOutgoingAudioTrack(localAudioTrack) || undefined;
	const speakingMap = useParticipantsSpeakingMap(outgoingLocalAudioTrack, isLocalAudioEnabled, participants);
	const localSpeaking = isLocalAudioEnabled ? (speakingMap.get('local')?.speaking ?? false) : false;
	const conferenceTiles: Array<{ id: string; participantId: string; contextMenuUserId?: string; isScreen: boolean; content: ReactNode }> = [];
	conferenceTiles.push({
		id: 'local-camera',
		participantId: 'local',
		isScreen: false,
		content: (
			<div
				className={`relative aspect-video overflow-hidden rounded-xl border-2 bg-[#181825] transition-[border-color,box-shadow] duration-150 hover:border-zinc-400 ${
					localSpeaking ? '!border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]' : 'border-transparent'
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
					{!isLocalAudioEnabled ? <Icons.VoiceMicDisabledIcon scale={1.8} className="shrink-0" /> : null}
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
					displayName={participant.userId === process.env.NX_VOICE_AGENT_ID ? AGENT_DISPLAY_NAME : profile.displayName}
					avatar={participant.userId === process.env.NX_VOICE_AGENT_ID ? AGENT_AVATAR : profile.avatar || participant?.avatar}
					speaking={participantSpeaking}
					locallyMuted={participant.userId ? mutedParticipantIds.has(participant.userId) : false}
				/>
			)
		});
		if (isRemoteScreenSharing(participant)) {
			conferenceTiles.push({
				id: `${participant.id}-screen`,
				participantId: participant.id,
				contextMenuUserId: participant.userId,
				isScreen: true,
				content: <SfuScreenShareTile participant={participant} displayName={profile.displayName} recovery={screenKeyframeRecovery} />
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
			if (isRemoteScreenSharing(participant)) {
				sceneTiles.push({
					key: `${participant.id}-screen`,
					participantId: participant.id,
					label: t('usernameScreen', { username: profile.displayName }),
					avatarUrl: profile.avatar || null,
					videoTrack: participant.screen ?? null,
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
		if (isLocalAudioEnabled && outgoingLocalAudioTrack?.readyState === 'live') {
			sources.push({ key: 'local-audio', track: outgoingLocalAudioTrack });
		}
		participants.forEach((participant) => {
			if (participant.audio?.readyState === 'live' && !participant.isMute) {
				sources.push({ key: `${participant.id}-audio`, track: participant.audio });
			}
		});
		return sources;
	}, [isLocalAudioEnabled, outgoingLocalAudioTrack, participants]);
	useSfuCallRecorder({ tiles: recordingTiles, audioSources: recordingAudioSources });
	useRecordingBroadcast();
	const gridLayout = useSfuGridLayout(gridElRef, conferenceTiles.length);

	if (isGridView && activeSpeakerId && gridLayout.maxTiles > 0) {
		const activeSpeakerIndex = gridTileOrderRef.current.findIndex((id) => tilesById.get(id)?.participantId === activeSpeakerId);
		const firstPageCapacity = Math.max(1, gridLayout.maxTiles);
		if (activeSpeakerIndex >= firstPageCapacity) {
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

	const handleWriteChatExternal = (message: string) => {
		wsRef.current?.send(JSON.stringify({ type: 'send_message', message }));
	};
	const connectionLabel =
		connectionState === 'connected' && weakNetwork ? t('weakNetwork') : connectionState === 'awaiting offer' ? 'connecting' : connectionState;

	return (
		<>
			<div className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#11111b] text-white">
				<ReactionCallHandler sinkId={selectedSpeaker} />
				<SfuVoiceInteractiveLayer channelId={roomId} sinkId={selectedSpeaker} />
				<SfuRoomAudioRenderer
					participants={participants}
					mutedParticipantIds={mutedParticipantIds}
					sinkId={selectedSpeaker}
					onPlaybackFailure={handleAudioPlaybackFailure}
					onSinkIdFailure={handleSinkIdFailure}
				/>
				<header className="relative z-20 flex h-[68px] shrink-0 items-center justify-between px-4 text-sm">
					<div className="flex items-center gap-2 text-[var(--bg-icon-theme)]">
						{isPrivateVoice ? (
							<Icons.SpeakerLocked
								defaultSize="h-6 w-6"
								defaultFill1="currentColor"
								defaultFill2="currentColor"
								defaultFill3="currentColor"
							/>
						) : (
							<Icons.Speaker
								defaultSize="h-6 w-6"
								defaultFill1="currentColor"
								defaultFill2="currentColor"
								defaultFill3="currentColor"
							/>
						)}
						<strong className="text-base">{channelLabel || roomId}</strong>
						<span
							className={
								connectionState === 'failed'
									? 'text-red-400'
									: connectionState === 'connected' && !weakNetwork
										? 'text-green-400'
										: 'text-yellow-300'
							}
						>
							· {connectionLabel}
						</span>
					</div>
					<div className="flex items-center gap-4 text-[var(--bg-icon-theme)]">
						{!isExternalCalling && <NotificationTooltip />}
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
				<RecordingIndicator presentUserIds={presentUserIds} resolveName={resolveRecorderName} />

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
								<ScreenShareFocusContext.Provider value={true}>{pinnedTile?.content}</ScreenShareFocusContext.Provider>
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
												className="w-56 shrink-0 overflow-hidden rounded-xl border-2 border-transparent text-left transition-colors"
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
					roomId={roomPeerId}
					joinRole={joinRole}
					hasMicrophoneAccess={hasMicrophoneAccess ?? false}
					hasCameraAccess={hasCameraAccess ?? false}
					microphonePermissionState={microphonePermissionState}
					cameraPermissionState={cameraPermissionState}
					onRequestMicrophonePermission={handleRequestMicrophonePermission}
					onRequestCameraPermission={handleRequestCameraPermission}
					pushToTalkActive={pushToTalkActive}
					microphoneEnabled={microphoneEnabled}
					cameraEnabled={cameraEnabled}
					screenSharing={screenSharing}
					screenShareMode={screenShareMode}
					changingScreenShareMode={changingScreenShareMode}
					onScreenShareModeChange={changeScreenShareMode}
					isGridView={isGridView}
					showEmojiPanel={showEmojiPanel}
					showSoundPanel={showSoundPanel}
					showVoiceInteractivePanel={showVoiceInteractivePanel}
					microphones={microphones}
					cameras={cameras}
					speakers={speakers}
					selectedMicrophone={selectedMicrophone}
					selectedCamera={selectedCamera}
					selectedSpeaker={selectedSpeaker}
					isPopoutOpen={isPopoutOpen}
					isFullScreen={isFullScreen}
					isExternalCalling={isExternalCalling}
					onEmojiPanelChange={setShowEmojiPanel}
					onSoundPanelChange={setShowSoundPanel}
					onVoiceInteractivePanelChange={setShowVoiceInteractivePanel}
					onEmojiSelect={sendEmojiReaction}
					onSoundSelect={sendSoundReaction}
					onPushToTalk={(active) => void setPushToTalk(active)}
					pushToTalkHintDismissed={pushToTalkHintDismissed}
					onDismissPushToTalkHint={() => setPushToTalkHintDismissed(true)}
					weakNetwork={connectionState === 'connected' && weakNetwork}
					onMicrophoneToggle={() => {
						holdToTalkRef.current = false;
						dispatch(voiceActions.setShowMicrophone(!microphoneEnabled));
					}}
					onCameraToggle={() => dispatch(voiceActions.setShowCamera(!cameraEnabled))}
					onScreenShareToggle={() => void toggleScreenShare()}
					onMicrophoneSelect={(deviceId) => void changeInputDevice('audioinput', deviceId)}
					onCameraSelect={(deviceId) => void changeInputDevice('videoinput', deviceId)}
					onSpeakerSelect={changeOutputDevice}
					onLeaveRoom={onLeaveRoom}
					onTogglePopout={() => void togglePopout(activePinnedTrackId)}
					onFullScreen={onFullScreen}
				/>
			</div>
			{isExternalCalling && (
				<ChatStreamExternal
					name={localDisplayName}
					avatar={localAvatar}
					userId={currentUserId}
					ref={chatRef}
					handleWriteChatExternal={handleWriteChatExternal}
				/>
			)}
		</>
	);
}

export default MezonSfuVoiceRoom;
