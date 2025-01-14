import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Icons } from '@mezon/mobile-components';
import { baseColor, Block, size, useTheme } from '@mezon/mobile-ui';
import { directActions, DirectEntity, RootState, selectAllFriends, selectDirectsOpenlistOrder, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonBottomSheet } from '../../componentUI';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import UserEmptyMessage from '../home/homedrawer/UserEmptyClan/UserEmptyMessage';
import { DmListItem } from './DmListItem';
import SearchDmList from './SearchDmList';
import { style } from './styles';

const FriendState = {
	PENDING: 2
};

const MessagesScreen = ({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const { t } = useTranslation(['dmMessage', 'common']);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
	const bottomSheetDMMessageRef = useRef<BottomSheetModal>(null);
	const friends = useSelector(selectAllFriends);

	const quantityPendingRequest = useMemo(() => {
		return friends?.filter((friend) => friend?.state === FriendState.PENDING)?.length || 0;
	}, [friends]);
	const dispatch = useAppDispatch();

	useFocusEffect(
		useCallback(() => {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}, [dispatch])
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handleAppStateChange = async (state: string) => {
		if (state === 'active') {
			try {
				await dispatch(directActions.fetchDirectMessage({ noCache: true }));
			} catch (error) {
				console.error('error messageLoaderBackground', error);
			}
		}
	};

	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	const navigateToNewMessageScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_MESSAGE });
	};

	const [directMessageSelected, setDirectMessageSelected] = useState<DirectEntity>(null);
	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		bottomSheetDMMessageRef.current?.present();
		setDirectMessageSelected(directMessage);
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.headerWrapper}>
				<Text style={styles.headerTitle}>{t('dmMessage:title')}</Text>
				<Pressable style={styles.addFriendWrapper} onPress={() => navigateToAddFriendScreen()}>
					<Icons.UserPlusIcon height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
					<Text style={styles.addFriendText}>{t('dmMessage:addFriend')}</Text>
					{!!quantityPendingRequest && (
						<Block
							backgroundColor={baseColor.redStrong}
							width={size.s_20}
							height={size.s_20}
							alignItems="center"
							justifyContent="center"
							borderRadius={size.s_20}
							position="absolute"
							right={-size.s_8}
							top={-size.s_8}
						>
							<Text style={styles.textQuantityPending}>{quantityPendingRequest}</Text>
						</Block>
					)}
				</Pressable>
			</View>
			<SearchDmList />
			{clansLoadingStatus === 'loaded' && !dmGroupChatList?.length ? (
				<UserEmptyMessage
					onPress={() => {
						navigateToAddFriendScreen();
					}}
				/>
			) : (
				<FlashList
					data={dmGroupChatList}
					contentContainerStyle={{
						paddingBottom: size.s_100
					}}
					showsVerticalScrollIndicator={false}
					keyExtractor={(dm) => dm + 'DM_MSG_ITEM'}
					estimatedItemSize={size.s_60}
					renderItem={({ item }) => <DmListItem id={item} navigation={navigation} key={item} onLongPress={handleLongPress} />}
				/>
			)}

			<Pressable style={styles.addMessage} onPress={() => navigateToNewMessageScreen()}>
				<Icons.MessagePlusIcon width={size.s_22} height={size.s_22} />
			</Pressable>

			<MezonBottomSheet ref={bottomSheetDMMessageRef} snapPoints={['40%', '60%']}>
				<MessageMenu messageInfo={directMessageSelected} />
			</MezonBottomSheet>
		</View>
	);
};

export default MessagesScreen;
