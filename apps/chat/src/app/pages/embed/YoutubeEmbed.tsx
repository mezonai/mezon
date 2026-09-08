import { extractYouTubeStartSeconds, youtubeVideoIdFromLink } from '@mezon/utils';
import { useEffect, useMemo } from 'react';

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Public player page for a YouTube channel app: `/embed/youtube?v=<id>[&t=<seconds>]`.
 *
 * The route takes no session, so it works from a desktop browser window as well as
 * from a chat tab. `v` is validated against the YouTube id shape before it reaches
 * the iframe src — this page renders whatever a stranger puts in the query string.
 *
 * It reads the query string off `window.location` rather than through the router:
 * `AppWrapper` mounts it before the store and the router exist, so that a video
 * window never opens a second socket for the account (see app.tsx).
 */
export default function YoutubeEmbed() {
	const searchParams = useMemo(() => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search), []);

	const videoId = useMemo(() => {
		const fromParam = searchParams.get('v')?.trim() ?? '';
		if (VIDEO_ID_REGEX.test(fromParam)) {
			return fromParam;
		}
		return youtubeVideoIdFromLink(searchParams.get('url') ?? '');
	}, [searchParams]);

	const start = useMemo(() => {
		const raw = searchParams.get('t')?.trim() ?? '';
		if (/^\d+$/.test(raw)) {
			return Number(raw);
		}
		return extractYouTubeStartSeconds(searchParams.get('url') ?? '');
	}, [searchParams]);

	useEffect(() => {
		document.title = 'Mezon';
	}, []);

	if (!videoId) {
		return (
			<div className="w-screen h-screen flex items-center justify-center bg-black text-white">
				<p className="text-base opacity-80">This link does not point to a YouTube video.</p>
			</div>
		);
	}

	const embedParams = new URLSearchParams({
		autoplay: '1',
		rel: '0',
		playsinline: '1'
	});
	if (start > 0) {
		embedParams.set('start', String(start));
	}

	return (
		<div className="w-screen h-screen bg-black">
			<iframe
				className="w-full h-full border-0"
				src={`https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`}
				title="YouTube video player"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
				referrerPolicy="strict-origin-when-cross-origin"
				allowFullScreen
			/>
		</div>
	);
}
