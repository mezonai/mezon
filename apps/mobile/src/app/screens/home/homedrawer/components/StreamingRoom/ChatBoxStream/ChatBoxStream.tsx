import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentStreamInfo } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, { Ref, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import ChannelMessagesWrapper from '../../../ChannelMessagesWrapper';
import PanelKeyboard from '../../../PanelKeyboard';

const ChatBoxStream = forwardRef(({ props, ref }: { props?: any; ref: Ref<BottomSheetModalMethods> }) => {
	const { themeValue } = useTheme();
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);

	return (
		<Block height={'100%'} width={'100%'}>
			<Block flex={1} backgroundColor={themeValue.primary} marginTop={-size.s_60}>
				<ChannelMessagesWrapper
					channelId={currentStreamInfo?.streamId}
					clanId={currentStreamInfo?.clanId}
					mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
				/>
				<PanelKeyboard ref={ref} currentChannelId={currentStreamInfo?.streamId} currentClanId={currentStreamInfo?.clanId} />
			</Block>
		</Block>
	);
});

export const ChatBoxStreamComponent = React.memo(ChatBoxStream);
