import {
	channelsActions,
	selectCurrentClanId,
	selectListChannelRenderByClanId,
	selectLoadingStatus,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type ChannelListRenderListenerProps = {
	onTriggerScrollFlatList: () => void;
};

export const ChannelListRenderListener = ({ onTriggerScrollFlatList }: ChannelListRenderListenerProps) => {
	const currentClanId = useAppSelector(selectCurrentClanId);
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClanId));
	const fetchingChannelsStatus = useAppSelector(selectLoadingStatus);
	const dispatch = useAppDispatch();

	useFocusEffect(
		useCallback(() => {
			// Re-try call fetch channels when focus and list is empty
			if (currentClanId && (listChannelRender?.length === 1 || !listChannelRender?.length) && fetchingChannelsStatus !== 'loading') {
				dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true, isMobile: true }));
				onTriggerScrollFlatList();
			}
		}, [fetchingChannelsStatus])
	);

	return null;
};
