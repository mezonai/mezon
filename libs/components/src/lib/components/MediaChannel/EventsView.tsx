import type { ChannelTimeline } from '@mezon/store';
import { channelMediaActions, selectChannelMediaByChannelId, selectChannelMediaLoadingStatus, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaImage } from './MediaImage';

const generateYearList = (): number[] => {
	const currentYear = new Date().getFullYear();
	const years: number[] = [];
	for (let y = currentYear; y >= currentYear - 5; y--) {
		years.push(y);
	}
	return years;
};

interface EventsViewProps {
	channelId: string;
	clanId: string;
	onBack: () => void;
	onNavigateToEventDetail: (event: ChannelTimeline) => void;
	onOpenCreate: () => void;
}

export function EventsView({ channelId, clanId, onBack, onNavigateToEventDetail, onOpenCreate }: EventsViewProps) {
	const { t } = useTranslation('channelCreator');
	const dispatch = useAppDispatch();
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const years = useMemo(() => generateYearList(), []);

	const events = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const loadingStatus = useAppSelector(selectChannelMediaLoadingStatus);
	const isLoading = loadingStatus === 'loading';

	const months = useMemo(() => (t('monthsShort', { returnObjects: true }) as string[]) || [], [t]);

	const formatDate = useCallback(
		(timestampSeconds: number) => {
			const date = new Date(timestampSeconds * 1000);
			const month = months[date.getMonth()];
			return {
				month,
				day: String(date.getDate()).padStart(2, '0'),
				year: String(date.getFullYear())
			};
		},
		[months]
	);

	useEffect(() => {
		if (clanId && channelId) {
			dispatch(
				channelMediaActions.fetchChannelMedia({
					clan_id: clanId,
					channel_id: channelId,
					year: selectedYear,
					limit: 50
				})
			);
		}
	}, [dispatch, clanId, channelId, selectedYear]);

	const getEventImages = useCallback((event: ChannelTimeline) => {
		return (event.preview_imgs || []).map((att) => att.thumbnail || att.file_url || '').filter(Boolean) as string[];
	}, []);

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-3 px-6 py-4 border-b-theme-primary">
				<button onClick={onBack} className="p-1 rounded-lg text-theme-primary text-theme-primary-hover transition-colors">
					<Icons.ArrowLeft defaultSize="w-5 h-5" />
				</button>
				<h2 className="text-lg font-bold text-theme-primary">{t('fields.familyEvents.title')}</h2>
			</div>

			<div className="flex gap-2 px-6 py-3 overflow-x-auto border-b-theme-primary">
				{years.map((year) => (
					<button
						key={year}
						onClick={() => setSelectedYear(year)}
						className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
							selectedYear === year ? 'btn-primary' : 'bg-theme-primary text-theme-secondary bg-item-hover-chat'
						}`}
					>
						{year}
					</button>
				))}
			</div>

			<div className="flex-1 overflow-y-auto messages-scroll">
				<div className="px-6 py-3">
					<h3 className="text-sm font-semibold text-theme-secondary">
						{t('fields.familyEvents.eventsIn')} {selectedYear}
					</h3>
				</div>

				{isLoading && events.length === 0 && (
					<div className="flex items-center justify-center py-10">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buttonPrimary" />
					</div>
				)}

				{!isLoading && events.length === 0 && (
					<div className="flex items-center justify-center py-10">
						<span className="text-theme-secondary">
							{t('fields.familyEvents.noEvents')} {selectedYear}
						</span>
					</div>
				)}

				<div className="px-6 space-y-4 pb-20">
					{events.map((event) => {
						const isSpecial = event.type === 1;
						const date = event.start_time_seconds ? formatDate(event.start_time_seconds) : null;
						const images = getEventImages(event);
						const isAlbum = images.length > 1;

						return (
							<button
								key={event.id}
								onClick={() => onNavigateToEventDetail(event)}
								className={`w-full text-left bg-theme-primary rounded-xl p-4 bg-item-hover-chat transition-colors cursor-pointer border-theme-primary ${isSpecial ? 'border-2 border-buttonPrimary/30' : ''}`}
							>
								<div className="flex items-center gap-2 mb-1">
									{isSpecial && (
										<span className="px-2 py-0.5 bg-buttonPrimary rounded text-[10px] font-bold text-white tracking-wider">
											{t('fields.mediaHighlights.special')}
										</span>
									)}
									{event.title && <h4 className="text-sm font-semibold text-theme-primary">{event.title}</h4>}
								</div>
								{event.description && <p className="text-xs text-theme-secondary mb-3 line-clamp-2">{event.description}</p>}

								{images.length > 0 && (
									<div className="mb-2">
										{isAlbum ? (
											<div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden max-w-xs">
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
												className="w-48 h-28 object-cover rounded-lg"
												loading="lazy"
												imgProxyOptions={{ width: 300, height: 200, resizeType: 'fill' }}
											/>
										)}
									</div>
								)}

								{date && (
									<div className="flex items-center gap-2 text-theme-secondary text-xs mt-2">
										<Icons.History className="w-3.5 h-3.5" />
										<span>
											{date.month} {date.day}, {date.year}
										</span>
									</div>
								)}

								{isAlbum && (
									<span className="text-xs text-buttonPrimary font-medium mt-2 block">{t('fields.mediaHighlights.viewAlbum')}</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
