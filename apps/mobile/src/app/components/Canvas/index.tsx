import { size } from '@mezon/mobile-ui';
import { canvasAPIActions, selectAllAccount, selectCanvasIdsByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { normalizeString } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import CanvasItem from './CanvasItem';
import CanvasSearch from './CanvasSearch';
import { style } from './styles';

const Canvas = memo(({ channelId, clanId }: { channelId: string; clanId: string }) => {
	const styles = style();
	const navigation = useNavigation<any>();
	const userProfile = useSelector(selectAllAccount);
	const dispatch = useAppDispatch();
	const [searchText, setSearchText] = useState('');
	const { t } = useTranslation(['common']);

	useEffect(() => {
		fetchCanvas();
	}, []);

	const fetchCanvas = async () => {
		if (channelId && clanId) {
			const body = {
				channelId: channelId,
				clanId: clanId,
				noCache: false
			};
			await dispatch(canvasAPIActions.getChannelCanvasList(body));
		}
	};

	const canvases = useAppSelector((state) => selectCanvasIdsByChannelId(state, channelId));

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
				channelId: channelId,
				clanId: clanId
			};
			await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId, canvasId }));
		}
	}, []);

	const handleCopyLink = useCallback((canvasId: string) => {
		Clipboard.setString(`${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`);
		Toast.show({
			type: 'info',
			text1: t('copiedCanvasLink')
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
							channelId,
							clanId,
							canvasId: item?.id
						}
					});
				}}
				onPressDelete={handleDeleteCanvas}
				onCopyLink={handleCopyLink}
				currentUser={userProfile}
				creatorIdChannel={item?.creatorId}
			/>
		);
	};

	return (
		<View>
			<CanvasSearch onSearchTextChange={handleSearchChange} />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
				{!!filterCanvas?.length && (
					<FlashList
						data={filterCanvas}
						keyExtractor={(item, index) => `canvas_${index}_${item?.id}`}
						renderItem={renderItem}
						estimatedItemSize={size.s_50}
						removeClippedSubviews={true}
					/>
				)}
			</ScrollView>
		</View>
	);
});

export default Canvas;
