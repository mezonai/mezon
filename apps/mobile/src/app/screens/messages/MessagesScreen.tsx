import { directActions, selectDirectsOpenlistOrder, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import MessagesScreenRender from './MessagesScreenRender';

const MessagesScreen = () => {
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);

	const dispatch = useAppDispatch();

	useFocusEffect(
		useCallback(() => {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}, [dispatch])
	);

	return <MessagesScreenRender chatList={JSON.stringify(dmGroupChatList)} />;
};

export default MessagesScreen;
