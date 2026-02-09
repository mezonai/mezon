import { referencesActions, selectCurrentChannelId, selectCurrentDmId, selectOgpPreview } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { isFacebookLink, isTikTokLink, isYouTubeLink } from '@mezon/utils';
import { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function PreviewOgp() {
	const ogpLink = useSelector(selectOgpPreview);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectCurrentDmId);
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{
		title: string;
		description: string;
		image: string;
	} | null>(null);

	useEffect(() => {
		if (!ogpLink || !ogpLink.url) {
			setData(null);
			dispatch(referencesActions.clearOgpData());
			setLoading(false);
			return;
		}

		const isSocialMediaLink = isYouTubeLink(ogpLink.url) || isFacebookLink(ogpLink.url) || isTikTokLink(ogpLink.url);
		if (isSocialMediaLink) {
			setData(null);
			dispatch(referencesActions.clearOgpData());
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		const { signal } = controller;

		const timeoutId = setTimeout(async () => {
			try {
				setLoading(true);
				const res = await fetch(`${process.env.NX_OGP_URL}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						url: ogpLink.url
					}),
					signal
				});

				if (!res.ok) {
					throw new Error(`HTTP error ${res.status}`);
				}

				const data = await res.json();
				setData(data);

				setLoading(false);
				dispatch(
					referencesActions.setOgpData({
						...ogpLink,
						image: data?.image || '',
						title: data?.title || '',
						description: data?.description || '',
						type: data?.type || ''
					})
				);
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.warn('Fetch OGP aborted');
					return;
				}
				console.error('Fetch OGP failed:', error);
				setLoading(false);
			}
		}, 750);

		return () => {
			clearTimeout(timeoutId);
			controller.abort();
		};
	}, [ogpLink?.url]);
	const clearOgpData = () => {
		dispatch(referencesActions.clearOgpData());
	};

	if (loading) {
		return (
			<div className="space-y-4 animate-pulse pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2">
				<div className="bg-item-theme rounded-lg border-theme-primary p-4 h-[84px] w-full">
					<div className="flex items-center gap-4 h-full">
						<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
							<div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!ogpLink || !data || (currentChannelId !== ogpLink?.channel_id && currentDmId !== ogpLink?.channel_id)) return null;
	return (
		<div className="px-3 pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2 relative">
			<div className="absolute top-2 right-2 p-1 cursor-pointer rounded-full hover:bg-red-400" onClick={clearOgpData}>
				<Icons.Close defaultSize="w-3 h-3 text-theme-primary" />
			</div>
			<div className="aspect-square rounded-md h-full flex items-center">
				<img
					src={data.image}
					className="h-full aspect-square object-cover rounded-md"
					onError={(e) => {
						e.currentTarget.src = '/assets/images/warning.svg';
						e.currentTarget.classList.add('opacity-30');
					}}
				/>
			</div>
			<div className="flex flex-col justify-center gap-2 flex-1 overflow-hidden">
				<h5 className="text-sm truncate font-semibold">{data.title}</h5>
				<p className="text-xs truncate">{data.description}</p>
			</div>
		</div>
	);
}

export default memo(PreviewOgp);
