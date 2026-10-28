import type { StreamQuality } from '@mezon/store';
import {
	appActions,
	fetchStreamPlayback,
	selectCurrentStreamInfo,
	selectIsJoin,
	selectStreamMembersByChannelId,
	selectStreamMuted,
	selectStreamPlayback,
	selectStreamQuality,
	selectStreamVolume,
	toastActions,
	useAppDispatch,
	useAppSelector,
	videoStreamActions,
	watchStream
} from '@mezon/store';
import { setPreferredOutputDeviceId, sinkIdForHtmlMediaElement } from '@mezon/utils';
import type Hls from 'hls.js';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { sfuReconnectDelay } from '../MezonSfuVoiceChannel/MyVideoConference/sfuReconnect';
import { usePreferredOutputDevice } from '../MezonSfuVoiceChannel/usePreferredOutputDevice';
import { getStreamVideo } from './StreamVideoSlot';
import { WhepError, setWhepLayer, startWhep, stopWhep, waitConnected, type WhepSession } from './whep';

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';
const WHEP_CONNECT_TIMEOUT_MS = 5000;
const WHEP_DISCONNECTED_GRACE_MS = 5000;
const MAX_RECONNECTS = 3;
const WATCH_RENEW_MS = 30000;

const hlsLevelFor = (quality: StreamQuality, levels: number) => {
	if (quality === 'auto' || levels === 0) return -1;
	if (quality === 'low') return 0;
	if (quality === 'high') return levels - 1;
	return Math.floor((levels - 1) / 2);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function StreamPlaybackSession() {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('channelStream');
	const isJoin = useSelector(selectIsJoin);
	const streamInfo = useSelector(selectCurrentStreamInfo);
	const playback = useSelector(selectStreamPlayback);
	const quality = useSelector(selectStreamQuality);
	const volume = useSelector(selectStreamVolume);
	const muted = useSelector(selectStreamMuted);
	const memberCount = useAppSelector((state) => selectStreamMembersByChannelId(state, streamInfo?.streamId || '').length);
	const { outputDeviceId, handleSinkIdFailure } = usePreferredOutputDevice();
	const channelId = isJoin ? streamInfo?.streamId : undefined;
	const qualityRef = useRef(quality);
	const reconnectsRef = useRef(0);
	const whepRef = useRef<WhepSession>();
	const hlsRef = useRef<Hls>();

	const stop = useCallback(
		(failed: boolean) => {
			if (failed) {
				dispatch(toastActions.addToast({ message: t('videoError'), type: 'error', autoClose: 5000 }));
				if (channelId) void dispatch(watchStream({ channelId, watching: false }));
			}
			dispatch(videoStreamActions.resetPlayback());
			dispatch(appActions.setIsShowChatStream(false));
		},
		[channelId, dispatch, t]
	);
	const stopRef = useRef(stop);
	useEffect(() => {
		stopRef.current = stop;
	}, [stop]);

	useEffect(() => {
		if (!isJoin || !streamInfo?.streamId || memberCount > 0) return;
		stop(false);
	}, [isJoin, memberCount, streamInfo?.streamId, stop]);

	useEffect(() => {
		reconnectsRef.current = 0;
	}, [channelId]);

	useEffect(() => {
		if (!channelId) return;
		const rewatch = () => void dispatch(watchStream({ channelId, watching: true }));
		const renew = setInterval(rewatch, WATCH_RENEW_MS);
		window.addEventListener('mezon:socket-reconnect', rewatch);
		return () => {
			clearInterval(renew);
			window.removeEventListener('mezon:socket-reconnect', rewatch);
		};
	}, [channelId, dispatch]);

	useEffect(() => {
		const video = getStreamVideo();
		video.volume = volume;
		video.muted = muted;
	}, [volume, muted]);

	useEffect(() => {
		const video = getStreamVideo() as HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> };
		if (typeof video.setSinkId !== 'function') return;
		const sinkId = sinkIdForHtmlMediaElement(outputDeviceId);
		video.setSinkId(sinkId).catch(() => {
			if (sinkId === '') return;
			void video.setSinkId?.('').catch(() => undefined);
			setPreferredOutputDeviceId('default');
			handleSinkIdFailure(outputDeviceId);
		});
	}, [outputDeviceId, handleSinkIdFailure]);

	useEffect(() => {
		qualityRef.current = quality;
		if (whepRef.current) void setWhepLayer(whepRef.current.resource, quality);
		const hls = hlsRef.current;
		if (hls) hls.currentLevel = hlsLevelFor(quality, hls.levels.length);
	}, [quality]);

	useEffect(() => {
		if (!channelId || !playback) return;
		const video = getStreamVideo();
		const listeners = new AbortController();
		let disposed = false;
		let reconnecting = false;
		let disconnectedTimer: ReturnType<typeof setTimeout> | undefined;
		let whep: WhepSession | undefined;
		let hls: Hls | undefined;

		const play = () => {
			video.play().catch((error: unknown) => {
				if (disposed || (error as DOMException | undefined)?.name !== 'NotAllowedError') return;
				const retry = () => void video.play().catch(() => undefined);
				window.addEventListener('pointerdown', retry, { once: true, signal: listeners.signal });
				window.addEventListener('keydown', retry, { once: true, signal: listeners.signal });
			});
		};

		const reconnect = async () => {
			if (disposed || reconnecting) return;
			reconnecting = true;
			while (!disposed) {
				if (reconnectsRef.current >= MAX_RECONNECTS) {
					stopRef.current(true);
					return;
				}
				await sleep(sfuReconnectDelay(reconnectsRef.current++));
				if (disposed) return;
				const next = await dispatch(fetchStreamPlayback({ channelId })).unwrap();
				if (disposed) return;
				if (next) {
					dispatch(videoStreamActions.setPlayback(next));
					void dispatch(watchStream({ channelId, watching: true }));
					return;
				}
			}
		};

		const playHls = async (url: string) => {
			const { default: HlsPlayer } = await import('hls.js');
			if (disposed) return;
			if (!HlsPlayer.isSupported()) {
				if (!video.canPlayType(HLS_MIME_TYPE)) {
					stopRef.current(true);
					return;
				}
				video.onerror = () => void reconnect();
				video.src = url;
				play();
				return;
			}
			const player = new HlsPlayer({ lowLatencyMode: true, backBufferLength: 10 });
			hls = player;
			hlsRef.current = player;
			let recoveredMedia = false;
			player.on(HlsPlayer.Events.MANIFEST_PARSED, () => {
				if (qualityRef.current !== 'auto') player.currentLevel = hlsLevelFor(qualityRef.current, player.levels.length);
			});
			player.once(HlsPlayer.Events.FRAG_BUFFERED, () => {
				reconnectsRef.current = 0;
			});
			player.on(HlsPlayer.Events.ERROR, (_event, data) => {
				if (!data.fatal) return;
				if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
					recoveredMedia = true;
					player.recoverMediaError();
					return;
				}
				void reconnect();
			});
			player.loadSource(url);
			player.attachMedia(video);
			play();
		};

		const connect = async () => {
			if (playback.whep_url && playback.token) {
				try {
					const session = await startWhep(playback.whep_url, playback.token, qualityRef.current);
					if (disposed) {
						stopWhep(session);
						return;
					}
					whep = session;
					whepRef.current = session;
					video.srcObject = session.stream;
					play();
					const connected = await waitConnected(session.pc, WHEP_CONNECT_TIMEOUT_MS);
					if (disposed) return;
					if (connected) {
						reconnectsRef.current = 0;
						session.pc.onconnectionstatechange = () => {
							clearTimeout(disconnectedTimer);
							const state = session.pc.connectionState;
							if (state === 'failed') void reconnect();
							if (state === 'disconnected') disconnectedTimer = setTimeout(() => void reconnect(), WHEP_DISCONNECTED_GRACE_MS);
						};
						return;
					}
					stopWhep(session);
					whep = undefined;
					whepRef.current = undefined;
					video.srcObject = null;
				} catch (error) {
					if (disposed) return;
					if (error instanceof WhepError && error.status === 404) {
						stopRef.current(true);
						return;
					}
				}
			}
			if (playback.hls_url) {
				await playHls(playback.hls_url);
				return;
			}
			stopRef.current(true);
		};

		const handlePageHide = () => {
			if (whep) stopWhep(whep, true);
			void dispatch(watchStream({ channelId, watching: false }));
		};
		window.addEventListener('pagehide', handlePageHide, { signal: listeners.signal });
		void connect();

		return () => {
			disposed = true;
			listeners.abort();
			clearTimeout(disconnectedTimer);
			if (whep) stopWhep(whep);
			hls?.destroy();
			whepRef.current = undefined;
			hlsRef.current = undefined;
			video.onerror = null;
			video.srcObject = null;
			video.removeAttribute('src');
			video.load();
		};
	}, [channelId, playback, dispatch]);

	return null;
}
