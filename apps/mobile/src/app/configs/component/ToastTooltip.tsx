import { useTheme } from '@mezon/mobile-ui';
import { memo, useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import type { ToastConfigParams } from 'react-native-toast-message';
import Toast from 'react-native-toast-message';
import { style } from '../styles';

export const ANIMATION_DEFAULT_DURATION = 5000;

const FADE_IN_MS = 500;
const FADE_OUT_MS = 500;

export const ToastTooltip = memo((props: ToastConfigParams<any>) => {
	const { props: data, text1, text2, isVisible = true } = props;
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const opacity = useRef(new Animated.Value(0)).current;
	const durationMs = data?.duration ?? ANIMATION_DEFAULT_DURATION;

	useEffect(() => {
		if (!isVisible) return;

		opacity.setValue(0);

		const fadeIn = Animated.timing(opacity, {
			toValue: 1,
			duration: FADE_IN_MS,
			useNativeDriver: true
		});
		const fadeOut = Animated.timing(opacity, {
			toValue: 0,
			duration: FADE_OUT_MS,
			useNativeDriver: true
		});

		fadeIn?.start();

		const timeoutId = setTimeout(() => {
			fadeOut?.start(({ finished }) => {
				if (finished) {
					Toast.hide();
				}
			});
		}, durationMs);

		return () => {
			clearTimeout(timeoutId);
			fadeIn?.stop();
			fadeOut?.stop();
		};
	}, [isVisible, durationMs, opacity]);

	const textContent = text1 || data?.text1 || text2 || data?.text2 || '';

	return (
		<Animated.View style={[styles.toastWrapper, styles.toastTooltipBackground, { opacity }]}>
			<Text style={styles.toastTooltipText} numberOfLines={2}>
				{textContent}
			</Text>
		</Animated.View>
	);
});
