import { captureSentryError } from '@mezon/logger';

type SeenMessagePayload = {
	messageId: string;
	channelId: string;
	channelLabel: string;
	clanId: string;
	messageCreatedAt: number;
	messageSeenAt?: number;
	mode: number;
};

class SeenMessagePool {
	private buffer: Record<string, SeenMessagePayload> = {};
	private knownSeenMessage: Record<string, SeenMessagePayload> = {};
	private interval?: NodeJS.Timeout;

	public addSeenMessage(payload: SeenMessagePayload): void {
		const { channelId, messageCreatedAt } = payload;
		const currentSeenPayload = this.buffer[channelId];
		if (!currentSeenPayload) {
			this.buffer[channelId] = payload;
			return;
		}

		if (messageCreatedAt > currentSeenPayload.messageCreatedAt) {
			this.buffer[channelId] = payload;
		}
	}

	public removeSeenMessage(channelId: string): void {
		delete this.buffer[channelId];
	}

	public popSeenMessage(remove?: boolean): SeenMessagePayload | null {
		const values = Object.values(this.buffer);

		if (values.length === 0) {
			return null;
		}

		const value = values.pop();

		if (!value) {
			return null;
		}

		if (remove) {
			this.removeSeenMessage(value.channelId);
		}

		return value;
	}

	updateKnownSeenMessage(payload: SeenMessagePayload): void {
		this.knownSeenMessage[payload.channelId] = payload;
	}

	isMessageAlreadySeen(payload: SeenMessagePayload): boolean {
		const { channelId, messageCreatedAt } = payload;
		const knownMessage = this.knownSeenMessage[channelId];

		if (!knownMessage) {
			return false;
		}

		return knownMessage.messageCreatedAt > messageCreatedAt;
	}

	public registerSeenMessageWorker(fn: (payload: SeenMessagePayload) => void, ms = 1000): void {
		this.interval = setInterval(async () => {
			const payload = this.popSeenMessage();

			if (!payload) {
				return;
			}

			if (this.isMessageAlreadySeen(payload)) {
				return;
			}

			try {
				await fn(payload);
				this.updateKnownSeenMessage(payload);
				this.removeSeenMessage(payload.channelId);
			} catch (error) {
				captureSentryError(error, 'registerSeenMessageWorker');
			}
		}, ms);
	}

	public unRegisterSeenMessageWorker(): void {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}
}

export const seenMessagePool = new SeenMessagePool();

export default SeenMessagePool;
