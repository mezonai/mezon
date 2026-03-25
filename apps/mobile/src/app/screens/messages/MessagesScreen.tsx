import { AppStorage, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { acitvitiesActions, selectDirectMessageEntities, selectDirectOpenListIds, selectDmSort, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MessagesScreenRender from './MessagesScreenRender';

const getPinnedKey = () => `PINNED_DM_${load(STORAGE_MY_USER_ID) || ''}`;

const MessagesScreen = () => {
	const dmGroupChatList = useSelector(selectDmSort);
	const directEntities = useSelector(selectDirectMessageEntities);
	const defaultDirectList = useSelector(selectDirectOpenListIds);
	const dispatch = useAppDispatch();
	const [pinnedIds, setPinnedIds] = useState<string[]>(() => load(getPinnedKey()) || []);

	useFocusEffect(
		useCallback(() => {
			dispatch(acitvitiesActions.listActivities({ noCache: true }));
		}, [dispatch])
	);

	useEffect(() => {
		const listener = AppStorage.addOnValueChangedListener((key) => {
			if (key === getPinnedKey()) {
				setPinnedIds(load(getPinnedKey()) || []);
			}
		});
		return () => listener?.remove();
	}, []);

	const mergedList = useMemo(() => {
		if (!dmGroupChatList || dmGroupChatList.length === 0) {
			return defaultDirectList || [];
		}
		const sortedIds = new Set(dmGroupChatList);

		const sortedPart = dmGroupChatList;

		const remainingPart = defaultDirectList?.filter((id) => !sortedIds?.has(id));

		return [...(sortedPart || []), ...(remainingPart || [])];
	}, [dmGroupChatList, defaultDirectList]);

	const { pinned, unpinned } = useMemo(
		() => ({
			pinned: pinnedIds.filter((id) => mergedList?.includes(id) && !!directEntities?.[id]),
			unpinned: (mergedList ?? []).filter((id) => !pinnedIds.includes(id) && !!directEntities?.[id])
		}),
		[pinnedIds, mergedList, directEntities]
	);

	return <MessagesScreenRender pinnedList={JSON.stringify(pinned)} chatList={JSON.stringify(unpinned)} />;
};

export default MessagesScreen;
