import { cdnSignatureActions, selectCdnSignatureEntry, selectIsCdnSignaturePending, useAppDispatch, useAppSelector } from '@mezon/store';
import { appendCdnSignature, getCdnSignatureChannelId, parseSignedCdnMediaSrc } from '@mezon/utils';
import { useEffect, useMemo } from 'react';
import { shallowEqual } from 'react-redux';

export interface CdnUrlSigner {
	/** `<cdn url>?<signature>` for a CDN url passed to the hook; any other url comes back as it is. */
	signCdnUrl: <T extends string | undefined>(url: T) => T;
	/** True for a CDN url whose signature has not arrived yet: hold the request instead of loading it unsigned. */
	isAwaitingSignature: (url?: string) => boolean;
	/** True for a CDN url the server refuses to sign for this user: its file is in a private channel they are not in. */
	isSignatureDenied: (url?: string) => boolean;
}

/**
 * Signs each CDN url in `urls` with the signature of the channel its file was uploaded to, read from the url
 * itself, so a forwarded file or a topic reply is not signed with the channel showing it. Opening a channel already
 * requests that channel's signature; this requests the others and a fresh one once a cached signature expires.
 * Pass every url the component signs: a url missing from `urls` is left unsigned.
 */
export function useCdnUrlSigner(urls: ReadonlyArray<string | undefined>): CdnUrlSigner {
	const dispatch = useAppDispatch();
	const channelKey = useMemo(() => Array.from(new Set(urls.map(getCdnSignatureChannelId).filter(Boolean))).join(','), [urls]);
	const channelIds = useMemo(() => (channelKey ? channelKey.split(',') : []), [channelKey]);
	const entries = useAppSelector((state) => channelIds.map((channelId) => selectCdnSignatureEntry(state, channelId)), shallowEqual);
	const pending = useAppSelector((state) => channelIds.map((channelId) => selectIsCdnSignaturePending(state, channelId)), shallowEqual);
	const nextExpiresAt = Math.min(...entries.map((entry) => entry?.cache.expiresAt ?? Infinity));

	useEffect(() => {
		if (!channelIds.length) return;
		// No request goes out while the cached signature is still valid.
		const request = () => channelIds.forEach((channelId) => dispatch(cdnSignatureActions.fetchCdnSignature({ channelId })));
		request();
		if (!Number.isFinite(nextExpiresAt)) return;

		const timeout = setTimeout(request, Math.max(0, nextExpiresAt - Date.now()));
		return () => clearTimeout(timeout);
	}, [channelIds, nextExpiresAt, dispatch]);

	return useMemo(() => {
		const signatureByChannelId = new Map(channelIds.map((channelId, index) => [channelId, entries[index]?.signature || undefined]));
		const pendingChannelIds = new Set(channelIds.filter((_, index) => pending[index]));
		const deniedChannelIds = new Set(channelIds.filter((_, index) => entries[index]?.denied));
		return {
			signCdnUrl: <T extends string | undefined>(url: T) => {
				const channelId = getCdnSignatureChannelId(url);
				return (channelId ? appendCdnSignature(url, signatureByChannelId.get(channelId)) : url) as T;
			},
			isAwaitingSignature: (url?: string) => {
				const channelId = getCdnSignatureChannelId(url);
				return !!channelId && pendingChannelIds.has(channelId);
			},
			isSignatureDenied: (url?: string) => {
				const channelId = getCdnSignatureChannelId(url);
				return !!channelId && deniedChannelIds.has(channelId);
			}
		};
	}, [channelIds, entries, pending]);
}

/**
 * Asks for a new signature when the CDN refuses signed media, e.g. a signature it expired sooner than expected. Mount it
 * once for the app: it hears every media load error in the document. A file that still fails on a newer signature is
 * broken for another reason, such as a deleted file, and asks no more.
 */
export function useCdnSignatureRefreshOnMediaError() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		const firstFailedSignatureByUrl = new Map<string, string>();
		const onError = (event: Event) => {
			const target = event.target;
			let src: string | undefined;
			if (target instanceof HTMLSourceElement) src = target.src;
			else if (target instanceof HTMLImageElement || target instanceof HTMLMediaElement) src = target.currentSrc || target.src;
			const media = parseSignedCdnMediaSrc(src);
			if (!media) return;

			const firstFailedSignature = firstFailedSignatureByUrl.get(media.url);
			if (firstFailedSignature !== undefined && firstFailedSignature !== media.signature) return;
			firstFailedSignatureByUrl.set(media.url, media.signature);
			dispatch(cdnSignatureActions.fetchCdnSignature({ channelId: media.channelId, failedSignature: media.signature }));
		};

		// Load errors do not bubble, but the capture phase sees all of them.
		document.addEventListener('error', onError, true);
		return () => document.removeEventListener('error', onError, true);
	}, [dispatch]);
}
