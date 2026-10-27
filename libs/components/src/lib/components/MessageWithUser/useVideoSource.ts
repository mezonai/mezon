import { getHlsMasterPlaylistUrl, mayBeTranscodedVideo, probeHlsMasterPlaylist } from '@mezon/utils';
import type Hls from 'hls.js';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';

interface VideoSourceOptions {
	/** Only a frame is shown, so buffer a single segment of the smallest rendition. */
	preview?: boolean;
}

/**
 * Plays `url` in the video of `videoRef` while `enabled`, which must be true only while that video is mounted.
 * A video the media server converted to HLS plays from its stream: natively where the browser can, through hls.js
 * elsewhere. When the chosen source fails, the other one is tried once before `failed` turns true.
 * A new CDN signature on the same file does not reload it; only a source loaded later carries it.
 * Pass `handleError` to the video's `onError`.
 */
export function useVideoSource(
	videoRef: RefObject<HTMLVideoElement | null>,
	url: string | undefined,
	enabled: boolean,
	{ preview = false }: VideoSourceOptions = {}
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
		const probe = new AbortController();

		const detach = () => {
			hls?.destroy();
			hls = undefined;
		};

		// Loading a source cancels a play asked for before it (the click that mounted this video, or the viewer's
		// play before a fallback), so ask again once the new source is attached.
		const play = async (source: string, isPlaylist: boolean) => {
			const resume = !video.paused;
			detach();
			playingPlaylist = isPlaylist;
			if (!isPlaylist || video.canPlayType(HLS_MIME_TYPE)) {
				video.src = source;
				if (resume) void video.play().catch(() => undefined);
				return;
			}

			const { default: HlsPlayer } = await import('hls.js');
			if (disposed) return;
			if (!HlsPlayer.isSupported()) {
				fail();
				return;
			}
			const player = new HlsPlayer(
				preview ? { capLevelToPlayerSize: true, startLevel: 0, maxBufferLength: 1, maxMaxBufferLength: 1 } : { capLevelToPlayerSize: true }
			);
			hls = player;
			player.on(HlsPlayer.Events.ERROR, (_event, data) => {
				if (data.fatal && hls === player) fail();
			});
			player.loadSource(source);
			player.attachMedia(video);
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
			const other = playingPlaylist ? signedUrl : getHlsMasterPlaylistUrl(signedUrl);
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
			void probeHlsMasterPlaylist(url, probe.signal).then((playlist) => {
				if (disposed || switched || !playlist) return;
				switched = true;
				void play(playlist, true);
			});
		};
		video.addEventListener('loadedmetadata', checkPicture);

		if (mayBeTranscodedVideo(url)) {
			void probeHlsMasterPlaylist(url, probe.signal).then((playlist) => {
				if (!disposed) void play(playlist ?? url, Boolean(playlist));
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
	}, [videoRef, file, enabled, preview]);

	const handleError = useCallback(() => mediaErrorRef.current(), []);

	return { failed: enabled && failedFile !== undefined && failedFile === file, handleError };
}
