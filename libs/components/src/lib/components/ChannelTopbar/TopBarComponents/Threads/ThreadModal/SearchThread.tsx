import { selectSearchedThreadLoadingStatus, selectThreadInputSearchByChannelId, threadsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';

type SearchThreadProps = {
	channelId: string;
};
const SearchThread = ({ channelId }: SearchThreadProps) => {
	const { t } = useTranslation('channelMenu');
	const dispatch = useAppDispatch();
	const statusSearching = useSelector(selectSearchedThreadLoadingStatus);
	const isLoading = statusSearching === 'loading';
	const inputSearchValue = useSelector((state) => selectThreadInputSearchByChannelId(state, channelId ?? ''));

	const handleTypingDebounced = useThrottledCallback(
		useCallback(
			(value: string) => {
				dispatch(threadsActions.searchedThreads({ label: value, channelId: channelId ?? '' }));
			},
			[dispatch]
		),
		500
	);
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			dispatch(threadsActions.setThreadInputSearch({ channelId, value }));
			handleTypingDebounced(value);
		},
		[dispatch, channelId, handleTypingDebounced]
	);

	return (
		<div className="relative">
			<div className="transition-all duration-300 w-56 h-6 pl-4 pr-2 py-3 bg-theme-input rounded items-center inline-flex">
				<input
					type="text"
					placeholder={t('menu.thread.searchThreads')}
					className="text-sm placeholder:text-sm outline-none bg-transparent w-full"
					onChange={handleChange}
					value={inputSearchValue}
				/>
			</div>
			<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1 bg-transparent top-1/2 transform -translate-y-1/2">
				{isLoading ? <Icons.LoadingSpinner /> : <Icons.Search />}
			</div>
		</div>
	);
};

export default SearchThread;
