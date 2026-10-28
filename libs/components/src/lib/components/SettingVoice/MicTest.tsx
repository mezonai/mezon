import { getNoiseSuppressionAudioCaptureOptions, sinkIdForHtmlMediaElement, supportsAudioOutputDeviceSelection } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MicTestProps {
	permissionState: 'unknown' | 'granted' | 'denied';
	isTesting: boolean;
	micLevel: number;
	testError: string;
	hasSetSinkId: boolean;
	playbackAudioRef: React.RefObject<HTMLAudioElement>;
	onStartTest: () => void;
	onStopTest: () => void;
	t: (key: string) => string;
}

const MicTestComponent = ({
	permissionState,
	isTesting,
	micLevel,
	testError,
	hasSetSinkId,
	playbackAudioRef,
	onStartTest,
	onStopTest,
	t
}: MicTestProps) => {
	return (
		<div className="mt-6">
			<div>
				<div className="text-lg font-bold text-theme-primary-active tracking-wide mb-2">{t('setting:voice.micTest.title')}</div>
				<p className="text-xs text-theme-primary-hover mb-3">{t('setting:voice.micTest.description')}</p>

				{permissionState === 'denied' && <div className="text-xs text-red-500 mb-3">{t('setting:voice.errors.permissionDenied')}</div>}
				{testError && <div className="text-xs text-red-500 mb-3">{testError}</div>}

				<div className="flex items-center gap-3">
					<button
						className="btn-primary btn-primary-hover inline-flex items-center justify-center min-h-[40px] min-w-[7.5rem] max-w-[11rem] px-3 py-2 rounded-lg cursor-pointer text-center whitespace-normal break-words leading-tight disabled:opacity-50"
						onClick={() => (isTesting ? onStopTest() : void onStartTest())}
						disabled={permissionState === 'denied'}
					>
						{isTesting ? t('setting:voice.micTest.stop') : t('setting:voice.micTest.letsCheck')}
					</button>

					<div className="flex-1 min-w-0">
						<div className="w-full h-4 flex items-center gap-[5px] overflow-hidden">
							{Array.from({ length: 84 }).map((_, i) => (
								<span
									key={i}
									className={`h-full w-[3px] flex-shrink-0 rounded-sm ${
										i < Math.round(micLevel * 72) ? 'bg-emerald-500' : 'bg-gray-300 opacity-70'
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				<audio ref={playbackAudioRef} className="hidden" />

				{!hasSetSinkId && <div className="mt-2 text-[11px] text-theme-primary-hover">{t('setting:voice.warnings.outputNotSupported')}</div>}
			</div>
		</div>
	);
};

export const MicTest = React.memo(MicTestComponent);

interface UseMicTestOptions {
	inputDeviceId: string;
	outputDeviceId: string;
	micVolume?: number;
	speakerVolume?: number;
	noiseSuppressionEnabled?: boolean;
	onLevel: (level: number) => void;
}

// Live mic test shared by Settings > Voice and the meeting pre-join: plays the mic back on the chosen speaker and reports its level
export const useMicTest = (options: UseMicTestOptions) => {
	const { t } = useTranslation(['setting']);
	const [isTesting, setIsTesting] = useState(false);
	const [testError, setTestError] = useState('');
	const optionsRef = useRef(options);
	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const rafRef = useRef<number | null>(null);
	const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
	const testRequestRef = useRef(0);
	const hasSetSinkId = useMemo(() => supportsAudioOutputDeviceSelection(), []);

	useEffect(() => {
		optionsRef.current = options;
	});

	const stopTest = useCallback(() => {
		// Outdates a start that is still waiting for the mic or the speaker
		testRequestRef.current += 1;
		setIsTesting(false);
		setTestError('');

		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		optionsRef.current.onLevel(0);

		const audio = playbackAudioRef.current;
		if (audio) {
			try {
				audio.pause();
			} catch {
				// ignore
			}
			audio.srcObject = null;
			audio.removeAttribute('src');
			audio.load();
		}

		// Closing the context also releases the source, gain and analyser nodes
		const ctx = audioContextRef.current;
		audioContextRef.current = null;
		void ctx?.close().catch(() => undefined);

		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
	}, []);

	const startTest = useCallback(async () => {
		stopTest();
		// Any later stop or start (double click, Join, device change, unmount) makes this run stale
		const request = testRequestRef.current;
		const isStale = () => request !== testRequestRef.current;
		setIsTesting(true);
		const { inputDeviceId, outputDeviceId, micVolume = 1, speakerVolume = 1, noiseSuppressionEnabled = false } = optionsRef.current;

		const captureMic = (deviceId?: string) =>
			navigator.mediaDevices.getUserMedia({
				audio: {
					...getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabled),
					...(deviceId ? { deviceId: { exact: deviceId } } : {})
				} as MediaTrackConstraints,
				video: false
			});

		try {
			const preferredId = inputDeviceId && inputDeviceId !== 'default' ? inputDeviceId : undefined;
			// A stored mic that is no longer plugged in fails `exact`; fall back to the default mic like openPreferredMicrophone
			const stream = await captureMic(preferredId).catch((cause) => {
				if (!preferredId || (cause as { name?: string } | null)?.name !== 'OverconstrainedError') throw cause;
				return captureMic();
			});
			if (isStale()) {
				stream.getTracks().forEach((track) => track.stop());
				return;
			}
			streamRef.current = stream;

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			const gain = audioContext.createGain();
			gain.gain.value = micVolume;
			const destination = audioContext.createMediaStreamDestination();
			audioContext.createMediaStreamSource(stream).connect(gain);
			gain.connect(analyser);
			gain.connect(destination);

			const data = new Uint8Array(analyser.fftSize);
			const tick = () => {
				analyser.getByteTimeDomainData(data);
				let sum = 0;
				for (let i = 0; i < data.length; i++) {
					const v = ((data[i] ?? 128) - 128) / 128;
					sum += v * v;
				}
				optionsRef.current.onLevel(Math.min(1, Math.sqrt(sum / data.length) * 2.2));
				rafRef.current = requestAnimationFrame(tick);
			};
			rafRef.current = requestAnimationFrame(tick);

			// Live monitor: play mic audio immediately instead of waiting until stop.
			const audio = playbackAudioRef.current;
			if (audio) {
				audio.srcObject = destination.stream;
				audio.volume = speakerVolume;
				if (hasSetSinkId) {
					try {
						await (audio as HTMLMediaElement & { setSinkId: (deviceId: string) => Promise<void> }).setSinkId(
							sinkIdForHtmlMediaElement(outputDeviceId)
						);
					} catch {
						// ignore and fallback to default output
					}
				}
				// Stopped while picking the speaker: stopTest already released the mic and the graph
				if (isStale()) return;
				try {
					await audio.play();
				} catch {
					// ignore autoplay issues
				}
			}
		} catch (e) {
			console.error(e);
			// A late failure of an outdated run must not stop a newer test
			if (isStale()) return;
			stopTest();
			setTestError(t('setting:voice.errors.micPermission'));
		}
	}, [hasSetSinkId, stopTest, t]);

	useEffect(() => stopTest, [stopTest]);

	const getInputTrack = useCallback(() => streamRef.current?.getAudioTracks()[0], []);

	return { isTesting, testError, hasSetSinkId, playbackAudioRef, startTest, stopTest, getInputTrack };
};
