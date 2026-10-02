type MicrophoneHealth = { micExpected: boolean; captureHealthy: boolean; senderHealthy: boolean };
type ReceiveProgress = { packets: number; samples?: number };
type InboundLoss = { received: number; lost: number };

const WEAK_NETWORK_LOSS_RATIO = 0.05;
const WEAK_NETWORK_MIN_PACKETS = 50;
const WEAK_NETWORK_CLEAR_SAMPLES = 2;

export class SfuNetworkQuality {
	private inbound = new Map<string, InboundLoss>();
	private weak = false;
	private cleanSamples = 0;

	isWeak(report: RTCStatsReport): boolean {
		const inbound = new Map<string, InboundLoss>();
		let expected = 0;
		let lost = 0;
		report.forEach((stat) => {
			if (stat.type !== 'inbound-rtp' || typeof stat.packetsReceived !== 'number' || typeof stat.packetsLost !== 'number') return;
			inbound.set(stat.id, { received: stat.packetsReceived, lost: stat.packetsLost });
			const previous = this.inbound.get(stat.id);
			if (!previous) return;
			const lostDelta = Math.max(0, stat.packetsLost - previous.lost);
			lost += lostDelta;
			expected += lostDelta + Math.max(0, stat.packetsReceived - previous.received);
		});
		this.inbound = inbound;
		const lossy = expected >= WEAK_NETWORK_MIN_PACKETS && lost / expected >= WEAK_NETWORK_LOSS_RATIO;
		this.cleanSamples = lossy ? 0 : this.cleanSamples + 1;
		if (lossy) this.weak = true;
		else if (this.cleanSamples >= WEAK_NETWORK_CLEAR_SAMPLES) this.weak = false;
		return this.weak;
	}
}

// Silence, DTX, a locally muted microphone, or an idle remote participant are not failures.
// Require sustained evidence of a broken track or audio progressing on only one side of the pipeline.
export class SfuMediaHealth {
	private failures = new Map<string, number>();
	private receive = new Map<string, ReceiveProgress>();
	private sentPackets = 0;
	private sourceEnergy = 0;
	private sampled = false;

	check(report: RTCStatsReport, mic: MicrophoneHealth, now: number): string | undefined {
		const faults = new Map<string, string>();
		if (mic.micExpected && (!mic.captureHealthy || !mic.senderHealthy)) faults.set('mic', 'microphone_not_restored');
		let sentPackets = 0;
		let sourceEnergy = 0;
		const receive = new Map<string, ReceiveProgress>();
		report.forEach((stat) => {
			if ((stat.kind || stat.mediaType) !== 'audio') return;
			if (stat.type === 'media-source' && typeof stat.totalAudioEnergy === 'number') sourceEnergy += stat.totalAudioEnergy;
			if (stat.type === 'outbound-rtp' && typeof stat.packetsSent === 'number') sentPackets += stat.packetsSent;
			if (stat.type !== 'inbound-rtp' || typeof stat.packetsReceived !== 'number') return;
			const samples = typeof stat.totalSamplesReceived === 'number' ? stat.totalSamplesReceived : stat.totalSamplesDuration;
			const current = { packets: stat.packetsReceived, samples: typeof samples === 'number' ? samples : undefined };
			const previous = this.receive.get(stat.id);
			if (previous && current.packets > previous.packets && current.samples !== undefined && current.samples === previous.samples)
				faults.set(`receive:${stat.id}`, 'audio_decode_stalled');
			receive.set(stat.id, current);
		});
		if (this.sampled && mic.micExpected && sourceEnergy > this.sourceEnergy && sentPackets === this.sentPackets)
			faults.set('send', 'audio_send_stalled');
		this.receive = receive;
		this.sentPackets = sentPackets;
		this.sourceEnergy = sourceEnergy;
		this.sampled = true;
		for (const key of this.failures.keys()) if (!faults.has(key)) this.failures.delete(key);
		for (const [key, reason] of faults) {
			const since = this.failures.get(key) ?? now;
			this.failures.set(key, since);
			if (now - since >= 15_000) return reason;
		}
		return undefined;
	}
}
