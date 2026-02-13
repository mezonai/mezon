import type { ChannelTimeline } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { LoadingStatus } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaImage } from './MediaImage';

interface TimelineViewProps {
	channelId: string;
	clanId: string;
	events: ChannelTimeline[];
	loadingStatus: LoadingStatus;
	onNavigateToEvents: () => void;
	onNavigateToEventDetail: (event: ChannelTimeline) => void;
	onOpenCreate: () => void;
}

export function TimelineView({ events, loadingStatus, onNavigateToEvents, onNavigateToEventDetail, onOpenCreate }: TimelineViewProps) {
	const { t } = useTranslation('channelCreator');
	const months = useMemo(() => (t('monthsShort', { returnObjects: true }) as string[]) || [], [t]);

	const formatEventDate = useCallback(
		(timestampSeconds: number) => {
			const date = new Date(timestampSeconds * 1000);
			return {
				month: months[date.getMonth()],
				day: String(date.getDate()).padStart(2, '0'),
				year: String(date.getFullYear())
			};
		},
		[months]
	);

	const getEventImages = useCallback((event: ChannelTimeline) => {
		return (event.preview_imgs || []).map((att) => att.thumbnail || att.file_url || '').filter(Boolean) as string[];
	}, []);

	const firstYear = useMemo(() => {
		if (!events.length) return '';
		const sorted = [...events].sort((a, b) => (a.start_time_seconds || 0) - (b.start_time_seconds || 0));
		const oldest = sorted[0];
		if (!oldest?.start_time_seconds) return '';
		return String(new Date(oldest.start_time_seconds * 1000).getFullYear());
	}, [events]);

	if (loadingStatus === 'loading' && events.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buttonPrimary" />
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 px-8">
				<div className="w-32 h-32 rounded-full bg-theme-primary flex items-center justify-center">
					<Icons.ImageThumbnail defaultSize="w-16 h-16" />
				</div>
				<h3 className="text-lg font-semibold text-theme-primary">{t('fields.mediaHighlights.emptyTitle')}</h3>
				<p className="text-sm text-theme-secondary text-center">{t('fields.mediaHighlights.emptyDescription')}</p>
				<button
					onClick={onOpenCreate}
					className="flex items-center gap-2 px-6 py-3 btn-primary btn-primary-hover rounded-lg font-medium transition-colors"
				>
					<Icons.PlusIcon defaultSize="w-5 h-5" />
					<span>{t('fields.mediaHighlights.createFirstMilestone')}</span>
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between px-6 py-4 border-b-theme-primary">
				<div>
					{firstYear && (
						<span className="text-xs font-bold text-buttonPrimary tracking-wider">
							{t('fields.mediaHighlights.since')} {firstYear}
						</span>
					)}
					<h2 className="text-xl font-bold text-theme-primary">{t('fields.mediaHighlights.eventsTitle')}</h2>
				</div>
				<button
					onClick={onNavigateToEvents}
					className="p-2 rounded-lg text-theme-primary text-theme-primary-hover transition-colors"
					title={t('fields.eventDetail.calendar')}
				>
					<Icons.BulletListIcon className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-4 messages-scroll">
				<div className="relative">
					<div className="absolute left-1/2 transform -translate-x-px top-0 bottom-0 w-0.5 bg-buttonPrimary/30" />

					{events.map((event, index) => {
						const isSpecial = event.type === 1;
						const position = index % 2 === 0 ? 'left' : 'right';
						const date = event.start_time_seconds ? formatEventDate(event.start_time_seconds) : null;
						const images = getEventImages(event);
						const isAlbum = images.length > 1;

						return (
							<div key={event.id} className="relative mb-8">
								<div className="absolute left-1/2 transform -translate-x-1.5 top-4 w-3 h-3 rounded-full bg-buttonPrimary border-2 border-theme-chat z-10" />

								{date && (
									<div
										className={`absolute top-2 ${position !== 'left' ? 'right-[calc(50%+20px)]' : 'left-[calc(50%+20px)]'} text-center`}
									>
										<div className="text-xs font-bold text-buttonPrimary">{date.month}</div>
										<div className="text-lg font-bold text-theme-primary">{date.day}</div>
										<div className="text-xs text-theme-secondary">{date.year}</div>
									</div>
								)}

								<div className={`w-[calc(50%-24px)] ${position === 'left' ? 'mr-auto' : 'ml-auto'}`}>
									<button
										onClick={() => onNavigateToEventDetail(event)}
										className={`w-full text-left bg-theme-primary rounded-xl p-4 bg-item-hover-chat transition-colors cursor-pointer border-theme-primary ${isSpecial ? 'border-2 border-buttonPrimary/30' : ''}`}
									>
										{isSpecial && (
											<div className="flex items-center gap-2 mb-2">
												<span className="px-2 py-0.5 bg-buttonPrimary rounded text-[10px] font-bold text-white tracking-wider">
													{t('fields.mediaHighlights.special')}
												</span>
											</div>
										)}
										{event.title && <h4 className="text-sm font-semibold text-theme-primary mb-1">{event.title}</h4>}
										{event.description && <p className="text-xs text-theme-secondary mb-3 line-clamp-2">{event.description}</p>}

										{images.length > 0 && (
											<div className="mb-2">
												{isAlbum ? (
													<div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
														{images.slice(0, 2).map((imgUrl, idx) => (
															<MediaImage
																key={idx}
																src={imgUrl}
																alt=""
																className="w-full h-20 object-cover"
																loading="lazy"
																imgProxyOptions={{ width: 150, height: 150, resizeType: 'fill' }}
															/>
														))}
													</div>
												) : (
													<MediaImage
														src={images[0]}
														alt=""
														className="w-full h-28 object-cover rounded-lg"
														loading="lazy"
														imgProxyOptions={{ width: 300, height: 200, resizeType: 'fill' }}
													/>
												)}
											</div>
										)}

										{isAlbum && (
											<span className="text-xs text-buttonPrimary font-medium">{t('fields.mediaHighlights.viewAlbum')}</span>
										)}
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<button
				onClick={onOpenCreate}
				className="fixed bottom-6 right-6 w-12 h-12 btn-primary btn-primary-hover rounded-full shadow-lg flex items-center justify-center transition-colors z-20"
			>
				<Icons.Plus defaultSize="w-6 h-6" />
			</button>
		</div>
	);
}
