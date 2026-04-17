import { channelSettingActions, channelsActions, selectArchivedChannels, selectCurrentClanId, threadsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const SettingArchivedChannels = () => {
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const listArchivedChannel = useSelector(selectArchivedChannels);

	useEffect(() => {
		if (currentClanId) {
			dispatch(channelSettingActions.fetchArchivedChannelsInClan(currentClanId as string));
		}
	}, [dispatch, currentClanId]);

	const handleRestore = async (channelId: string) => {
		if (!currentClanId) return;
		try {
			await dispatch(threadsActions.writeActiveArchivedThread({ clanId: currentClanId as string, channelId })).unwrap();
			dispatch(channelSettingActions.fetchArchivedChannelsInClan(currentClanId as string));
			dispatch(channelsActions.fetchChannels({ clanId: currentClanId as string, noCache: true }));
		} catch (error) {
			console.error('Failed to restore channel:', error);
		}
	};

	return (
		<div className="pt-2">
			<div className="text-base text-theme-primary mb-6 max-w-2xl">
				Restore channels to the sidebar to make them active again. Archived channels preserve all message history but are hidden from the
				primary navigation.
			</div>
			<div className="flex flex-col gap-3">
				{listArchivedChannel?.map((ch: any) => {
					const archivedAgoText = ch.last_sent_message?.timestamp_seconds
						? formatDistanceToNow(Number(ch.last_sent_message.timestamp_seconds) * 1000, { addSuffix: true })
						: '';

					const renderIcon = (ch: any) => {
						const isPrivate = ch.channel_private === 1;

						if (isPrivate) {
							return <Icons.HashtagLocked defaultSize="w-5 h-5 flex-shrink-0" />;
						}

						return <Icons.Hashtag defaultSize="w-5 h-5 flex-shrink-0" />;
					};

					return (
						<div key={ch.channel_id} className="flex items-center bg-item-theme rounded-lg px-4 py-3 shadow">
							<div className="flex items-center">
								<span className="inline-flex w-8 h-8 bg-item-theme-active text-theme-primary-active rounded items-center justify-center mr-2">
									{renderIcon(ch)}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-theme-primary text-base leading-tight">{ch.channel_label}</div>
								<div className="text-xs text-theme-primary mt-0.5">
									ARCHIVED {archivedAgoText} • {ch.count_mess_unread || 0}
								</div>
							</div>
							<button
								className="ml-4 px-5 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition"
								onClick={() => handleRestore(ch.channel_id)}
							>
								Restore
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SettingArchivedChannels;
