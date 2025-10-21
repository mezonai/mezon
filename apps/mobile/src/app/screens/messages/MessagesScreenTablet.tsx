import { size, useTheme } from '@mezon/mobile-ui';
import type { RootState } from '@mezon/store-mobile';
import { directActions, getStoreAsync, selectDirectsOpenlistOrder, selectDmGroupCurrentId } from '@mezon/store-mobile';
import React, { useEffect } from 'react';
import { AppState, FlatList, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { FriendsTablet } from '../friend/FriendsTablet';
import ProfileBar from '../home/homedrawer/ProfileBar';
import ServerList from '../home/homedrawer/ServerList';
import UserEmptyMessage from '../home/homedrawer/UserEmptyClan/UserEmptyMessage';
import { DirectMessageDetailTablet } from './DirectMessageDetailTablet';
import { DmListItem } from './DmListItem';
import MessageHeader from './MessageHeader';
import { style } from './styles';

const MessagesScreenTablet = ({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
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

	return (
		<View style={styles.containerMessages}>
			<View style={styles.leftContainer}>
				<View style={styles.containerMessages}>
					<ServerList />

					<View style={styles.container}>
						<MessageHeader />
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
								keyExtractor={(dm) => `${dm}_DM_MSG_ITEM`}
								initialNumToRender={1}
								maxToRenderPerBatch={1}
								windowSize={2}
								renderItem={({ item }) => <DmListItem id={item} />}
							/>
						)}

						<Pressable style={styles.addMessage} onPress={() => navigateToNewMessageScreen()}>
							<MezonIconCDN icon={IconCDN.messagePlusIcon} width={size.s_22} height={size.s_22} />
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
