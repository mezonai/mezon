import { requestMediaPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceSelector } from './DeviceSelector';
import { MicTest } from './MicTest';
import { VolumeSlider } from './VolumeSlider';

const LS_KEYS = {
	inputDeviceId: 'mezon.voice.inputDeviceId',
	outputDeviceId: 'mezon.voice.outputDeviceId',
	micVolume: 'mezon.voice.micVolume',
	speakerVolume: 'mezon.voice.speakerVolume'
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const safeParseNumber = (value: string | null, fallback: number) => {
	if (value == null) return fallback;
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

interface ISettingVoiceProps {
	menuIsOpen: boolean;
}

export const SettingVoice = ({ menuIsOpen }: ISettingVoiceProps) => {
	const { t } = useTranslation(['setting']);
	const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');

	const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
	const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

	const [inputDeviceId, setInputDeviceId] = useState<string>(() => localStorage.getItem(LS_KEYS.inputDeviceId) || '');
	const [outputDeviceId, setOutputDeviceId] = useState<string>(() => localStorage.getItem(LS_KEYS.outputDeviceId) || '');
	const [micVolume, setMicVolume] = useState<number>(() => clamp01(safeParseNumber(localStorage.getItem(LS_KEYS.micVolume), 0.8)));
	const [speakerVolume, setSpeakerVolume] = useState<number>(() => clamp01(safeParseNumber(localStorage.getItem(LS_KEYS.speakerVolume), 0.6)));

	const [micLevel, setMicLevel] = useState<number>(0);
	const [isTesting, setIsTesting] = useState<boolean>(false);
	const [testError, setTestError] = useState<string>('');

	const inputDeviceIdRef = useRef<string>(inputDeviceId);
	const outputDeviceIdRef = useRef<string>(outputDeviceId);
	const micVolumeRef = useRef<number>(micVolume);
	const speakerVolumeRef = useRef<number>(speakerVolume);

	useEffect(() => {
		inputDeviceIdRef.current = inputDeviceId;
	}, [inputDeviceId]);
	useEffect(() => {
		outputDeviceIdRef.current = outputDeviceId;
	}, [outputDeviceId]);
	useEffect(() => {
		micVolumeRef.current = micVolume;
	}, [micVolume]);
	useEffect(() => {
		speakerVolumeRef.current = speakerVolume;
	}, [speakerVolume]);

	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const rafRef = useRef<number | null>(null);
	const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
	const playbackStreamRef = useRef<MediaStream | null>(null);

	const hasSetSinkId = useMemo(() => {
		try {
			return typeof (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId === 'function';
		} catch {
			return false;
		}
	}, []);

	const stopLevelMeter = useCallback(() => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		setMicLevel(0);
	}, []);

	const stopStream = useCallback(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}, []);

	const cleanupAudioGraph = useCallback(() => {
		stopLevelMeter();
		try {
			analyserRef.current?.disconnect();
		} catch {
			// ignore
		}
		analyserRef.current = null;

		const ctx = audioContextRef.current;
		audioContextRef.current = null;
		if (ctx) {
			try {
				void ctx.close();
			} catch {
				// ignore
			}
		}
	}, [stopLevelMeter]);

	const refreshDevices = useCallback(async () => {
		if (!navigator.mediaDevices?.enumerateDevices) return;
		const devices = await navigator.mediaDevices.enumerateDevices();
		const nextInputs = devices.filter((d) => d.kind === 'audioinput');
		const nextOutputs = devices.filter((d) => d.kind === 'audiooutput');

		setInputDevices(nextInputs);
		setOutputDevices(nextOutputs);

		setInputDeviceId((prev) => {
			if (nextInputs.length === 0) return '';
			const first = nextInputs[0];
			return nextInputs.some((d) => d.deviceId === prev) ? prev : first ? first.deviceId : '';
		});
		setOutputDeviceId((prev) => {
			if (nextOutputs.length === 0) return '';
			const first = nextOutputs[0];
			return nextOutputs.some((d) => d.deviceId === prev) ? prev : first ? first.deviceId : '';
		});
	}, []);

	useEffect(() => {
		(async () => {
			const status = await requestMediaPermission('audio');
			setPermissionState(status === 'granted' ? 'granted' : 'denied');
			await refreshDevices();
		})().catch(() => {
			setPermissionState('denied');
		});

		const handler = () => refreshDevices().catch(() => undefined);
		navigator.mediaDevices?.addEventListener?.('devicechange', handler);
		return () => {
			navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
		};
	}, [refreshDevices]);

	useEffect(() => {
		localStorage.setItem(LS_KEYS.inputDeviceId, inputDeviceId);
	}, [inputDeviceId]);
	useEffect(() => {
		localStorage.setItem(LS_KEYS.outputDeviceId, outputDeviceId);
	}, [outputDeviceId]);
	useEffect(() => {
		localStorage.setItem(LS_KEYS.micVolume, String(micVolume));
	}, [micVolume]);
	useEffect(() => {
		localStorage.setItem(LS_KEYS.speakerVolume, String(speakerVolume));
	}, [speakerVolume]);

	const startLevelMeter = useCallback(() => {
		const analyser = analyserRef.current;
		if (!analyser) return;
		const data = new Uint8Array(analyser.fftSize);

		const tick = () => {
			analyser.getByteTimeDomainData(data);
			let sum = 0;
			for (let i = 0; i < data.length; i++) {
				const sample = data[i] ?? 128;
				const v = (sample - 128) / 128;
				sum += v * v;
			}
			const rms = Math.sqrt(sum / data.length);
			setMicLevel(clamp01(rms * 2.2));
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
	}, []);

	const stopTest = useCallback(() => {
		setIsTesting(false);
		setTestError('');

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
		playbackStreamRef.current = null;

		cleanupAudioGraph();
		stopStream();
	}, [cleanupAudioGraph, stopStream]);

	const startTest = useCallback(async () => {
		setTestError('');
		setIsTesting(true);

		try {
			stopTest();
			setIsTesting(true);

			const currentInputDeviceId = inputDeviceIdRef.current;
			const currentMicVolume = micVolumeRef.current;

			const constraints: MediaStreamConstraints = {
				audio: currentInputDeviceId ? { deviceId: { exact: currentInputDeviceId } } : true,
				video: false
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;

			const source = audioContext.createMediaStreamSource(stream);
			const gain = audioContext.createGain();
			gain.gain.value = currentMicVolume;

			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			analyserRef.current = analyser;

			const dest = audioContext.createMediaStreamDestination();

			source.connect(gain);
			gain.connect(analyser);
			gain.connect(dest);

			startLevelMeter();

			// Live monitor: play mic audio immediately instead of waiting until stop.
			const audio = playbackAudioRef.current;
			if (audio) {
				playbackStreamRef.current = dest.stream;
				audio.srcObject = dest.stream;
				audio.volume = speakerVolumeRef.current;

				if (hasSetSinkId && outputDeviceIdRef.current) {
					try {
						await (audio as HTMLMediaElement & { setSinkId: (deviceId: string) => Promise<void> }).setSinkId(outputDeviceIdRef.current);
					} catch {
						// ignore and fallback to default output
					}
				}

				try {
					await audio.play();
				} catch {
					// ignore autoplay issues
				}
			}
		} catch (e) {
			console.error(e);
			setIsTesting(false);
			setTestError(t('setting:voice.errors.micPermission'));
			cleanupAudioGraph();
			stopStream();
		}
	}, [cleanupAudioGraph, hasSetSinkId, startLevelMeter, stopStream, stopTest, t]);

	useEffect(() => {
		return () => {
			stopTest();
		};
	}, [stopTest]);

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-6 text-theme-primary-active">{t('setting:voice.title')}</h1>

			<div className="rounded-lg bg-theme-setting-nav p-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
					<div className="space-y-4">
						<DeviceSelector
							devices={inputDevices}
							value={inputDeviceId}
							onChange={setInputDeviceId}
							label={t('setting:voice.microphone')}
							disabled={inputDevices.length === 0}
							t={t}
						/>
						<VolumeSlider value={micVolume} onChange={setMicVolume} label={t('setting:voice.microphoneVolume')} />
					</div>

					<div className="space-y-4">
						<DeviceSelector
							devices={outputDevices}
							value={outputDeviceId}
							onChange={setOutputDeviceId}
							label={t('setting:voice.speaker')}
							disabled={outputDevices.length === 0}
							t={t}
						/>
						<VolumeSlider value={speakerVolume} onChange={setSpeakerVolume} label={t('setting:voice.speakerVolume')} />
					</div>
				</div>

				<MicTest
					permissionState={permissionState}
					isTesting={isTesting}
					micLevel={micLevel}
					testError={testError}
					hasSetSinkId={hasSetSinkId}
					playbackAudioRef={playbackAudioRef}
					onStartTest={startTest}
					onStopTest={stopTest}
					t={t}
				/>
			</div>
		</div>
	);
};
