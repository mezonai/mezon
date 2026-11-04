import { sinkIdForHtmlMediaElement } from '@mezon/utils';

type AudioContextWithSink = AudioContext & { setSinkId?: (sinkId: string) => Promise<void> };

export const USER_VOLUME_MAX = 150;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const resolveAudioVolume = (
	volume: number,
	sinkId: string | undefined,
	isContextSinkSupported: boolean
): { elementVolume: number; boost: number | null } => {
	if (volume <= 1) {
		return { elementVolume: clamp(volume, 0, 1), boost: null };
	}
	const isDefaultSink = sinkId === undefined || sinkId === '' || sinkId === 'default';
	if (isDefaultSink || isContextSinkSupported) {
		return { elementVolume: 1, boost: volume };
	}
	return { elementVolume: 1, boost: null };
};

let boostContext: AudioContext | null = null;
let boostRefCount = 0;

export const contextSinkSupported = (): boolean =>
	typeof AudioContext !== 'undefined' && typeof (AudioContext.prototype as AudioContextWithSink).setSinkId === 'function';

export const acquireBoostContext = (): AudioContext | null => {
	if (typeof AudioContext === 'undefined') {
		return null;
	}
	if (!boostContext || boostContext.state === 'closed') {
		boostRefCount = 0;
		try {
			boostContext = new AudioContext();
		} catch {
			boostContext = null;
			return null;
		}
	}
	boostRefCount += 1;
	if (boostContext.state === 'suspended') {
		void Promise.resolve(boostContext.resume()).catch(() => undefined);
	}
	return boostContext;
};

export const releaseBoostContext = (): void => {
	if (boostRefCount <= 0) {
		return;
	}
	boostRefCount -= 1;
	if (boostRefCount === 0 && boostContext && boostContext.state !== 'closed') {
		void Promise.resolve(boostContext.suspend()).catch(() => undefined);
	}
};

export const applyBoostSink = async (ctx: AudioContext, sinkId: string | undefined): Promise<void> => {
	const ctxWithSink = ctx as AudioContextWithSink;
	if (typeof ctxWithSink.setSinkId !== 'function') return;
	try {
		await ctxWithSink.setSinkId(sinkIdForHtmlMediaElement(sinkId ?? 'default'));
	} catch (err: unknown) {
		console.warn('[MezonSFU] failed to setSinkId on AudioContext', err);
	}
};
