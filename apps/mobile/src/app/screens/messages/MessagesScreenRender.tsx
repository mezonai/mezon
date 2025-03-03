import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { DirectEntity, directActions, useAppDispatch } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { DeviceEventEmitter, Pressable, RefreshControl, View } from 'react-native';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import { DmListItem } from './DmListItem';
import MessageHeader from './MessageHeader';
import MessagesScreenEmpty from './MessagesScreenEmpty';
import SearchDmList from './SearchDmList';
import { style } from './styles';

const MessagesScreenRender = memo(({ chatList }: { chatList: string }) => {
	const dmGroupChatList: string[] = useMemo(() => JSON.parse(chatList || '[]'), [chatList]);
	const [refreshing, setRefreshing] = useState(false);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();

	const navigateToNewMessageScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_MESSAGE });
	};

	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		const data = {
			snapPoints: ['40%', '70%'],
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const handleRefresh = async () => {
		setRefreshing(true);
		dispatch(directActions.fetchDirectMessage({ noCache: true }));
		await sleep(500);
		setRefreshing(false);
	};

	return (
		<View style={styles.container}>
			<MessageHeader />
			<SearchDmList />
			{!dmGroupChatList?.length ? (
				<MessagesScreenEmpty />
			) : (
				<FlashList
					data={dmGroupChatList}
					contentContainerStyle={{
						paddingBottom: size.s_100
					}}
					removeClippedSubviews={true}
					decelerationRate={'fast'}
					showsVerticalScrollIndicator={false}
					keyExtractor={(dm) => dm + 'DM_MSG_ITEM'}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
					estimatedItemSize={size.s_60}
					renderItem={({ item }) => <DmListItem id={item} navigation={navigation} key={item} onLongPress={handleLongPress} />}
				/>
			)}

			<Pressable style={styles.addMessage} onPress={() => navigateToNewMessageScreen()}>
				<Icons.MessagePlusIcon width={size.s_22} height={size.s_22} />
			</Pressable>
		</View>
	);
});

export default MessagesScreenRender;
