import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	RootState,
	directActions,
	getStoreAsync,
	selectDirectsOpenlistOrder,
	selectDmGroupCurrentId,
	useAppDispatch
} from '@mezon/store-mobile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, DeviceEventEmitter, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { FriendsTablet } from '../friend/FriendsTablet';
import ProfileBar from '../home/homedrawer/ProfileBar';
import ServerList from '../home/homedrawer/ServerList';
import UserEmptyMessage from '../home/homedrawer/UserEmptyClan/UserEmptyMessage';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import { DirectMessageDetailTablet } from './DirectMessageDetailTablet';
import { DmListItem } from './DmListItem';
import { style } from './styles';

const MessagesScreenTablet = ({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const [searchText, setSearchText] = useState<string>('');
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const { t } = useTranslation(['dmMessage', 'common']);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
	const searchInputRef = useRef(null);
	const dispatch = useAppDispatch();
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handleAppStateChange = async (state: string) => {
		if (state === 'active') {
			try {
				const store = await getStoreAsync();
				await store.dispatch(directActions.fetchDirectMessage({ noCache: true }));
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

	const typingSearchDebounce = useThrottledCallback((text) => setSearchText(text), 500);

	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		const data = {
			snapPoints: ['40%', '70%'],
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const clearTextInput = () => {
		if (searchInputRef?.current) {
			searchInputRef.current.clear();
			setSearchText('');
		}
	};

	const handleFriendsPress = async () => {
		await dispatch(directActions.setDmGroupCurrentId(''));
	};

	return (
		<View style={styles.containerMessages}>
			<View style={styles.leftContainer}>
				<View style={styles.containerMessages}>
					<View>
						<ServerList />
					</View>

					<View style={styles.container}>
						<View style={styles.headerWrapper}>
							<Text style={styles.headerTitle}>{t('dmMessage:title')}</Text>
							<Pressable style={styles.addFriendWrapper} onPress={() => navigateToAddFriendScreen()}>
								<Icons.UserPlusIcon height={size.s_16} width={size.s_16} color={themeValue.textStrong} />
								<Text style={styles.addFriendText}>{t('dmMessage:addFriend')}</Text>
							</Pressable>
						</View>

						<View style={styles.searchMessage}>
							<Icons.MagnifyingIcon height={size.s_20} width={size.s_20} color={themeValue.text} />
							<TextInput
								ref={searchInputRef}
								placeholder={t('common:searchPlaceHolder')}
								placeholderTextColor={themeValue.text}
								style={styles.searchInput}
								onChangeText={(text) => typingSearchDebounce(text)}
							/>
							{!!searchText?.length && (
								<Pressable onPress={clearTextInput}>
									<Icons.CircleXIcon height={size.s_20} width={size.s_20} color={themeValue.text} />
								</Pressable>
							)}
						</View>

						<Pressable
							onPress={handleFriendsPress}
							style={[styles.friendsWrapper, !currentDmGroupId && { backgroundColor: themeValue.secondary }]}
						>
							<Icons.FriendIcon height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
							<Text style={styles.headerTitle}>{t('dmMessage:friends')}</Text>
						</Pressable>

						{clansLoadingStatus === 'loaded' && !dmGroupChatList?.length ? (
							<UserEmptyMessage
								onPress={() => {
									navigateToAddFriendScreen();
								}}
							/>
						) : (
							<FlatList
								data={dmGroupChatList}
								showsVerticalScrollIndicator={false}
								keyExtractor={(dm) => dm + 'DM_MSG_ITEM'}
								renderItem={({ item }) => <DmListItem id={item} navigation={navigation} key={item} onLongPress={handleLongPress} />}
							/>
						)}

						<Pressable style={styles.addMessage} onPress={() => navigateToNewMessageScreen()}>
							<Icons.MessagePlusIcon width={size.s_22} height={size.s_22} />
						</Pressable>
					</View>
				</View>
				{isTabletLandscape && <ProfileBar />}
			</View>
			<View style={{ height: '100%', width: size.s_4 }} />
			<View style={styles.containerDetailMessage}>
				{currentDmGroupId ? <DirectMessageDetailTablet directMessageId={currentDmGroupId} /> : <FriendsTablet navigation={navigation} />}
			</View>
		</View>
	);
};

export default MessagesScreenTablet;
