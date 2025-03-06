import { load, save, STORAGE_CHANNEL_CURRENT_CACHE } from '@mezon/mobile-components';
import { RootState } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MessageItemSkeleton from '../../../../../components/Skeletons/MessageItemSkeleton';

interface IProps {
	channelId: string;
	isEmptyMsg: boolean;
}

export const ChannelMessageLoading = React.memo(({ channelId, isEmptyMsg }: IProps) => {
	const isLoading = useSelector((state: RootState) => state?.messages?.loadingStatus);

	const checkChannelCacheLoading = useMemo(() => {
		let isCached = false;
		const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];

		// have cached
		if (channelsCache?.includes(channelId)) {
			isCached = true;
		} else {
			save(STORAGE_CHANNEL_CURRENT_CACHE, [...channelsCache, channelId]);
		}
		return isCached;
	}, [channelId]);

	if (isLoading === 'loading' && !checkChannelCacheLoading && isEmptyMsg) {
		return <MessageItemSkeleton skeletonNumber={8} />;
	}

	return null;
});
