import { baseColor, Block, size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, directActions, selectBuzzStateByChannelId, selectBuzzStateByDirectId, useAppSelector } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, TextStyle } from 'react-native';
import { useDispatch } from 'react-redux';
import { style } from './styles';

type BuzzBadgeProps = {
	channelId: string;
	mode: ChannelStreamMode;
	customStyles?: TextStyle;
};

function BuzzBadge({ channelId, mode, customStyles }: BuzzBadgeProps) {
	const dispatch = useDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const buzzStateDM = useAppSelector((state) => selectBuzzStateByDirectId(state, channelId ?? ''));
	const buzzState = useAppSelector((state) => selectBuzzStateByChannelId(state, channelId ?? ''));
	const isReset = useMemo(() => buzzStateDM?.isReset || buzzState?.isReset, [buzzStateDM?.isReset, buzzState?.isReset]);
	const isPosDmOrGr = useMemo(() => mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP, [mode]);
	const isChannelOrThread = useMemo(() => mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD, [mode]);

	const resetBuzzState = useCallback(() => {
		if (isChannelOrThread) {
			dispatch(channelsActions.setBuzzState({ channelId, buzzState: null }));
		} else if (isPosDmOrGr) {
			dispatch(directActions.setBuzzStateDirect({ channelId, buzzState: null }));
		}
	}, [dispatch, channelId, isChannelOrThread, isPosDmOrGr]);

	useEffect(() => {
		if (isReset) {
			const timer = setTimeout(resetBuzzState, 10000);
			return () => clearTimeout(timer);
		}
	}, [isReset, resetBuzzState, buzzStateDM, buzzState]);

	if (!isReset) return null;

	return (
		<Block style={customStyles} marginRight={size.s_10} backgroundColor={baseColor.buzzRed} paddingHorizontal={size.s_4} borderRadius={size.s_4}>
			<Text style={styles.textBuzz}>Buzz!!</Text>
		</Block>
	);
}

export default React.memo(BuzzBadge);
