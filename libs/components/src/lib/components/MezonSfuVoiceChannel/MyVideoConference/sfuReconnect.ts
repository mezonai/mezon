export type SfuCloseAction = 'stop' | 'refresh-token' | 'reset-transport' | 'retry';

export const sfuCloseAction = (code: number): SfuCloseAction => {
	switch (code) {
		case 1000:
		case 4006:
		case 4011:
		case 4012:
			return 'stop';
		case 4003:
		case 4004:
		case 4005:
			return 'refresh-token';
		case 4013:
			return 'reset-transport';
		default:
			return 'retry'; // Includes 1001, 1006, 1011, 4001, 4008 and missing close frames.
	}
};

// Zero-based attempts; equal jitter gives 0.5–1 / 1–2 / 2–4 / 4–8 seconds.
export const sfuReconnectDelay = (attempt: number, jitter = Math.random()): number =>
	Math.floor(1000 * 2 ** Math.min(Math.max(attempt, 0), 3) * (0.5 + 0.5 * Math.min(Math.max(jitter, 0), 1)));
