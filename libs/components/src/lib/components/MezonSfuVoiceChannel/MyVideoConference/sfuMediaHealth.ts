type MicrophoneHealth = { micExpected: boolean; captureHealthy: boolean; senderHealthy: boolean };
type ReceiveProgress = { packets: number; samples?: number };
type StreamLoss = { packets: number; lost: number };
type LossWindow = { expected: number; lost: number };

const WEAK_NETWORK_WARNING_LOSS_RATIO = 0.1;
const WEAK_NETWORK_SEVERE_LOSS_RATIO = 0.2;
const WEAK_NETWORK_RECOVERY_LOSS_RATIO = 0.05;
const WEAK_NETWORK_MIN_PACKETS = 50;
const WEAK_NETWORK_WARNING_SAMPLES = 2;
const WEAK_NETWORK_CLEAR_SAMPLES = 2;

export class SfuNetworkQuality {
	private streams = new Map<string, StreamLoss>();
	private weak = false;
	private badSamples = 0;
	private cleanSamples = 0;

	isWeak(report: RTCStatsReport): boolean {
		const streams = new Map<string, StreamLoss>();
		const received: LossWindow = { expected: 0, lost: 0 };
		const sent: LossWindow = { expected: 0, lost: 0 };
		const statsById = new Map<string, { kind?: string; mediaType?: string; packetsSent?: number }>();
		report.forEach((stat) => statsById.set(stat.id, stat));
		report.forEach((stat) => {
			if (stat.type !== 'inbound-rtp' && stat.type !== 'remote-inbound-rtp') return;
			if (typeof stat.packetsLost !== 'number') return;
			const outbound = stat.type === 'remote-inbound-rtp' ? statsById.get(stat.localId) : undefined;
			const media = outbound ?? stat;
			if ((media.kind || media.mediaType) !== 'audio') return;
			const packets = stat.type === 'inbound-rtp' ? stat.packetsReceived : outbound?.packetsSent;
			if (typeof packets !== 'number') return;
			streams.set(stat.id, { packets, lost: stat.packetsLost });
			const previous = this.streams.get(stat.id);
			if (!previous) return;
			const lostDelta = Math.max(0, stat.packetsLost - previous.lost);
			const packetsDelta = Math.max(0, packets - previous.packets);
			const direction = outbound ? sent : received;
			direction.lost += lostDelta;
			direction.expected += outbound ? packetsDelta : packetsDelta + lostDelta;
		});
		this.streams = streams;
		const ratios = [received, sent].filter(({ expected }) => expected >= WEAK_NETWORK_MIN_PACKETS).map(({ expected, lost }) => lost / expected);
		if (!ratios.length) {
			this.badSamples = 0;
			this.cleanSamples = 0;
			return this.weak;
		}
		const lossRatio = Math.max(...ratios);
		this.badSamples = lossRatio >= WEAK_NETWORK_WARNING_LOSS_RATIO ? this.badSamples + 1 : 0;
		this.cleanSamples = lossRatio < WEAK_NETWORK_RECOVERY_LOSS_RATIO ? this.cleanSamples + 1 : 0;
		if (lossRatio >= WEAK_NETWORK_SEVERE_LOSS_RATIO || this.badSamples >= WEAK_NETWORK_WARNING_SAMPLES) this.weak = true;
		else if (this.cleanSamples >= WEAK_NETWORK_CLEAR_SAMPLES) this.weak = false;
		return this.weak;
	}
}

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
