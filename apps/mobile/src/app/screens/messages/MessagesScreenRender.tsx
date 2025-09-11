import { size, useTheme } from '@mezon/mobile-ui';
import { acitvitiesActions, directActions, useAppDispatch } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { FlatList, Keyboard, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { DmListItem } from './DmListItem';
import MessageActivity from './MessageActivity';
import MessageHeader from './MessageHeader';
import MessagesScreenEmpty from './MessagesScreenEmpty';
import { style } from './styles';

const MessagesScreenRender = memo(({ chatList }: { chatList: string }) => {
	const dmGroupChatList: string[] = useMemo(() => {
		try {
			if (!chatList || typeof chatList !== 'string') {
				return [];
			}
			const parsed = JSON.parse(chatList);
			return Array.isArray(parsed) ? parsed : [];
		} catch (error) {
			console.error('Error parsing chat list:', error);
			return [];
		}
	}, [chatList]);
	const refreshingRef = useRef<boolean>(false);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();

	const navigateToNewMessageScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_MESSAGE });
	};

	const handleRefresh = async () => {
		refreshingRef.current = true;
		dispatch(directActions.fetchDirectMessage({ noCache: true }));
		dispatch(acitvitiesActions.listActivities({ noCache: true }));
		await sleep(500);
		refreshingRef.current = false;
	};

	const renderItem = useCallback(({ item }: { item: string }) => {
		return <DmListItem id={item} />;
	}, []);

	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<MessageHeader />
			<FlatList
				data={dmGroupChatList?.length > 0 ? dmGroupChatList : []}
				renderItem={renderItem}
				contentContainerStyle={{
					paddingBottom: size.s_100
				}}
				keyExtractor={(dm) => `${dm}DM_MSG_ITEM`}
				showsVerticalScrollIndicator={true}
				removeClippedSubviews={Platform.OS === 'android'}
				initialNumToRender={10}
				windowSize={2}
				onEndReachedThreshold={0.7}
				onMomentumScrollBegin={() => Keyboard.dismiss()}
				ListHeaderComponent={() => {
					return <MessageActivity />;
				}}
				keyboardShouldPersistTaps={'handled'}
				refreshControl={<RefreshControl refreshing={refreshingRef?.current} onRefresh={handleRefresh} />}
				disableVirtualization
				ListEmptyComponent={() => <MessagesScreenEmpty />}
			/>
			<Pressable style={styles.addMessage} onPress={() => navigateToNewMessageScreen()}>
				<MezonIconCDN icon={IconCDN.messagePlusIcon} width={size.s_22} height={size.s_22} />
			</Pressable>
		</View>
	);
});

export default MessagesScreenRender;
