import {
	getPreferredInputDeviceId,
	getPreferredOutputDeviceId,
	requestMediaPermission,
	setPreferredInputDeviceId,
	setPreferredOutputDeviceId
} from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceSelector } from './DeviceSelector';
import { MicTest, useMicTest } from './MicTest';
import { NoiseSuppressionControl } from './NoiseSuppressionControl';
import { VolumeSlider } from './VolumeSlider';

const LS_KEYS = {
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
	noiseSuppressionEnabled?: boolean;
}

export const SettingVoice = ({ menuIsOpen, noiseSuppressionEnabled = false }: ISettingVoiceProps) => {
	const { t } = useTranslation(['setting']);
	const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(noiseSuppressionEnabled);
	const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');

	const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
	const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

	const [inputDeviceId, setInputDeviceId] = useState<string>(getPreferredInputDeviceId);
	const [outputDeviceId, setOutputDeviceId] = useState<string>(getPreferredOutputDeviceId);
	const [micVolume, setMicVolume] = useState<number>(() => clamp01(safeParseNumber(localStorage.getItem(LS_KEYS.micVolume), 0.8)));
	const [speakerVolume, setSpeakerVolume] = useState<number>(() => clamp01(safeParseNumber(localStorage.getItem(LS_KEYS.speakerVolume), 0.6)));

	const [micLevel, setMicLevel] = useState<number>(0);

	const outputDeviceIdRef = useRef<string>(outputDeviceId);
	useEffect(() => {
		outputDeviceIdRef.current = outputDeviceId;
	}, [outputDeviceId]);

	const { isTesting, testError, hasSetSinkId, playbackAudioRef, startTest, stopTest, getInputTrack } = useMicTest({
		inputDeviceId,
		outputDeviceId,
		micVolume,
		speakerVolume,
		noiseSuppressionEnabled: isNoiseSuppressionEnabled,
		onLevel: setMicLevel
	});

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

		const previousOutputId = outputDeviceIdRef.current;
		const nextOutputId =
			nextOutputs.length === 0
				? ''
				: nextOutputs.some((d) => d.deviceId === previousOutputId)
					? previousOutputId
					: nextOutputs[0]?.deviceId || '';
		setOutputDeviceId(nextOutputId);
		if (nextOutputId !== previousOutputId) {
			setPreferredOutputDeviceId(nextOutputId || 'default');
		}
	}, []);

	useEffect(() => {
		(async () => {
			const status = await requestMediaPermission('audio');
			setPermissionState(status === 'granted' ? 'granted' : 'denied');
			await refreshDevices();
		})().catch(() => {
			setPermissionState('denied');
		});
	}, []);

	useEffect(() => {
		const handler = () => refreshDevices().catch(() => undefined);
		navigator.mediaDevices?.addEventListener?.('devicechange', handler);
		return () => {
			navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
		};
	}, []);

	useEffect(() => {
		setPreferredInputDeviceId(inputDeviceId);
		localStorage.setItem(LS_KEYS.micVolume, String(micVolume));
		localStorage.setItem(LS_KEYS.speakerVolume, String(speakerVolume));
	}, [inputDeviceId, micVolume, speakerVolume]);

	const handleOutputDeviceChange = useCallback((deviceId: string) => {
		setOutputDeviceId(deviceId);
		setPreferredOutputDeviceId(deviceId);
	}, []);

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
							onChange={handleOutputDeviceChange}
							label={t('setting:voice.speaker')}
							disabled={outputDevices.length === 0}
							t={t}
						/>
						<VolumeSlider value={speakerVolume} onChange={setSpeakerVolume} label={t('setting:voice.speakerVolume')} />
					</div>
				</div>
				<NoiseSuppressionControl
					className="mt-4"
					noiseSuppressionEnabled={isNoiseSuppressionEnabled}
					onNoiseSuppressionEnabledChange={setIsNoiseSuppressionEnabled}
					isTesting={isTesting}
					getInputTrack={getInputTrack}
				/>

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
