import { ListChannelSetting } from '@mezon/components';
import {
	ETypeFetchChannelSetting,
	channelSettingActions,
	selectAllChannelSuggestion,
	selectCurrentClanId,
	selectListChannelBySearch,
	selectNumberChannelCount,
	useAppDispatch
} from '@mezon/store';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';

const ChannelSetting = () => {
	const [searchFilter, setSearchFilter] = useState('');
	const listChannel = useSelector(selectAllChannelSuggestion);
	const listChannelSearch = useSelector(selectListChannelBySearch);
	const countChannel = useSelector(selectNumberChannelCount);
	const dispatch = useAppDispatch();
	const selectClanId = useSelector(selectCurrentClanId);

	const handleSearchByNameChannel = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchFilter(e.target.value);
		debouncedSearchChannel(e.target.value);
	};

	const debouncedSearchChannel = useDebouncedCallback(async (value: string) => {
		await dispatch(
			channelSettingActions.fetchChannelSettingInClan({
				clanId: selectClanId as string,
				parentId: '',
				typeFetch: ETypeFetchChannelSetting.SEARCH_CHANNEL,
				keyword: value
			})
		);
	}, 300);

	const listChannelBySearch = useMemo(() => {
		if (searchFilter) {
			return listChannelSearch;
		}
		return listChannel;
	}, [listChannelSearch, listChannel]);

	useEffect(() => {
		async function fetchListChannel() {
			await dispatch(
				channelSettingActions.fetchChannelSettingInClan({
					clanId: selectClanId as string,
					parentId: '0',
					typeFetch: ETypeFetchChannelSetting.FETCH_CHANNEL
				})
			);
		}
		fetchListChannel();
	}, []);

	return (
		<div className="p-8 h-[calc(100vh_-_56px)] flex flex-col">
			<div className="p-2 flex items-center justify-between text-textLightTheme dark:text-textDarkTheme">
				<div className="flex items-center gap-2">
					<input
						type="text"
						value={searchFilter}
						placeholder="Search"
						onChange={handleSearchByNameChannel}
						className="w-full h-8 pl-2 pr-2 py-3 dark:bg-bgTertiary bg-bgLightTertiary rounded items-center inline-flex outline-none focus:outline-none"
					/>
				</div>
			</div>
			<ListChannelSetting
				listChannel={listChannelBySearch}
				clanId={selectClanId as string}
				countChannel={countChannel}
				searchFilter={searchFilter}
			/>
		</div>
	);
};
export default ChannelSetting;
