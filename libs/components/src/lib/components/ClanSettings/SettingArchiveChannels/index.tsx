import {
	fetchChannels,
	listChannelRenderAction,
	selectAllChannels,
	selectCurrentClanId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ThreadStatus } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ArchivedThreadItem = {
	id: string;
	label: string;
	parentId: string;
	parentLabel: string;
	thread: Record<string, unknown>;
};

const SettingArchiveChannels = () => {
	const { t } = useTranslation('clanSettings');
	const dispatch = useAppDispatch();
	const currentClanId = useAppSelector(selectCurrentClanId);
	const channelsList = useAppSelector(selectAllChannels);
	const threadsByChannel = useAppSelector((state) => state.threads?.byChannels ?? {});
	const fetchedParentChannelIdsRef = useRef<Set<string>>(new Set());
	const [unarchivingThreadIds, setUnarchivingThreadIds] = useState<Record<string, boolean>>({});

	const parentChannels = useMemo(() => {
		return channelsList.filter(
			(channel) =>
				channel.clan_id === currentClanId &&
				channel.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				(channel.parent_id === '0' || !channel.parent_id)
		);
	}, [channelsList, currentClanId]);

	useEffect(() => {
		if (!currentClanId) {
			return;
		}

		if (channelsList.length === 0) {
			dispatch(
				fetchChannels({
					clanId: currentClanId,
					channelType: ChannelType.CHANNEL_TYPE_CHANNEL
				})
			);
		}
	}, [channelsList.length, currentClanId, dispatch]);

	useEffect(() => {
		if (!currentClanId) {
			return;
		}

		for (const channel of parentChannels) {
			if (fetchedParentChannelIdsRef.current.has(channel.id)) {
				continue;
			}
			fetchedParentChannelIdsRef.current.add(channel.id);
			dispatch(
				threadsActions.fetchThreads({
					channelId: channel.id,
					clanId: currentClanId
				})
			);
		}
	}, [currentClanId, dispatch, parentChannels]);

	useEffect(() => {
		fetchedParentChannelIdsRef.current.clear();
	}, [currentClanId]);

	const archivedThreads = useMemo<ArchivedThreadItem[]>(() => {
		const result: ArchivedThreadItem[] = [];

		for (const parentChannel of parentChannels) {
			const threadState = threadsByChannel?.[parentChannel.id];
			if (!threadState?.ids || !threadState.entities) {
				continue;
			}

			const threads = threadState.ids
				.map((threadId) => threadState.entities[threadId])
				.filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));

			for (const thread of threads) {
				if (thread.clan_id !== currentClanId || thread.active !== 0) {
					continue;
				}

				result.push({
					id: thread.id,
					label: thread.channel_label || t('sidebar.items.archiveChannels'),
					parentId: parentChannel.id,
					parentLabel: parentChannel.channel_label || '',
					thread
				});
			}
		}

		return result;
	}, [currentClanId, parentChannels, t, threadsByChannel]);

	const handleUnarchiveThread = async (thread: ArchivedThreadItem) => {
		if (!currentClanId || unarchivingThreadIds[thread.id]) {
			return;
		}

		setUnarchivingThreadIds((prev) => ({ ...prev, [thread.id]: true }));
		try {
			await dispatch(
				threadsActions.writeActiveArchivedThread({
					clanId: currentClanId,
					channelId: thread.id
				})
			).unwrap();

			dispatch(
				listChannelRenderAction.addThreadToListRender({
					clanId: currentClanId,
					channel: {
						...thread.thread,
						id: thread.id,
						channel_id: thread.id,
						active: ThreadStatus.joined,
						parent_id: thread.parentId
					}
				})
			);
		} finally {
			setUnarchivingThreadIds((prev) => ({ ...prev, [thread.id]: false }));
		}
	};

	return (
		<div className="pb-8">
			<p className="text-sm text-theme-primary mb-4">{t('sidebar.items.archiveChannels')}</p>
			{archivedThreads.length === 0 ? (
				<div className="text-sm text-theme-primary">No archived threads.</div>
			) : (
				<div className="rounded-md border border-theme-primary overflow-hidden">
					{archivedThreads.map((thread) => (
						<div key={thread.id} className="flex items-center justify-between px-4 py-3 border-b border-theme-primary last:border-b-0">
							<div className="min-w-0">
								<p className="text-sm font-semibold truncate">{thread.label}</p>
								<p className="text-xs text-theme-primary truncate">#{thread.parentLabel}</p>
							</div>
							<button
								onClick={() => handleUnarchiveThread(thread)}
								disabled={Boolean(unarchivingThreadIds[thread.id])}
								className="text-xs px-3 py-1 rounded border border-theme-primary hover:bg-theme-setting-nav disabled:opacity-60"
							>
								{unarchivingThreadIds[thread.id] ? 'Unarchiving...' : 'Unarchive'}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default SettingArchiveChannels;
