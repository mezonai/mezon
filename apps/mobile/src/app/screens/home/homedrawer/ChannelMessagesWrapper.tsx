import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import ChannelMessages from './ChannelMessages';

type ChannelMessagesProps = {
	channelId: string;
	topicId?: string;
	clanId: string;
	avatarDM?: string;
	mode: ChannelStreamMode;
	isPublic?: boolean;
	isDM?: boolean;
	topicChannelId?: string;
};

const ChannelMessagesWrapper = React.memo(({ channelId, topicId, clanId, mode, isPublic, isDM, topicChannelId }: ChannelMessagesProps) => {
	// const [isReadyShowChannelMsg, setIsReadyShowChannelMsg] = React.useState<boolean>(false);
	// const { themeValue } = useTheme();

	// useFocusEffect(() => {
	// 	if (!isReadyShowChannelMsg) {
	// 		setTimeout(() => {
	// 			setIsReadyShowChannelMsg(() => true);
	// 		}, 50);
	// 	}
	// });

	// useEffect(() => {
	// 	const onSwitchChannel = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SWITCH_CHANEL, async (time: number) => {
	// 		if (time) {
	// 			setIsReadyShowChannelMsg(() => false);
	// 			await sleep(time);
	// 			setIsReadyShowChannelMsg(() => true);
	// 		} else {
	// 			setIsReadyShowChannelMsg(() => true);
	// 		}
	// 	});
	// 	return () => {
	// 		onSwitchChannel.remove();
	// 	};
	// }, []);

	// if (!isReadyShowChannelMsg)
	// 	return (
	// 		<View style={{ flex: 1, backgroundColor: themeValue.primary }}>
	// 			<MessageItemSkeleton skeletonNumber={8} />
	// 		</View>
	// 	);

	return (
		<View style={{ flex: 1 }}>
			<ChannelMessages
				channelId={channelId}
				topicId={topicId}
				clanId={clanId}
				mode={mode}
				isDM={isDM}
				isPublic={isPublic}
				topicChannelId={topicChannelId}
			/>
		</View>
	);
});

export default ChannelMessagesWrapper;
