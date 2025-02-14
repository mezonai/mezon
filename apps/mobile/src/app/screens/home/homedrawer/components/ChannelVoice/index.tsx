import { AudioSession, LiveKitRoom } from '@livekit/react-native';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById2 } from '@mezon/store';
import React, { useEffect } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import RoomView from './RoomView';
import { style } from './styles';

const { width, height } = Dimensions.get('window');

function ChannelVoice({
	channelId,
	token,
	serverUrl,
	onPressMinimizeRoom,
	isAnimationComplete
}: {
	channelId: string;
	onPressMinimizeRoom?: () => void;
	token: string;
	serverUrl: string;
	isAnimationComplete: boolean;
}) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const channel = useSelector((state) => selectChannelById2(state, channelId));

	useEffect(() => {
		const start = async () => {
			await AudioSession.startAudioSession();
		};

		start();
		return () => {
			AudioSession.stopAudioSession();
		};
	}, []);

	return (
		<View>
			<StatusBarHeight />
			<View
				style={{
					width: isAnimationComplete ? width : size.s_100 * 2,
					height: isAnimationComplete ? height : size.s_150,
					backgroundColor: themeValue?.primary
				}}
			>
				{isAnimationComplete && (
					<View style={[styles.menuHeader]}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
							<TouchableOpacity
								onPress={() => {
									onPressMinimizeRoom();
								}}
								style={styles.buttonCircle}
							>
								<Icons.ChevronSmallDownIcon />
							</TouchableOpacity>
							<Text numberOfLines={1} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
								{channel?.channel_label}
							</Text>
						</View>
					</View>
				)}
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					<RoomView channelId={channelId} onPressMinimizeRoom={onPressMinimizeRoom} isAnimationComplete={isAnimationComplete} />
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
