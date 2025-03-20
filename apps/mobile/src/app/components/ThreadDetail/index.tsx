import { useThreads } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	RootState,
	ThreadsEntity,
	selectCurrentChannel,
	selectSearchedThreadResult,
	selectThreadsByParentChannelId,
	threadsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import { LIMIT, checkIsThread } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { APP_SCREEN, MenuThreadScreenProps } from '../../navigation/ScreenTypes';
import EmptyThread from './EmptyThread';
import GroupThread from './GroupThread';
import { SearchThreadsBar } from './SearchThread';
import SkeletonThread from './SkeletonThread/SkeletonThread';
import ThreadAddButton from './ThreadAddButton';
import ThreadItem from './ThreadItem';
import { getActiveThreads, getJoinedThreadsWithinLast30Days, getThreadsOlderThan30Days } from './helper';
import { style } from './styles';

type CreateThreadModalScreen = typeof APP_SCREEN.MENU_THREAD.CREATE_THREAD;
export default function CreateThreadModal({ navigation, route }: MenuThreadScreenProps<CreateThreadModalScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { channelThreads } = route.params || {};
	const { t } = useTranslation(['createThread']);
	const { setValueThread } = useThreads();
	const dispatch = useAppDispatch();
	navigation.setOptions({
		headerShown: true,
		headerTitle: t('threads'),
		headerTitleAlign: 'center',
		headerRight: () => <ThreadAddButton onPress={handleNavigateCreateForm} />
	});
	const [searchText, setSearchText] = useState('');
	const currentChannel = useSelector(selectCurrentChannel);
	const isThread = checkIsThread(currentChannel as ChannelsEntity);
	const loadingStatus = useSelector((state: RootState) => state?.threads?.loadingStatus);
	const isLoading = useMemo(() => ['loading']?.includes(loadingStatus), [loadingStatus]);
	const [page, setPage] = useState<number>(1);
	const [isNextDisabled, setIsNextDisabled] = useState<boolean>(false);
	const [isPaginationVisible, setIsPaginationVisible] = useState<boolean>(false);
	const threadFetched = useSelector((state) => selectThreadsByParentChannelId(state, currentChannel?.channel_id));
	const threadsSearched = useSelector((state) => selectSearchedThreadResult(state, currentChannel?.channel_id));
	const activeThreads = getActiveThreads(threadFetched);
	const joinedThreads = getJoinedThreadsWithinLast30Days(threadFetched);
	const oldThreads = getThreadsOlderThan30Days(threadFetched);
	const showThreadSearch = threadsSearched && threadsSearched?.length > 0 && searchText;
	const showThreadList = threadFetched?.length > 0 && !showThreadSearch;
	const noResultSearched = threadsSearched?.length === 0;
	const showEmpty = noResultSearched || threadFetched.length === 0;

	const fetchThreads = useCallback(
		async (currentPage: number) => {
			const body = {
				channelId: isThread ? (currentChannel?.parent_id ?? '') : (currentChannel?.channel_id ?? ''),
				clanId: currentChannel?.clan_id ?? '',
				page: currentPage,
				noCache: true
			};
			const response = await dispatch(threadsActions.fetchThreads(body)).unwrap();

			if (response?.length < LIMIT) {
				setIsNextDisabled(true);
			} else {
				setIsNextDisabled(false);
			}
			if (currentPage === 1 && response?.length < LIMIT) {
				setIsPaginationVisible(false);
			} else {
				setIsPaginationVisible(true);
			}
		},
		[currentChannel?.channel_id, currentChannel?.clan_id, currentChannel?.parent_id, dispatch, isThread]
	);

	useEffect(() => {
		fetchThreads(page);
	}, [fetchThreads, page]);

	const handleNavigateCreateForm = useCallback(() => {
		dispatch(threadsActions.setOpenThreadMessageState(false));
		setValueThread(null);
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
			screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL,
			params: {
				channelThreads
			}
		});
	}, [channelThreads, dispatch, navigation, setValueThread]);

	const debouncedSetSearchText = useCallback(
		(value) => {
			setSearchText(value);
			dispatch(threadsActions.setThreadInputSearch({ channelId: currentChannel?.channel_id, value }));
			dispatch(threadsActions.searchedThreads({ label: value, channelId: currentChannel?.channel_id ?? '' }));
			setPage(1);
		},
		[currentChannel?.channel_id, dispatch]
	);

	return (
		// TODO: MezonMenu??
		<View style={styles.createChannelContainer}>
			{isLoading ? (
				<SkeletonThread numberSkeleton={12} />
			) : showEmpty ? (
				<EmptyThread onPress={handleNavigateCreateForm} />
			) : (
				<View>
					<SearchThreadsBar onTextChanged={debouncedSetSearchText} />
					<ScrollView
						style={styles.scrollView}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingBottom: size.s_60, paddingTop: size.s_10 }}
					>
						{showThreadSearch && (
							<View>
								{threadsSearched?.length > 0 && (
									<GroupThread
										title={
											threadsSearched?.length > 1
												? `${threadsSearched?.length} ${t('searchThreads')}`
												: `${threadsSearched?.length} ${t('searchThread')}`
										}
									>
										{threadsSearched?.map((thread: ThreadsEntity) => (
											<ThreadItem thread={thread} key={`${thread.id}-joined-threads`} />
										))}
									</GroupThread>
								)}
							</View>
						)}
						{showThreadList && (
							<View>
								{joinedThreads?.length > 0 && (
									<GroupThread
										title={
											joinedThreads?.length > 1
												? `${joinedThreads?.length} ${t('joinedThreads')}`
												: `${joinedThreads?.length} ${t('joinedThread')}`
										}
									>
										{joinedThreads?.map((thread: ThreadsEntity) => (
											<ThreadItem thread={thread} key={`${thread.id}-joined-threads`} />
										))}
									</GroupThread>
								)}
								{activeThreads?.length > 0 && (
									<GroupThread
										title={
											activeThreads?.length > 1
												? `${activeThreads?.length} ${t('otherActiveThreads')}`
												: `${activeThreads?.length} ${t('otherActiveThread')}`
										}
									>
										{activeThreads?.map((thread: ThreadsEntity) => (
											<ThreadItem thread={thread} key={`${thread.id}-other-active-threads`} />
										))}
									</GroupThread>
								)}
								{oldThreads?.length > 0 && (
									<GroupThread
										title={
											oldThreads?.length > 1
												? `${oldThreads?.length} ${t('olderThreads')}`
												: `${oldThreads?.length} ${t('olderThread')}`
										}
									>
										{oldThreads?.map((thread: ThreadsEntity) => (
											<ThreadItem thread={thread} key={`${thread.id}-older-threads`} />
										))}
									</GroupThread>
								)}
							</View>
						)}
					</ScrollView>

					{isPaginationVisible && (
						<View style={styles.paginationContainer}>
							<TouchableOpacity
								style={[styles.paginationButton]}
								onPress={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
								disabled={page === 1}
							>
								<MaterialIcons style={page === 1 ? styles.disableButton : styles.normalButton} name="navigate-before" size={20} />
							</TouchableOpacity>
							<Text style={styles.textPage}>{page}</Text>
							<TouchableOpacity
								style={styles.paginationButton}
								onPress={() => setPage((prevPage) => prevPage + 1)}
								disabled={isNextDisabled}
							>
								<MaterialIcons style={isNextDisabled ? styles.disableButton : styles.normalButton} name="navigate-next" size={20} />
							</TouchableOpacity>
						</View>
					)}
				</View>
			)}
		</View>
	);
}
