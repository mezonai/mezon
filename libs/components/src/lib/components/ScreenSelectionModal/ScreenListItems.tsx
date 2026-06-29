import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ScreenItems from './ScreenItem';

type ScreenListItemsProp = {
	source: string;
	onClose: () => void;
	audio: boolean;
	onSelect?: (id: string) => void;
	selectedId?: string | null;
};
type ScreenItems = {
	id: string;
	name: string;
	thumbnail: string;
};

const ScreenItemSkeleton = memo(() => {
	return (
		<div className="flex flex-col rounded-lg border border-gray-200 dark:border-[#202225] bg-white dark:bg-[#2f3136] overflow-hidden animate-pulse">
			<div className="relative w-full aspect-video bg-gray-200 dark:bg-[#1E1F22] rounded-t-lg" />
			<div className="p-3 bg-white dark:bg-[#2f3136] rounded-b-lg">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
					<div className="h-3 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
				</div>
			</div>
		</div>
	);
});

ScreenItemSkeleton.displayName = 'ScreenItemSkeleton';

const ScreenListItems = memo(({ source, onClose, audio, onSelect, selectedId }: ScreenListItemsProp) => {
	const { t } = useTranslation('screenShare');
	const [visibleScreens, setVisibleScreens] = useState<ScreenItems[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	const getListScreen = useCallback(async () => {
		setIsLoading(true);
		setVisibleScreens([]);
		setTotalCount(0);
	}, []);

	const loadMore = useCallback(async () => {
		if (isLoading || !hasMore) return;

		setHasMore(false);
	}, [isLoading, hasMore]);

	useEffect(() => {
		if (!hasMore) return;

		const container = document.getElementById('screen-selection-scroll-container');
		if (!container) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			if (scrollTop + clientHeight >= scrollHeight * 0.8) {
				loadMore();
			}
		};

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, [hasMore, loadMore]);

	useEffect(() => {
		setVisibleScreens([]);
		setHasMore(false);
		setTotalCount(0);
	}, [source]);

	useEffect(() => {
		getListScreen();
	}, [getListScreen]);

	const skeletonCount = source === 'screen' ? 2 : 6;

	return (
		<div className="grid grid-cols-3 gap-4">
			{isLoading && visibleScreens.length === 0
				? Array.from({ length: skeletonCount }).map((_, index) => <ScreenItemSkeleton key={`skeleton-${index}`} />)
				: visibleScreens.map((screen) => (
						<ScreenItems
							key={screen.id}
							onClose={onClose}
							id={screen.id}
							name={screen.name}
							thumbnail={screen.thumbnail}
							audio={audio}
							onSelect={onSelect}
							isSelected={selectedId === screen.id}
						/>
					))}
			{isLoading && visibleScreens.length > 0 && (
				<div className="col-span-3 flex justify-center items-center py-4">
					<div className="text-sm text-gray-500 dark:text-gray-400">{t('loadingMore')}</div>
				</div>
			)}
			{hasMore && !isLoading && (
				<div className="col-span-3 flex justify-center items-center py-2">
					<button onClick={loadMore} className="text-sm text-theme-primary hover:text-theme-primary-hover font-medium transition-colors">
						{t('loadMore')} ({totalCount - visibleScreens.length} {t('remaining')})
					</button>
				</div>
			)}
		</div>
	);
});

export default ScreenListItems;
