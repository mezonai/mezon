import { useIdleRender } from '@mezon/core';
import { directActions, selectDirectsOpenlistOrder, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import MessagesScreenRender from './MessagesScreenRender';

const MessagesScreen = () => {
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const shouldRender = useIdleRender();

	const dispatch = useAppDispatch();

	useFocusEffect(
		useCallback(() => {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}, [dispatch])
	);

	if (!shouldRender) {
		return null;
	}

	return <MessagesScreenRender chatList={JSON.stringify(dmGroupChatList)} />;
};

export default MessagesScreen;
