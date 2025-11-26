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
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import ChannelTopBar from './ChannelTopBar';

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
	}, [listChannelSearch, listChannel, searchFilter]);
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
		<div className="p-4 h-[calc(100vh_-_56px)] flex flex-col text-theme-primary ">
			<div className="flex items-center justify-between">
				<ChannelTopBar searchQuery={searchFilter} handleSearchChange={handleSearchByNameChannel} />
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
