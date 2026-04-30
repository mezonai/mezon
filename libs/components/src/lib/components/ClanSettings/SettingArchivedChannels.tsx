import {
	channelSettingActions,
	channelsActions,
	selectArchivedChannels,
	selectCurrentClanId,
	threadsActions,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { getDateLocale } from '@mezon/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ApiChannelDescription } from 'mezon-js';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const SettingArchivedChannels = () => {
	const dispatch = useAppDispatch();
	const { t, i18n } = useTranslation('clanSettings', { keyPrefix: 'archivedChannels' });
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
			dispatch(
				toastActions.addToast({
					message: t('restoreSuccess'),
					type: 'success',
					autoClose: 3000
				})
			);
			dispatch(channelSettingActions.fetchArchivedChannelsInClan(currentClanId as string));
			dispatch(channelsActions.fetchChannels({ clanId: currentClanId as string, noCache: true }));
		} catch (error) {
			console.error('Failed to restore channel:', error);
		}
	};

	return (
		<div className="pt-2">
			<div className="text-base text-theme-primary mb-6 max-w-2xl">{t('description')}</div>
			{listArchivedChannel?.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-theme-primary opacity-60">
					<Icons.Hashtag defaultSize="w-12 h-12 mb-3" />
					<p className="text-base font-medium">{t('emptyState')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{listArchivedChannel?.map((ch: ApiChannelDescription) => {
						const archivedAgoText = ch.last_sent_message?.timestamp_seconds
							? formatDistanceToNow(Number(ch.last_sent_message.timestamp_seconds) * 1000, {
									addSuffix: true,
									locale: getDateLocale(i18n.language)
								})
							: '';

						const renderIcon = (ch: ApiChannelDescription) => {
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
										{t('archived')} {archivedAgoText}
									</div>
								</div>
								<button
									className="ml-4 px-5 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition"
									onClick={() => handleRestore(ch.channel_id ?? '')}
								>
									{t('restore')}
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default SettingArchivedChannels;
