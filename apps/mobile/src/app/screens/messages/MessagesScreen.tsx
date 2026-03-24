import { AppStorage, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { acitvitiesActions, selectDirectMessageEntities, selectDmSort, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MessagesScreenRender from './MessagesScreenRender';

const getPinnedKey = () => `PINNED_DM_${load(STORAGE_MY_USER_ID) || ''}`;

const MessagesScreen = () => {
	const dmGroupChatList = useSelector(selectDmSort);
	const directEntities = useSelector(selectDirectMessageEntities);
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

	const { pinned, unpinned } = useMemo(
		() => ({
			pinned: pinnedIds.filter((id) => dmGroupChatList?.includes(id) && !!directEntities?.[id]),
			unpinned: (dmGroupChatList ?? []).filter((id) => !pinnedIds.includes(id) && !!directEntities?.[id])
		}),
		[pinnedIds, dmGroupChatList]
	);

	return <MessagesScreenRender pinnedList={JSON.stringify(pinned)} chatList={JSON.stringify(unpinned)} />;
};

export default MessagesScreen;
