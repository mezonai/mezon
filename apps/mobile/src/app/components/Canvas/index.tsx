import { useAuth } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { canvasAPIActions, selectCanvasCursors, selectCanvasIdsByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { normalizeString } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import CanvasItem from './CanvasItem';
import CanvasSearch from './CanvasSearch';
import { style } from './styles';

const Canvas = memo(({ channelId, clanId }: { channelId: string; clanId: string }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const navigation = useNavigation<any>();
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const [searchText, setSearchText] = useState('');
	const [canvasPage, setCanvasPage] = useState(1);

	useEffect(() => {
		fetchCanvas(canvasPage);
	}, [canvasPage]);

	const fetchCanvas = async (page: number) => {
		if (channelId && clanId) {
			const body = {
				channel_id: channelId,
				clan_id: clanId,
				page: page,
				noCache: true
			};
			await dispatch(canvasAPIActions.getChannelCanvasList(body));
		}
	};

	const canvases = useAppSelector((state) => selectCanvasIdsByChannelId(state, channelId));
	const { countCanvas } = useAppSelector((state) => selectCanvasCursors(state, channelId ?? ''));
	const pages = useMemo(() => {
		const totalPages = countCanvas === undefined ? 0 : Math.ceil(countCanvas / 10);
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}, [countCanvas]);

	const filterCanvas = useMemo(() => {
		return canvases?.filter((canvas) =>
			normalizeString(canvas?.title ? canvas?.title?.replace(/\n/g, ' ') : 'Untitled').includes(normalizeString(searchText))
		);
	}, [canvases, searchText]);

	const handleSearchChange = (text) => {
		setSearchText(text);
	};
	const handleDeleteCanvas = useCallback(async (canvasId: string) => {
		if (canvasId && channelId && clanId) {
			const body = {
				id: canvasId,
				channel_id: channelId,
				clan_id: clanId
			};
			await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId, canvasId }));
		}
	}, []);

	const handleCopyLink = useCallback((canvasId: string) => {
		Clipboard.setString(process.env.NX_CHAT_APP_REDIRECT_URI + `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`);
		Toast.show({
			type: 'info',
			text1: 'Copied canvas link to clipboard'
		});
	}, []);

	const renderItem = ({ item, index }) => {
		return (
			<CanvasItem
				key={`canvas_${index}_${item?.id}`}
				canvas={item}
				onPressItem={() => {
					navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.CANVAS,
						params: {
							channelId: channelId,
							clanId: clanId,
							canvasId: item?.id
						}
					});
				}}
				onPressDelete={handleDeleteCanvas}
				onCopyLink={handleCopyLink}
				currentUser={userProfile}
				creatorIdChannel={item?.creator_id}
			/>
		);
	};

	return (
		<View>
			<CanvasSearch onSearchTextChange={handleSearchChange} />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
				<View style={styles.container}>
					{!!filterCanvas?.length && (
						<FlashList
							data={filterCanvas}
							keyExtractor={(item, index) => `canvas_${index}_${item?.id}`}
							renderItem={renderItem}
							estimatedItemSize={size.s_50}
						/>
					)}
				</View>
			</ScrollView>
			<ScrollView horizontal style={styles.horizontalScrollView}>
				{pages?.length > 1 &&
					pages?.map((item) => (
						<TouchableOpacity
							key={`canvas_page_channel_${channelId}_${item}`}
							onPress={() => setCanvasPage(item)}
							style={[styles.pageItem, item === canvasPage && styles.selected]}
						>
							<Text style={styles.pageNumber}>{item.toString()}</Text>
						</TouchableOpacity>
					))}
			</ScrollView>
		</View>
	);
});

export default Canvas;
