import { ListChannelSetting } from '@mezon/components';
import {
	ETypeFetchChannelSetting,
	channelSettingActions,
	selectAllChannelSuggestion,
	selectCurrentClanId,
	selectNumberChannelCount,
	useAppDispatch
} from '@mezon/store';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ChannelTopBar from './ChannelTopBar';

const fuzzyMatch = (text: string, pattern: string): boolean => {
	const normalizedText = text.toLowerCase();
	const normalizedPattern = pattern.toLowerCase().trim();
	if (!normalizedPattern) return true;
	if (normalizedText.includes(normalizedPattern)) return true;
	let j = 0;
	for (let i = 0; i < normalizedText.length && j < normalizedPattern.length; i++) {
		if (normalizedText[i] === normalizedPattern[j]) j++;
	}
	return j === normalizedPattern.length;
};

const ChannelSetting = () => {
	const [searchFilter, setSearchFilter] = useState('');
	const listChannel = useSelector(selectAllChannelSuggestion);
	const countChannel = useSelector(selectNumberChannelCount);
	const dispatch = useAppDispatch();
	const selectClanId = useSelector(selectCurrentClanId);
	const prevClanIdRef = useRef<string | null>(null);

	const handleSearchByNameChannel = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setSearchFilter(e.target.value);
	}, []);

	const fuzzyFilteredList = useMemo(() => {
		if (!searchFilter.trim()) return listChannel;
		return listChannel.filter((channel) => fuzzyMatch(channel.channel_label || '', searchFilter));
	}, [listChannel, searchFilter]);

	const displayCount = searchFilter.trim() ? fuzzyFilteredList.length : countChannel;

	useEffect(() => {
		if (selectClanId && prevClanIdRef.current && prevClanIdRef.current !== selectClanId) {
			setSearchFilter('');
			dispatch(channelSettingActions.resetChannelSettingState());
		}
		prevClanIdRef.current = selectClanId as string;
	}, [selectClanId, dispatch]);

	const fetchChannels = useCallback(async () => {
		if (!selectClanId) return;

		await dispatch(
			channelSettingActions.fetchChannelSettingInClan({
				clanId: selectClanId as string,
				parentId: '0',
				typeFetch: ETypeFetchChannelSetting.FETCH_CHANNEL,
				noCache: true,
				limit: 500
			})
		);
	}, [selectClanId, dispatch]);

	useEffect(() => {
		fetchChannels();
	}, [fetchChannels]);

	return (
		<div className="p-4 h-[calc(100vh_-_56px)] flex flex-col text-theme-primary ">
			<div className="flex items-center justify-between">
				<ChannelTopBar searchQuery={searchFilter} handleSearchChange={handleSearchByNameChannel} />
			</div>
			<ListChannelSetting
				listChannel={fuzzyFilteredList}
				clanId={selectClanId as string}
				countChannel={displayCount}
				searchFilter={searchFilter}
			/>
		</div>
	);
};
export default ChannelSetting;
