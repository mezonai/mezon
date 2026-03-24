import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	acitvitiesActions,
	directActions,
	getStore,
	messagesActions,
	selectDirectById,
	selectDirectHasMore,
	selectDirectPaginationLoading,
	useAppDispatch
} from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	DeviceEventEmitter,
	Keyboard,
	Platform,
	Pressable,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { Icons } from '../../componentUI/MobileIcons';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import { DmListItem } from './DmListItem';
import MessageActivity from './MessageActivity';
import MessageHeader from './MessageHeader';
import MessagesScreenEmpty from './MessagesScreenEmpty';
import { style } from './styles';

const GRADIENT_START = { x: 1, y: 1 };
const GRADIENT_END = { x: 0, y: 0 };
const GRADIENT_LOCATIONS = [0.2, 0.4, 0.8, 0.9];
const flexOneStyle = { flex: 1 };
const contentContainerStyle = { paddingBottom: size.s_100 };
const footerStyle = { paddingVertical: size.s_14 };
const keyExtractor = (dm: string) => `${dm}DM_MSG_ITEM`;

interface ISectionData {
	title: string;
	data: string[];
	isPinned: boolean;
}

interface IMessagesScreenRenderProps {
	pinnedList: string;
	chatList: string;
}

function parseList(json: string): string[] {
	try {
		if (!json || typeof json !== 'string') {
			return [];
		}
		const parsed = JSON.parse(json);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error parsing chat list:', error);
		return [];
	}
}

const MessagesScreenRender = memo(({ pinnedList, chatList }: IMessagesScreenRenderProps) => {
	const { t } = useTranslation(['dmMessage']);
	const pinnedIds = useMemo(() => parseList(pinnedList), [pinnedList]);
	const unpinnedIds = useMemo(() => parseList(chatList), [chatList]);

	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();

	const hasMore = useSelector(selectDirectHasMore);
	const paginationLoading = useSelector(selectDirectPaginationLoading);

	useFocusEffect(
		useCallback(() => {
			dispatch(directActions.fetchDirectMessage({ noCache: true, isMobile: true }));
		}, [dispatch])
	);

	const navigateToNewMessageScreen = useCallback(() => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_MESSAGE });
	}, [navigation]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		dispatch(directActions.fetchDirectMessage({ noCache: true, isMobile: true }));
		dispatch(acitvitiesActions.listActivities({ noCache: true }));
		await sleep(500);
		setIsRefreshing(false);
	}, [dispatch]);

	const handleLoadMore = useCallback(() => {
		if (!hasMore || paginationLoading) return;
		dispatch(directActions.fetchMoreDirectMessages({}));
	}, [dispatch, hasMore, paginationLoading]);

	useEffect(() => {
		const dmItemRouter = DeviceEventEmitter.addListener('CHANGE_CHANNEL_DM_DETAIL', ({ dmId = '' }) => {
			requestAnimationFrame(async () => {
				if (!isTabletLandscape) {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
						directMessageId: dmId
					});
				}
				dispatch(directActions.setDmGroupCurrentId(dmId));
				dispatch(messagesActions.setIdMessageToJump(null));
			});
		});
		return () => {
			dmItemRouter.remove();
		};
	}, [dispatch, isTabletLandscape, navigation]);

	const handleLongPress = useCallback((dmId: string) => {
		const store = getStore();
		const directMessage = selectDirectById(store.getState(), dmId);
		const data = {
			heightFitContent: true,
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const renderItem = useCallback(
		({ item }: { item: string }) => {
			return (
				<TouchableOpacity
					onPress={() => {
						DeviceEventEmitter.emit('CHANGE_CHANNEL_DM_DETAIL', { dmId: item });
					}}
					onLongPress={() => handleLongPress(item)}
				>
					<DmListItem id={item} />
				</TouchableOpacity>
			);
		},
		[handleLongPress]
	);

	const sections: ISectionData[] = useMemo(() => {
		if (pinnedIds.length === 0) {
			return [{ title: '', data: unpinnedIds, isPinned: false }];
		}
		return [
			{ title: t('pinSection'), data: pinnedIds, isPinned: true },
			{ title: t('allMessagesSection'), data: unpinnedIds, isPinned: false }
		];
	}, [pinnedIds, unpinnedIds, t]);

	const renderSectionHeader = useCallback(({ section }: { section: ISectionData }) => {
		if (!section.title) return null;
		return (
			<View style={styles.sectionHeader}>
				{section.isPinned && <MezonIconCDN icon={IconCDN.pinIcon} width={size.s_14} height={size.s_14} />}
				<Text style={styles.sectionHeaderText}>{section.title}</Text>
			</View>
		);
	}, []);

	const HeaderComponent = useMemo(() => <MessageActivity />, []);

	const ListFooterComponent = useMemo(() => {
		if (!paginationLoading) return null;
		return (
			<View style={footerStyle}>
				<ActivityIndicator size="small" color={themeValue.textStrong} />
			</View>
		);
	}, [paginationLoading, themeValue.textStrong]);

	const gradientColors = useMemo(
		() => [
			themeValue.secondary,
			themeValue?.primaryGradiant || themeValue.secondary,
			themeValue.secondary,
			themeValue?.primaryGradiant || themeValue.secondary
		],
		[themeValue?.primaryGradiant, themeValue.secondary]
	);

	const handleMomentumScrollBegin = useCallback(() => Keyboard.dismiss(), []);

	const ListEmptyComponent = useMemo(() => <MessagesScreenEmpty />, []);

	return (
		<View style={styles.container}>
			<LinearGradient
				start={GRADIENT_START}
				end={GRADIENT_END}
				colors={gradientColors}
				style={StyleSheet.absoluteFill}
				locations={GRADIENT_LOCATIONS}
			/>
			<MessageHeader />
			<View style={flexOneStyle}>
				<SectionList
					sections={sections}
					renderItem={renderItem}
					renderSectionHeader={renderSectionHeader}
					contentContainerStyle={contentContainerStyle}
					keyExtractor={keyExtractor}
					showsVerticalScrollIndicator={true}
					removeClippedSubviews={Platform.OS === 'android'}
					initialNumToRender={15}
					windowSize={5}
					onEndReachedThreshold={0.3}
					onEndReached={handleLoadMore}
					onMomentumScrollBegin={handleMomentumScrollBegin}
					ListHeaderComponent={HeaderComponent}
					ListFooterComponent={ListFooterComponent}
					keyboardShouldPersistTaps={'handled'}
					refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
					ListEmptyComponent={ListEmptyComponent}
					stickySectionHeadersEnabled={false}
				/>
			</View>
			<Pressable style={styles.addMessage} onPress={navigateToNewMessageScreen}>
				<Icons.AddMessagesIcon width={size.s_50} height={size.s_50} />
			</Pressable>
		</View>
	);
});

export default MessagesScreenRender;
