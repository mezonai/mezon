import { useTheme } from '@mezon/mobile-ui';
import { default as React, memo, useEffect } from 'react';
import { style } from './styles';

import { RTCView } from '@livekit/react-native-webrtc';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import InCallManager from 'react-native-incall-manager';
import Images from '../../../../../../../assets/Images';
import { useWebRTCStream } from '../../../../../../components/StreamContext/StreamContext';
export function StreamingScreen() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { isStream, isRemoteVideoStream, remoteStream } = useWebRTCStream();
	const { t } = useTranslation(['streamingRoom']);

	useEffect(() => {
		InCallManager.setSpeakerphoneOn(true);
	}, []);
	return (
		<View style={styles.container}>
			{remoteStream && isStream ? (
				<View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
					{!isRemoteVideoStream && <FastImage source={Images.RADIO_NCC8} style={{ width: '100%', height: 400 }} resizeMode={'contain'} />}
					<RTCView streamURL={remoteStream?.toURL?.()} style={{ flex: 1 }} mirror={true} objectFit={'cover'} />
				</View>
			) : (
				<View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
					<Text style={styles.errorText}>{t('noDisplay')}</Text>
				</View>
			)}
		</View>
	);
}

export const StreamingScreenComponent = memo(StreamingScreen);
