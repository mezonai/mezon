import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
	Easing,
	SlideInRight,
	SlideOutRight,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming
} from 'react-native-reanimated';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { Icons } from '../../../../../../componentUI/MobileIcons';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../ChatBoxBottomBar/style';

const formatTime = (millis: number) => {
	const minutes = Math.floor(millis / 60000);
	const seconds = Math.floor((millis % 60000) / 1000);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RecordingUI = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [duration, setDuration] = useState(0);
	const micScale = useSharedValue(1);
	const micOpacity = useSharedValue(1);
	const slideTranslateX = useSharedValue(0);
	const { t } = useTranslation('message');

	useEffect(() => {
		const startTime = Date.now();
		const intervalId = setInterval(() => {
			const elapsed = Date.now() - startTime;
			setDuration(elapsed);
		}, 100);

		micScale.value = withRepeat(withSequence(withTiming(1.2, { duration: 600 }), withTiming(1, { duration: 600 })), -1, false);
		micOpacity.value = withRepeat(withSequence(withTiming(0.6, { duration: 600 }), withTiming(1, { duration: 600 })), -1, false);

		slideTranslateX.value = withRepeat(
			withSequence(
				withTiming(5, {
					duration: 0
				}),
				withTiming(-15, {
					duration: 1000,
					easing: Easing.inOut(Easing.ease)
				}),
				withTiming(5, {
					duration: 1000,
					easing: Easing.inOut(Easing.ease)
				})
			),
			-1,
			false
		);

		return () => {
			clearInterval(intervalId);
		};
	}, [micScale, micOpacity, slideTranslateX]);

	const micBackgroundAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: micScale.value }],
		opacity: micOpacity.value
	}));

	const slideAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: slideTranslateX.value }]
	}));

	return (
		<Animated.View
			style={styles.recordingProcessing}
			entering={SlideInRight.duration(300).withInitialValues({ opacity: 0 })}
			exiting={SlideOutRight.duration(200).withInitialValues({ opacity: 1 })}
		>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.wrapperMicrophone}>
				<View style={{ position: 'relative' }}>
					<Animated.View style={[styles.micIconContainer, micBackgroundAnimatedStyle]} />
					<View style={[styles.micIconContainer, { position: 'absolute', backgroundColor: 'transparent' }]}>
						<Icons.MicIcon color={themeValue.text} width={size.s_24} height={size.s_24} />
					</View>
				</View>
				<Text style={[styles.timerText]}>{formatTime(duration)}</Text>
			</View>

			<Animated.View style={[styles.wrapperSlideToCancel, slideAnimatedStyle]}>
				<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				<Text style={[styles.timerText]}>{t('slideToCancel')} </Text>
			</Animated.View>
		</Animated.View>
	);
});

export const RecordMessageProcessing = memo(() => {
	const [isShow, setIsShow] = useState(false);

	useEffect(() => {
		const onShowRecordProcessing = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, ({ show = false }) => {
			setIsShow(show);
		});
		return () => {
			onShowRecordProcessing.remove();
		};
	}, []);

	if (!isShow) {
		return null;
	}

	return <RecordingUI />;
});
