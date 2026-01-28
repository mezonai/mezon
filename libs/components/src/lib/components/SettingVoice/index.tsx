import { requestMediaPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const rafRef = useRef<number | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<BlobPart[]>([]);
	const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

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

		// Remove "System Default" option: normalize selection to a real device if possible
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
		// request mic permission so that device labels are available
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

	const inputOptions = useMemo(() => {
		return inputDevices.map((d) => ({
			id: d.deviceId,
			label: d.label || t('setting:voice.unnamedDevice')
		}));
	}, [inputDevices, t]);

	const outputOptions = useMemo(() => {
		return outputDevices.map((d) => ({
			id: d.deviceId,
			label: d.label || t('setting:voice.unnamedDevice')
		}));
	}, [outputDevices, t]);

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
			setMicLevel(clamp01(rms * 2.2)); // amplify visually
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
	}, []);

	const stopTest = useCallback(() => {
		setIsTesting(false);
		setTestError('');

		try {
			recorderRef.current?.stop();
		} catch {
			// ignore
		}
		recorderRef.current = null;
		chunksRef.current = [];

		cleanupAudioGraph();
		stopStream();
	}, [cleanupAudioGraph, stopStream]);

	const startTest = useCallback(async () => {
		setTestError('');
		setIsTesting(true);

		try {
			// Ensure old test is stopped
			stopTest();
			setIsTesting(true);

			const constraints: MediaStreamConstraints = {
				audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true,
				video: false
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;

			const source = audioContext.createMediaStreamSource(stream);
			const gain = audioContext.createGain();
			gain.gain.value = micVolume;

			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			analyserRef.current = analyser;

			const dest = audioContext.createMediaStreamDestination();

			source.connect(gain);
			gain.connect(analyser);
			gain.connect(dest);

			startLevelMeter();

			const recorder = new MediaRecorder(dest.stream);
			recorderRef.current = recorder;
			chunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
			};

			recorder.onstop = async () => {
				const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
				chunksRef.current = [];

				const url = URL.createObjectURL(blob);
				const audio = playbackAudioRef.current;
				if (!audio) return;
				audio.src = url;
				audio.volume = speakerVolume;

				// best-effort output device routing
				if (hasSetSinkId && outputDeviceId) {
					try {
						await (audio as HTMLMediaElement & { setSinkId: (deviceId: string) => Promise<void> }).setSinkId(outputDeviceId);
					} catch {
						// ignore and fallback to default output
					}
				}

				try {
					await audio.play();
				} catch {
					// ignore autoplay issues
				}
			};

			recorder.start();

			// Auto stop after 4s to mimic quick mic test
			window.setTimeout(() => {
				if (recorderRef.current && recorderRef.current.state === 'recording') {
					try {
						recorderRef.current.stop();
					} catch {
						// ignore
					}
				}
				setIsTesting(false);
				cleanupAudioGraph();
				stopStream();
			}, 4000);
		} catch (e) {
			console.error(e);
			setIsTesting(false);
			setTestError(t('setting:voice.errors.micPermission'));
			cleanupAudioGraph();
			stopStream();
		}
	}, [cleanupAudioGraph, hasSetSinkId, inputDeviceId, micVolume, outputDeviceId, speakerVolume, startLevelMeter, stopStream, stopTest, t]);

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-6 text-theme-primary-active">{t('setting:voice.title')}</h1>

			<div className="rounded-lg bg-theme-setting-nav p-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
					<div className="space-y-4">
						<div className="text-xs font-semibold uppercase text-theme-primary-active tracking-wide">{t('setting:voice.microphone')}</div>
						<select
							className="w-full rounded-md bg-theme-setting-primary border border-theme-primary px-3 py-2 text-sm"
							value={inputDeviceId}
							onChange={(e) => setInputDeviceId(e.target.value)}
							disabled={inputOptions.length === 0}
						>
							{inputOptions.length === 0 ? <option value="">{t('setting:voice.noDevices')}</option> : null}
							{inputOptions.map((o) => (
								<option key={o.id} value={o.id}>
									{o.label}
								</option>
							))}
						</select>

						<div className="text-xs font-semibold uppercase text-theme-primary-active tracking-wide">
							{t('setting:voice.microphoneVolume')}
						</div>
						<div className="flex items-center gap-3">
							<input
								type="range"
								min={0}
								max={100}
								value={Math.round(micVolume * 100)}
								onChange={(e) => setMicVolume(clamp01(Number(e.target.value) / 100))}
								className="w-full"
							/>
							<div className="w-10 text-right text-xs text-theme-primary-hover">{Math.round(micVolume * 100)}%</div>
						</div>
					</div>

					<div className="space-y-4">
						<div className="text-xs font-semibold uppercase text-theme-primary-active tracking-wide">{t('setting:voice.speaker')}</div>
						<select
							className="w-full rounded-md bg-theme-setting-primary border border-theme-primary px-3 py-2 text-sm"
							value={outputDeviceId}
							onChange={(e) => setOutputDeviceId(e.target.value)}
							disabled={outputOptions.length === 0}
						>
							{outputOptions.length === 0 ? <option value="">{t('setting:voice.noDevices')}</option> : null}
							{outputOptions.map((o) => (
								<option key={o.id} value={o.id}>
									{o.label}
								</option>
							))}
						</select>

						<div className="text-xs font-semibold uppercase text-theme-primary-active tracking-wide">
							{t('setting:voice.speakerVolume')}
						</div>
						<div className="flex items-center gap-3">
							<input
								type="range"
								min={0}
								max={100}
								value={Math.round(speakerVolume * 100)}
								onChange={(e) => setSpeakerVolume(clamp01(Number(e.target.value) / 100))}
								className="w-full"
							/>
							<div className="w-10 text-right text-xs text-theme-primary-hover">{Math.round(speakerVolume * 100)}%</div>
						</div>
					</div>
				</div>

				<div className="mt-6 border-t border-theme-primary ">
					<div className="p-2">
						<div className="text-xs font-semibold uppercase text-theme-primary-active tracking-wide mb-2">
							{t('setting:voice.micTest.title')}
						</div>
						<p className="text-xs text-theme-primary-hover mb-3">{t('setting:voice.micTest.description')}</p>

						{permissionState === 'denied' && (
							<div className="text-xs text-red-500 mb-3">{t('setting:voice.errors.permissionDenied')}</div>
						)}
						{testError && <div className="text-xs text-red-500 mb-3">{testError}</div>}

						<div className="flex items-center gap-3">
							<button
								className="btn-primary btn-primary-hover h-fit px-4 py-2 rounded-lg cursor-pointer w-fit text-center disabled:opacity-50"
								onClick={() => (isTesting ? stopTest() : void startTest())}
								disabled={permissionState === 'denied'}
							>
								{isTesting ? t('setting:voice.micTest.stop') : t('setting:voice.micTest.letsCheck')}
							</button>

							<div className="flex-1">
								<div className="h-2 rounded bg-theme-setting-primary overflow-hidden border border-theme-primary">
									<div
										className="h-full bg-blue-500 transition-[width] duration-75"
										style={{ width: `${Math.round(micLevel * 100)}%` }}
									/>
								</div>
							</div>
						</div>

						{/* hidden audio element for playback routing */}
						<audio ref={playbackAudioRef} className="hidden" />

						{!hasSetSinkId && (
							<div className="mt-2 text-[11px] text-theme-primary-hover">{t('setting:voice.warnings.outputNotSupported')}</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
