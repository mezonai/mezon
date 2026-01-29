import { referencesActions, selectCurrentChannelId, selectOgpPreview } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function PreviewOgp() {
	const ogpLink = useSelector(selectOgpPreview);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{
		title: string;
		description: string;
		image: string;
	} | null>(null);

	useEffect(() => {
		if (!ogpLink || !ogpLink.url) {
			dispatch(referencesActions.clearOgpData());
			return;
		}

		const controller = new AbortController();
		const { signal } = controller;

		const timeoutId = setTimeout(async () => {
			try {
				setLoading(true);
				const res = await fetch('https://ogp.mezon.ai/ogp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						url: ogpLink
					}),
					signal
				});

				if (!res.ok) {
					throw new Error(`HTTP error ${res.status}`);
				}

				const data = await res.json();
				setData(data);
				dispatch(
					referencesActions.setOgpData({
						...ogpLink,
						image: data?.image || '',
						title: data?.title || '',
						description: data?.description || ''
					})
				);
				setLoading(false);
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.warn('Fetch OGP aborted');
					return;
				}
				console.error('Fetch OGP failed:', error);
			}
		}, 2000);

		return () => {
			clearTimeout(timeoutId);
			controller.abort();
		};
	}, [ogpLink?.url]);

	if (!ogpLink || !data || currentChannelId !== ogpLink.channel_id) return null;
	return (
		<div
			className="px-3 pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2"
			data-e2e={generateE2eId('mention.selected_file')}
		>
			{loading ? (
				<Icons.LoadingSpinner className={`!w-10 !h-10`} />
			) : (
				<>
					<div className="aspect-square rounded-md h-full flex items-center">
						<img src={data.image} className="h-full aspect-square" />
					</div>
					<div className="flex flex-col justify-center gap-2 flex-1 overflow-hidden">
						<h5 className="text-sm truncate font-semibold">{data.title}</h5>
						<p className="text-xs truncate">{data.description}</p>
					</div>
				</>
			)}
		</div>
	);
}

export default memo(PreviewOgp);
