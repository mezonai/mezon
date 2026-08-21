import { messagesActions, selectCurrentClanId, useAppDispatch, useAppSelector } from '@mezon/store';
import { PRESIGN_PENDING_MAX_AGE_SEC } from '@mezon/utils';
import { useEffect } from 'react';

/** How long a pending attachment is given before we suspect the update was lost. */
const FIRST_REFRESH_DELAY_MS = 15000;
/** Cadence afterwards. Cheap: one message, only while a row is actually stuck. */
const REFRESH_INTERVAL_MS = 15000;

type PresignRefreshArgs = {
	hasPresignPending: boolean;
	clanId?: string;
	/** Where the message entity lives in the store: a channel id, or a topic id. */
	bucketId?: string;
	/** The channel the request goes to; for a topic that is the PARENT channel. */
	parentChannelId?: string;
	messageId?: string;
	createTimeSeconds?: number;
};

/**
 * Heal a message whose attachments are stuck in the "uploading" state.
 *
 * The receiver leaves that state on a single realtime update carrying
 * presign_finish. When that one event is lost the row stays stuck until the
 * user reloads the page — which is exactly the bug users report. Re-read the
 * message instead, on a slow cadence and only while it is still pending.
 */
export function usePresignRefresh({ hasPresignPending, clanId, bucketId, parentChannelId, messageId, createTimeSeconds }: PresignRefreshArgs) {
	const dispatch = useAppDispatch();
	// Topic and thread rows do not always carry clan_id on the entity.
	const currentClanId = useAppSelector(selectCurrentClanId);

	useEffect(() => {
		const clan = clanId || currentClanId;
		if (!hasPresignPending || !messageId || !bucketId || !clan) return;

		// Topic messages are stored under the topic id but must be requested from
		// the parent channel, with the topic passed separately.
		const isTopic = Boolean(parentChannelId) && parentChannelId !== bucketId;
		const channelId = isTopic ? (parentChannelId as string) : bucketId;
		const topicId = isTopic ? bucketId : undefined;

		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;

		const ageMs = () => (createTimeSeconds ? Date.now() - createTimeSeconds * 1000 : 0);

		const run = () => {
			if (cancelled) return;
			// Past the expiry the attachment is dropped from the row entirely, so
			// there is nothing left to heal.
			if (ageMs() > PRESIGN_PENDING_MAX_AGE_SEC * 1000) return;
			dispatch(messagesActions.refreshPresignMessage({ clanId: clan, channelId, messageId, topicId }));
			timer = setTimeout(run, REFRESH_INTERVAL_MS);
		};

		// A message that is already older than the grace period — reopened channel,
		// restored tab — is checked straight away.
		timer = setTimeout(run, Math.max(0, FIRST_REFRESH_DELAY_MS - ageMs()));

		// A dropped socket is the most likely way to miss the update in the first
		// place, so do not wait out the cadence after one reconnects.
		const onReconnect = () => {
			if (timer) clearTimeout(timer);
			run();
		};
		window.addEventListener('mezon:socket-reconnect', onReconnect);

		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
			window.removeEventListener('mezon:socket-reconnect', onReconnect);
		};
	}, [hasPresignPending, clanId, currentClanId, bucketId, parentChannelId, messageId, createTimeSeconds, dispatch]);
}
