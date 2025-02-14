import { Colors, size, useAnimatedState } from '@mezon/mobile-ui';
import React, { useEffect } from 'react';
import { View } from 'react-native';
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
	const [isReadyForUse, setIsReadyForUse] = useAnimatedState<boolean>(isReactMessage);
	useEffect(() => {
		const timer = isReactMessage
			? null
			: setTimeout(() => {
					setIsReadyForUse(true);
				}, 200);
		return () => timer && clearTimeout(timer);
	}, [isReactMessage]);

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
				<View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: size.s_40 }}>
					<Flow color={Colors.bgViolet} />
				</View>
			)}
		</View>
	);
}
