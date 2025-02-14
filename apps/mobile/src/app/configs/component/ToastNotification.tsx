import { Text, useTheme } from '@mezon/mobile-ui';
import LottieView from 'lottie-react-native';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ToastConfigParams } from 'react-native-toast-message';
import { NOTIFICATION_PROGRESS_BAR } from '../../../assets/lottie';
import { style } from '../styles';

export const ToastNotification = memo((props: ToastConfigParams<any>) => {
	const { props: data, onPress } = props;
	const { title, body } = data;
	const progressBarRef = useRef<LottieView>(null);

	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const logoUrl = useMemo(() => {
		return data?.android?.imageUrl || '';
	}, [data?.android?.imageUrl]);

	useEffect(() => {
		if (body) {
			progressBarRef.current?.play();
		}
	}, [body]);

	return (
		<Pressable onPress={onPress}>
			<View style={styles.notificationContainer}>
				<View style={[styles.notificationContent]}>
					{!!logoUrl && <FastImage source={{ uri: logoUrl }} style={styles.notificationLogo} />}
					<View
						style={{
							flexDirection: 'column',
							flex: 1
						}}
					>
						<Text color={themeValue.white} h4 bold>
							{title}
						</Text>
						<Text color={themeValue.textStrong} numberOfLines={3}>
							{body}
						</Text>
					</View>
				</View>
				<View
					style={{
						transform: [{ rotateY: '180deg' }]
					}}
				>
					<LottieView loop={false} speed={0.4} ref={progressBarRef} source={NOTIFICATION_PROGRESS_BAR} style={styles.lottieProgressBar} />
				</View>
			</View>
		</Pressable>
	);
});
