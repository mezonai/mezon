import { Colors, Metrics, size, useAnimatedState } from '@mezon/mobile-ui';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import EmojiSelectorContainer from '../EmojiSelectorContainer';

type EmojiSelectorProps = {
	onSelected: (emojiId: string, shortname: string) => void;
	searchText?: string;
	isReactMessage?: boolean;
	onScroll?: (e: any) => void;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
};

export default function EmojiSelector({
	onScroll,
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse
}: EmojiSelectorProps) {
	const [isReadyForUse, setIsReadyForUse] = useAnimatedState<boolean>(false);
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsReadyForUse(true);
		}, 200);
		return () => timer && clearTimeout(timer);
	}, []);

	return (
		<View>
			{isReadyForUse ? (
				<EmojiSelectorContainer
					onScroll={onScroll}
					handleBottomSheetExpand={handleBottomSheetExpand}
					handleBottomSheetCollapse={handleBottomSheetCollapse}
					onSelected={onSelected}
					isReactMessage={isReactMessage}
				/>
			) : (
				<View
					style={{
						alignItems: 'center',
						paddingTop: size.s_40,
						height: Metrics.screenHeight / (Platform.OS === 'ios' ? 1.4 : 1.3)
					}}
				>
					<Flow color={Colors.bgViolet} />
				</View>
			)}
		</View>
	);
}
