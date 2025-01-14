import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	RootState,
	appActions,
	directActions,
	getStoreAsync,
	selectDirectsOpenlistOrder,
	selectDmGroupCurrentId,
	useAppDispatch
} from '@mezon/store-mobile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { MezonBottomSheet } from '../../componentUI';
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
	const bottomSheetDMMessageRef = useRef<BottomSheetModal>(null);
	const searchInputRef = useRef(null);
	const dispatch = useAppDispatch();
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
		dispatch(appActions.setHiddenBottomTabMobile(true));

		return () => {
			appStateSubscription.remove();
			dispatch(appActions.setHiddenBottomTabMobile(false));
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

	const [directMessageSelected, setDirectMessageSelected] = useState<DirectEntity>(null);
	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		bottomSheetDMMessageRef.current?.present();
		setDirectMessageSelected(directMessage);
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

						<MezonBottomSheet ref={bottomSheetDMMessageRef} snapPoints={['40%', '60%']}>
							<MessageMenu messageInfo={directMessageSelected} />
						</MezonBottomSheet>
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
