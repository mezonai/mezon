import { useTheme } from '@mezon/mobile-ui';
import type { PinMessageEntity } from '@mezon/store-mobile';
import { pinMessageActions, selectPinMessageByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import type { IExtendedMessage } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import EmptyPinMessage from './EmptyPinMessage';
import { style } from './PinMessage';
import PinMessageItem from './PinMessageItem';

const PinMessage = memo(({ currentChannelId, currentClanId }: { currentChannelId: string; currentClanId: string }) => {
	const { themeValue } = useTheme();
	const styles = style();
	const listPinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId as string));
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState(false);

	const fetchPinMessages = useCallback(async () => {
		try {
			setIsLoading(true);
			await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId, clanId: currentClanId }));
		} catch (error) {
			console.error('Failed to fetch pin messages:', error);
		} finally {
			setIsLoading(false);
		}
	}, [currentChannelId, currentClanId, dispatch]);

	useEffect(() => {
		fetchPinMessages();
	}, [fetchPinMessages]);

	const handleUnpinMessage = useCallback(
		(message: PinMessageEntity) => {
			dispatch(
				pinMessageActions.deleteChannelPinMessage({
					channel_id: currentChannelId,
					message_id: message?.message_id || message?.id,
					clan_id: currentClanId
				})
			);
		},
		[currentChannelId, currentClanId, dispatch]
	);

	const renderItem = useCallback(
		({ item }: { item: PinMessageEntity }) => {
			let contentString = item?.content;
			if (typeof contentString === 'string') {
				try {
					contentString = safeJSONParse(contentString);
				} catch (e) {
					console.error('Failed to parse content JSON:', e);
				}
			}

			return (
				<PinMessageItem
					pinMessageItem={item}
					contentMessage={contentString as IExtendedMessage}
					handleUnpinMessage={handleUnpinMessage}
					currentClanId={currentClanId}
				/>
			);
		},
		[handleUnpinMessage, currentClanId]
	);

	const renderEmptyComponent = useCallback(() => {
		if (isLoading) {
			return <ActivityIndicator size="large" color={themeValue.text} style={styles.loading} />;
		}
		return <EmptyPinMessage />;
	}, [isLoading, themeValue.text]);

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				data={listPinMessages}
				renderItem={renderItem}
				keyExtractor={(item, index) => `pin_message_${index}_${item?.id}`}
				ListEmptyComponent={renderEmptyComponent}
				contentContainerStyle={styles.containerPinMessage}
				showsVerticalScrollIndicator={false}
				removeClippedSubviews={true}
				maxToRenderPerBatch={5}
				windowSize={15}
				initialNumToRender={1}
			/>
		</View>
	);
});

export default PinMessage;
