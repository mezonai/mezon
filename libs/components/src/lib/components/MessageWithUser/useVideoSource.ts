import {
	HLS_INDEX_PROBE_INTERVAL_MS,
	IS_SAFARI,
	getHlsIndexPlaylistUrl,
	getHlsMasterPlaylistUrl,
	isRotatedHlsVideo,
	mayBeTranscodedVideo,
	probeEndedHlsIndexPlaylist,
	probeHlsIndexPlaylist,
	probeHlsMasterPlaylist
} from '@mezon/utils';
import type Hls from 'hls.js';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';

interface VideoSourceOptions {
	/** Only a frame is shown, so buffer a single segment of the smallest rendition. */
	preview?: boolean;
	/** Sent through the file ingest: its stream is the EVENT playlist `index.m3u8`, played from the start. */
	ingest?: boolean;
}

/**
 * Plays `url` in the video of `videoRef` while `enabled`, which must be true only while that video is mounted.
 * A video the media server converted to HLS plays from its stream: natively where the browser can, through hls.js
 * elsewhere. Safari plays a turned or mirrored stream's original instead, since its players ignore the turn.
 * When the chosen source fails, the other one is tried once before `failed` turns true.
 * A new CDN signature on the same file does not reload it; only a source loaded later carries it.
 * Pass `handleError` to the video's `onError`.
 */
export function useVideoSource(
	videoRef: RefObject<HTMLVideoElement | null>,
	url: string | undefined,
	enabled: boolean,
	{ preview = false, ingest = false }: VideoSourceOptions = {}
) {
	const file = url?.split('?')[0];
	const [failedFile, setFailedFile] = useState<string>();
	const latestUrlRef = useRef(url);
	const mediaErrorRef = useRef<() => void>(() => undefined);

	useEffect(() => {
		latestUrlRef.current = url;
	});

	useEffect(() => {
		const video = videoRef.current;
		const url = latestUrlRef.current;
		if (!enabled || !url || !video) return;

		let disposed = false;
		let switched = false;
		let playingPlaylist = false;
		let hls: Hls | undefined;
		let endProbe: ReturnType<typeof setTimeout> | undefined;
		const probe = new AbortController();
		const probePlaylist = ingest ? probeHlsIndexPlaylist : probeHlsMasterPlaylist;
		const getPlaylistUrl = ingest ? getHlsIndexPlaylistUrl : getHlsMasterPlaylistUrl;

		const detach = () => {
			hls?.destroy();
			hls = undefined;
			clearTimeout(endProbe);
		};

		// Loading a source cancels a play asked for before it (the click that mounted this video, or the viewer's
		// play before a fallback), so ask again once the new source is attached.
		const play = async (source: string, isPlaylist: boolean) => {
			const resume = !video.paused;
			detach();
			playingPlaylist = isPlaylist;
			if (!isPlaylist || (video.canPlayType(HLS_MIME_TYPE) && (!ingest || IS_SAFARI))) {
				video.src = source;
				if (resume) void video.play().catch(() => undefined);
				if (ingest && isPlaylist) endProbe = setTimeout(() => void reloadOnceEnded(), HLS_INDEX_PROBE_INTERVAL_MS);
				return;
			}

			const { default: HlsPlayer } = await import('hls.js');
			if (disposed) return;
			if (!HlsPlayer.isSupported()) {
				fail();
				return;
			}
			const config = preview
				? { capLevelToPlayerSize: true, startLevel: 0, maxBufferLength: 1, maxMaxBufferLength: 1 }
				: { capLevelToPlayerSize: true };
			const player = new HlsPlayer(ingest ? { ...config, startPosition: 0 } : config);
			hls = player;
			player.on(HlsPlayer.Events.ERROR, (_event, data) => {
				if (data.fatal && hls === player) fail();
			});
			player.loadSource(source);
			player.attachMedia(video);
			if (resume) void video.play().catch(() => undefined);
		};

		const reloadOnceEnded = async () => {
			if (Number.isFinite(video.duration)) return;
			const ended = await probeEndedHlsIndexPlaylist(url, probe.signal);
			if (disposed || !playingPlaylist) return;
			if (!ended || video.duration !== Infinity) {
				endProbe = setTimeout(() => void reloadOnceEnded(), HLS_INDEX_PROBE_INTERVAL_MS);
				return;
			}
			const position = video.currentTime;
			const resume = !video.paused;
			video.src = ended;
			video.currentTime = position;
			if (resume) void video.play().catch(() => undefined);
		};

		const fail = () => {
			if (disposed) return;
			if (switched || !mayBeTranscodedVideo(url)) {
				detach();
				setFailedFile(file);
				return;
			}
			switched = true;
			const signedUrl = latestUrlRef.current ?? url;
			const other = playingPlaylist ? signedUrl : getPlaylistUrl(signedUrl);
			if (!other) return;
			void play(other, !playingPlaylist);
		};

		// hls.js reports its own failures; the video element also fires for those it gives up on.
		mediaErrorRef.current = () => {
			if (!hls) fail();
		};

		// A browser that cannot decode the original's video track (HEVC on most Windows and Linux machines) still plays
		// its audio and raises no error, so an original without a picture moves to the stream when there is one.
		const checkPicture = () => {
			if (playingPlaylist || switched || video.videoWidth > 0 || !mayBeTranscodedVideo(url)) return;
			void probePlaylist(url, probe.signal).then((playlist) => {
				if (disposed || switched || !playlist) return;
				switched = true;
				void play(playlist, true);
			});
		};
		video.addEventListener('loadedmetadata', checkPicture);

		if (mayBeTranscodedVideo(url)) {
			void probePlaylist(url, probe.signal).then(async (playlist) => {
				const stream = playlist && IS_SAFARI && (await isRotatedHlsVideo(playlist, probe.signal)) ? undefined : playlist;
				if (disposed) return;
				switched = stream !== playlist;
				void play(stream ?? url, Boolean(stream));
			});
		} else {
			void play(url, false);
		}

		return () => {
			disposed = true;
			video.removeEventListener('loadedmetadata', checkPicture);
			probe.abort();
			detach();
			mediaErrorRef.current = () => undefined;
			setFailedFile(undefined);
		};
	}, [videoRef, file, enabled, preview, ingest]);

	const handleError = useCallback(() => mediaErrorRef.current(), []);

	return { failed: enabled && failedFile !== undefined && failedFile === file, handleError };
}

export function useIngestPlaylistReady(url: string | undefined, enabled: boolean): boolean {
	const file = url?.split('?')[0];
	const [readyFile, setReadyFile] = useState<string>();
	const ready = file !== undefined && readyFile === file;

	useEffect(() => {
		if (!enabled || !file || ready) return;
		const probe = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const poll = async () => {
			const startedAt = Date.now();
			const playlist = await probeHlsIndexPlaylist(file, probe.signal);
			const waitsForOriginal = playlist !== undefined && IS_SAFARI && (await isRotatedHlsVideo(playlist, probe.signal));
			if (probe.signal.aborted || waitsForOriginal) return;
			if (playlist) setReadyFile(file);
			else timer = setTimeout(poll, Math.max(0, startedAt + HLS_INDEX_PROBE_INTERVAL_MS - Date.now()));
		};
		void poll();
		return () => {
			probe.abort();
			clearTimeout(timer);
		};
	}, [file, enabled, ready]);

	return ready;
}
