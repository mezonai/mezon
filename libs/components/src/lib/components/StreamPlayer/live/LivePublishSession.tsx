import type { LiveFailure, LivePhase, LiveSource, LiveSourcesUpdate } from '@mezon/store';
import {
	fetchStreamPlayback,
	liveStreamActions,
	selectLiveInfo,
	selectLivePhase,
	selectLiveStopRequest,
	toastActions,
	useAppDispatch,
	usersStreamActions
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LiveSession } from './liveSession';
import type { PendingLiveCapture } from './liveSessionHolder';
import { getLiveSession, setLiveSession, takePendingLiveCapture } from './liveSessionHolder';

const SOURCE_LABEL_KEYS: Record<LiveSource, string> = {
	screen: 'liveScreen',
	camera: 'liveCamera',
	mic: 'liveMic',
	systemAudio: 'liveSystemAudio'
};

function disposePendingCapture(capture: PendingLiveCapture | null): void {
	if (!capture) return;
	const streams = [capture.screen, capture.camera, capture.mic];
	for (const stream of streams) {
		if (!stream) continue;
		for (const track of stream.getTracks()) {
			track.onended = null;
			track.stop();
		}
	}
	void Promise.resolve(capture.audioContext.close()).catch(() => undefined);
}

export function LivePublishSession() {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('channelStream');
	const phase = useSelector(selectLivePhase);
	const liveInfo = useSelector(selectLiveInfo);
	const stopRequest = useSelector(selectLiveStopRequest);
	const tRef = useRef(t);
	const clanIdRef = useRef(liveInfo.clanId);

	useEffect(() => {
		tRef.current = t;
	}, [t]);

	useEffect(() => {
		if (liveInfo.clanId) {
			clanIdRef.current = liveInfo.clanId;
		}
	}, [liveInfo.clanId]);

	const refetchStreamMembers = useCallback(
		(clanId: string) => {
			if (!clanId) return;
			void dispatch(
				usersStreamActions.fetchStreamChannelMembers({
					clanId,
					channelId: '0',
					channelType: ChannelType.CHANNEL_TYPE_STREAMING,
					noCache: true
				})
			);
		},
		[dispatch]
	);

	useEffect(() => {
		if (phase !== 'starting' || getLiveSession()) return;
		const capture = takePendingLiveCapture();
		if (!capture) return;

		let refreshedOnIdle = false;
		const sessionClanId = capture.clanId;
		const sessionChannelId = capture.channelId;

		let session: LiveSession;
		try {
			session = new LiveSession({
				channelId: sessionChannelId,
				screen: capture.screen,
				camera: capture.camera,
				mic: capture.mic,
				audioContext: capture.audioContext,
				systemAudioOn: capture.systemAudioOn,
				fetchEndpoint: async () => {
					const playback = await dispatch(fetchStreamPlayback({ channelId: sessionChannelId, publish: true })).unwrap();
					if (!playback?.token || !playback?.whip_url) return null;
					return { token: playback.token, whip_url: playback.whip_url };
				},
				onPhase: (nextPhase: LivePhase, attempt?: number) => {
					if (nextPhase === 'idle') {
						if (getLiveSession() === session) {
							setLiveSession(null);
						}
						dispatch(liveStreamActions.reset());
						if (!refreshedOnIdle) {
							refreshedOnIdle = true;
							refetchStreamMembers(sessionClanId);
						}
						return;
					}
					dispatch(liveStreamActions.setPhase({ phase: nextPhase, attempt }));
					if (nextPhase === 'live') {
						refetchStreamMembers(sessionClanId);
					}
				},
				onSources: (sources: LiveSourcesUpdate) => {
					dispatch(liveStreamActions.setSources(sources));
				},
				onFailure: (failure: LiveFailure) => {
					dispatch(
						toastActions.addToast({
							message: tRef.current(`liveError.${failure}`),
							type: 'error',
							autoClose: 5000
						})
					);
					dispatch(liveStreamActions.reset());
				},
				onSourceIssue: (source: LiveSource, kind: 'start' | 'ended') => {
					const sourceName = tRef.current(SOURCE_LABEL_KEYS[source]);
					const key = kind === 'start' ? 'liveError.source' : 'liveError.sourceEnded';
					dispatch(
						toastActions.addToast({
							message: tRef.current(key, { source: sourceName }),
							type: 'error',
							autoClose: 5000
						})
					);
				}
			});
		} catch {
			disposePendingCapture(capture);
			dispatch(toastActions.addToast({ message: tRef.current('liveError.unsupported'), type: 'error', autoClose: 5000 }));
			dispatch(liveStreamActions.reset());
			return;
		}

		setLiveSession(session);
		void session.start();
	}, [dispatch, phase, refetchStreamMembers]);

	useEffect(() => {
		if (!stopRequest) return;
		const activeClanId = liveInfo.clanId || clanIdRef.current;
		const pending = takePendingLiveCapture();
		disposePendingCapture(pending);
		const session = getLiveSession();
		setLiveSession(null);
		if (session) {
			session.stop();
		} else if (activeClanId) {
			refetchStreamMembers(activeClanId);
		}
		if (stopRequest !== 'user') {
			dispatch(
				toastActions.addToast({
					message: tRef.current(`liveError.${stopRequest}`),
					type: 'error',
					autoClose: 5000
				})
			);
		}
		dispatch(liveStreamActions.reset());
	}, [dispatch, liveInfo.clanId, refetchStreamMembers, stopRequest]);

	useEffect(() => {
		const handlePageHide = () => {
			const pending = takePendingLiveCapture();
			disposePendingCapture(pending);
			getLiveSession()?.stop(true);
		};
		window.addEventListener('pagehide', handlePageHide);
		return () => {
			window.removeEventListener('pagehide', handlePageHide);
		};
	}, []);

	useEffect(() => {
		return () => {
			const pending = takePendingLiveCapture();
			disposePendingCapture(pending);
			const session = getLiveSession();
			setLiveSession(null);
			session?.stop();
			dispatch(liveStreamActions.reset());
		};
	}, [dispatch]);

	return null;
}
