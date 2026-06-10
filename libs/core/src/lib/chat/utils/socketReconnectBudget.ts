export const MIN_NETWORK_PROBE_INTERVAL_MS = 4000;

export const MAX_RECONNECT_ATTEMPTS_PER_WAVE = 5;

export const MAX_RECONNECT_WAVES_BEFORE_LOGOUT = 5;

let waveConnectAttempts = 0;
let reconnectWaveId = 0;
let lastNetworkProbeAt = 0;
let exhaustedWaveCount = 0;

export function getReconnectWaveAttempts(): number {
	return waveConnectAttempts;
}

export function getReconnectWaveId(): number {
	return reconnectWaveId;
}

function delayMs(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForNetworkProbeSlot(): Promise<void> {
	const elapsed = Date.now() - lastNetworkProbeAt;
	const waitMs = MIN_NETWORK_PROBE_INTERVAL_MS - elapsed;
	if (waitMs <= 0) {
		return;
	}
	await delayMs(waitMs);
}

export function markNetworkProbeCompleted(): void {
	lastNetworkProbeAt = Date.now();
}

export function beginReconnectWave(): void {
	reconnectWaveId += 1;
	waveConnectAttempts = 0;
	lastNetworkProbeAt = 0;
}

export function shouldProbeNetworkBeforeConnect(): boolean {
	return waveConnectAttempts >= 1;
}

export function consumeReconnectAttempt(): boolean {
	if (waveConnectAttempts >= MAX_RECONNECT_ATTEMPTS_PER_WAVE) {
		return false;
	}
	waveConnectAttempts += 1;
	return true;
}

export function refundReconnectAttempt(): void {
	if (waveConnectAttempts > 0) {
		waveConnectAttempts -= 1;
	}
}

export function noteReconnectWaveExhausted(): number {
	exhaustedWaveCount += 1;
	return exhaustedWaveCount;
}

export function resetExhaustedWaveCount(): void {
	exhaustedWaveCount = 0;
}

export function resetReconnectWave(): void {
	waveConnectAttempts = 0;
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('mezon:reconnect-wave-reset'));
	}
}

export const resetSocketReconnectBudget = resetReconnectWave;
