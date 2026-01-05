import {
	searchMessagesActions,
	selectAllMessageSearch,
	selectClanView,
	selectCurrentChannelId,
	selectCurrentPage,
	selectDmGroupCurrentId,
	selectMessageSearchByChannelId,
	selectSearchedRequestByChannelId,
	selectTotalResultSearchMessage,
	selectValueInputSearchMessage,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiSearchMessageRequest } from 'mezon-js/types';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useSearchMessages() {
	const dispatch = useAppDispatch();
	const isClanView = useSelector(selectClanView);
	const currentChannelId = useSelector(selectCurrentChannelId) as string;
	const currentDirectId = useSelector(selectDmGroupCurrentId) as string;
	const currentViewChannelId = isClanView ? currentChannelId : currentDirectId;

	const searchedRequest = useAppSelector((state) => selectSearchedRequestByChannelId(state, currentViewChannelId));

	const searchedChannelId = useMemo(() => {
		const channelIdFilter = searchedRequest?.filters?.find((f) => f.field_name === 'channelId');
		if (channelIdFilter?.field_value && channelIdFilter.field_value !== '0') {
			return channelIdFilter.field_value;
		}

		if (!isClanView && currentDirectId) {
			return currentDirectId;
		}

		const hasOtherFilters = searchedRequest?.filters?.some((f) => f.field_name !== 'content' && f.field_name !== 'channelId');

		if (hasOtherFilters) {
			return currentViewChannelId;
		}
		return '0';
	}, [searchedRequest, currentViewChannelId, isClanView, currentDirectId]);

	const searchMessages = useAppSelector((state) => selectAllMessageSearch(state, searchedChannelId));
	const totalResult = useAppSelector((state) => selectTotalResultSearchMessage(state, searchedChannelId));
	const currentPage = useAppSelector((state) => selectCurrentPage(state, currentViewChannelId));

	const messageSearchByChannelId = useAppSelector((state) => selectMessageSearchByChannelId(state, searchedChannelId));
	const valueSearchMessage = useSelector((state) => selectValueInputSearchMessage(state, currentViewChannelId ?? ''));

	const fetchSearchMessages = useCallback(
		async ({ filters, from, size, sorts }: ApiSearchMessageRequest) => {
			await dispatch(searchMessagesActions.fetchListSearchMessage({ filters, from, size, sorts }));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			fetchSearchMessages,
			searchMessages,
			messageSearchByChannelId,
			totalResult,
			currentPage,
			valueSearchMessage
		}),
		[fetchSearchMessages, searchMessages, messageSearchByChannelId, totalResult, currentPage, valueSearchMessage]
	);
}
