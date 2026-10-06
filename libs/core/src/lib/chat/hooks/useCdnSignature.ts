import {
	cdnSignatureActions,
	selectCdnSignatureByChannelId,
	selectCdnSignatureExpiresAt,
	selectIsCdnSignaturePending,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { appendCdnSignature, needsCdnSignature } from '@mezon/utils';
import { useEffect, useMemo } from 'react';

/**
 * The CDN signature of a channel. Opening the channel already requests it; this
 * also covers media shown outside the open channel (search, threads, viewers)
 * and asks for a fresh one once the cached signature expires. `isPending` stays
 * true until the first request settles, so CDN media is not requested unsigned.
 */
export function useCdnSignature(channelId?: string): { signature?: string; isPending: boolean } {
	const dispatch = useAppDispatch();
	const signature = useAppSelector((state) => selectCdnSignatureByChannelId(state, channelId));
	const expiresAt = useAppSelector((state) => selectCdnSignatureExpiresAt(state, channelId));
	const isPending = useAppSelector((state) => selectIsCdnSignaturePending(state, channelId));

	useEffect(() => {
		if (!channelId || channelId === '0') return;
		// No request goes out while the cached signature is still valid.
		dispatch(cdnSignatureActions.fetchCdnSignature({ channelId }));
		if (!expiresAt) return;

		const timeout = setTimeout(() => dispatch(cdnSignatureActions.fetchCdnSignature({ channelId })), Math.max(0, expiresAt - Date.now()));
		return () => clearTimeout(timeout);
	}, [channelId, expiresAt, dispatch]);

	return { signature, isPending };
}

/**
 * `signCdnUrl` turns a CDN url of `channelId` into `<cdn url>?<signature>`; other urls are returned as is.
 * `isAwaitingSignature` is true for a CDN url whose signature has not arrived yet: hold the request.
 */
export function useCdnUrlSigner(channelId?: string) {
	const { signature, isPending } = useCdnSignature(channelId);
	return useMemo(
		() => ({
			signCdnUrl: <T extends string | undefined>(url: T) => appendCdnSignature(url, signature) as T,
			isAwaitingSignature: (url?: string) => isPending && needsCdnSignature(url)
		}),
		[signature, isPending]
	);
}
