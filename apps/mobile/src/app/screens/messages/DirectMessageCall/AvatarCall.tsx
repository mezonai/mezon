import { size, useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../../assets/Images';

interface IAvatarCallProps {
	receiverName: string;
	receiverAvatar: string;
	isAnswerCall: boolean;
	isConnected?: boolean;
}

const RING_CONFIG = [
	{ baseSize: 50, delay: 0 },
	{ baseSize: 160, delay: 0.25 },
	{ baseSize: 180, delay: 0.5 }
];

const AvatarCall = ({ receiverAvatar, receiverName, isAnswerCall = false, isConnected = false }: IAvatarCallProps) => {
	const ringAnimation = useRef(new Animated.Value(0)).current;
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);

	const { themeValue } = useTheme();

	useEffect(() => {
		if (!isConnected) {
			const animation = Animated.loop(
				Animated.timing(ringAnimation, {
					toValue: 1,
					duration: 3500,
					useNativeDriver: true
				})
			);

			animationRef.current = animation;
			animation.start();
		} else {
			// Stop animation when connected
			if (animationRef.current) {
				animationRef.current.stop();
			}
			ringAnimation.setValue(0);
		}

		return () => {
			if (animationRef.current) {
				animationRef.current.stop();
			}
		};
	}, [isConnected, ringAnimation]);

	const createRingStyle = (baseSize: number, delay: number) => {
		const delayedValue = ringAnimation.interpolate({
			inputRange: [0, delay, delay + 0.4, 1],
			outputRange: [0, 0, 1, 1],
			extrapolate: 'clamp'
		});

		return {
			position: 'absolute' as const,
			width: baseSize,
			height: baseSize,
			borderRadius: baseSize / 2,
			borderWidth: 2,
			borderColor: 'rgba(255, 255, 255, 0.3)',
			transform: [
				{
					scale: delayedValue.interpolate({
						inputRange: [0, 1],
						outputRange: [1, 2.8]
					})
				}
			],
			opacity: delayedValue.interpolate({
				inputRange: [0, 0.1, 0.6, 1],
				outputRange: [0, 0.8, 0.3, 0]
			})
		};
	};

	return (
		<View style={styles.container}>
			<View style={styles.profileContainer}>
				{/* Only show rings when not connected */}
				{!isConnected && (
					<>
						{RING_CONFIG.map((ring, index) => (
							<Animated.View key={index} style={createRingStyle(ring.baseSize, ring.delay)} />
						))}
					</>
				)}
				<FastImage
					source={receiverAvatar ? { uri: receiverAvatar } : Images.ANONYMOUS_AVATAR}
					style={[styles.avatar, isConnected && styles.avatarConnected]}
				/>
			</View>
			{!!receiverName && <Text style={[styles.name, { color: themeValue.text }]}>{receiverName}</Text>}
			{!isConnected && (
				<Text
					style={[
						styles.status,
						{
							color: themeValue.textDisabled
						}
					]}
				>
					{isAnswerCall ? 'Connecting...' : 'Ringing...'}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		top: size.s_100
	},
	profileContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: size.s_20
	},
	name: {
		fontSize: size.s_20,
		textAlign: 'center',
		fontWeight: '600'
	},
	status: {
		marginTop: size.s_10,
		fontSize: size.s_16,
		textAlign: 'center'
	},
	avatar: {
		width: size.s_100,
		height: size.s_100,
		borderRadius: size.s_100,
		alignSelf: 'center'
	},
	avatarConnected: {
		borderWidth: size.s_4,
		borderColor: '#4CAF50'
	}
});

export default React.memo(AvatarCall);
