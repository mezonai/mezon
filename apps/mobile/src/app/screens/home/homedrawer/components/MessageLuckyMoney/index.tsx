import { useTheme } from '@mezon/mobile-ui';
import React, { memo, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { style } from './styles';

interface MessageLuckyMoneyProps {
	message?: string;
	amount?: string;
	expiryTime?: string;
	isOpened?: boolean;
	onOpen?: () => void;
	receivedAmount?: string;
}

export const MessageLuckyMoney = memo(
	({ message = 'Happy New Year ✨✨', expiryTime = 'Hết hạn sau 12h', isOpened = false, onOpen, receivedAmount }: MessageLuckyMoneyProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);

		const [opened, setOpened] = useState(isOpened);
		const [showAmount, setShowAmount] = useState(false);

		// Animation values
		const scaleAnim = useRef(new Animated.Value(1)).current;
		const rotateAnim = useRef(new Animated.Value(0)).current;
		const opacityAnim = useRef(new Animated.Value(1)).current;
		const amountScaleAnim = useRef(new Animated.Value(0)).current;

		// Particle animations (3D coins effect)
		const particleAnims = useRef(
			Array(8)
				.fill(0)
				.map(() => ({
					translateY: new Animated.Value(0),
					translateX: new Animated.Value(0),
					scale: new Animated.Value(1),
					opacity: new Animated.Value(1)
				}))
		).current;

		const handleOpenEnvelope = () => {
			if (opened) return;

			setOpened(true);
			onOpen?.();

			// Sequence of animations
			Animated.sequence([
				// Step 1: Shake animation
				Animated.parallel([
					Animated.sequence([
						Animated.timing(rotateAnim, {
							toValue: 1,
							duration: 100,
							easing: Easing.linear,
							useNativeDriver: true
						}),
						Animated.timing(rotateAnim, {
							toValue: -1,
							duration: 100,
							easing: Easing.linear,
							useNativeDriver: true
						}),
						Animated.timing(rotateAnim, {
							toValue: 0,
							duration: 100,
							easing: Easing.linear,
							useNativeDriver: true
						})
					]),
					Animated.sequence([
						Animated.timing(scaleAnim, {
							toValue: 1.1,
							duration: 150,
							useNativeDriver: true
						}),
						Animated.timing(scaleAnim, {
							toValue: 1,
							duration: 150,
							useNativeDriver: true
						})
					])
				]),

				// Step 2: Particles burst out
				Animated.parallel([
					...particleAnims.map((anim, index) => {
						const angle = (index / particleAnims.length) * Math.PI * 2;
						const distance = 80;
						return Animated.parallel([
							Animated.timing(anim.translateX, {
								toValue: Math.cos(angle) * distance,
								duration: 600,
								easing: Easing.out(Easing.quad),
								useNativeDriver: true
							}),
							Animated.timing(anim.translateY, {
								toValue: Math.sin(angle) * distance,
								duration: 600,
								easing: Easing.out(Easing.quad),
								useNativeDriver: true
							}),
							Animated.timing(anim.opacity, {
								toValue: 0,
								duration: 600,
								useNativeDriver: true
							}),
							Animated.sequence([
								Animated.timing(anim.scale, {
									toValue: 1.3,
									duration: 300,
									useNativeDriver: true
								}),
								Animated.timing(anim.scale, {
									toValue: 0,
									duration: 300,
									useNativeDriver: true
								})
							])
						]);
					}),
					// Fade out envelope
					Animated.timing(opacityAnim, {
						toValue: 0,
						duration: 400,
						delay: 200,
						useNativeDriver: true
					})
				])
			]).start(() => {
				// Step 3: Show amount with scale animation
				setShowAmount(true);
				Animated.spring(amountScaleAnim, {
					toValue: 1,
					friction: 4,
					tension: 40,
					useNativeDriver: true
				}).start();
			});
		};

		const rotation = rotateAnim.interpolate({
			inputRange: [-1, 1],
			outputRange: ['-10deg', '10deg']
		});

		if (showAmount) {
			return (
				<Animated.View
					style={[
						styles.container,
						{
							transform: [{ scale: amountScaleAnim }]
						}
					]}
				>
					<View style={styles.openedContainer}>
						{/* Confetti/Celebration Animation */}
						<View style={styles.celebrationContainer}>
							<Icon name="party-popper" size={40} color="#FDD835" />
						</View>

						{/* Amount Display */}
						<Text style={styles.congratsText}>Chúc mừng bạn nhận được</Text>
						<Text style={styles.amountText}>{receivedAmount || '431đ'}</Text>

						{/* Message */}
						<View style={styles.openedMessageContainer}>
							<Text style={styles.openedMessage}>{message}</Text>
						</View>

						{/* Footer */}
						<View style={styles.openedFooter}>
							<Icon name="wallet" size={16} color="#999" />
							<Text style={styles.openedFooterText}>Đã chuyển vào ví</Text>
						</View>
					</View>
				</Animated.View>
			);
		}

		return (
			<View style={styles.container}>
				<TouchableOpacity activeOpacity={0.9} onPress={handleOpenEnvelope} disabled={opened}>
					<Animated.View
						style={[
							styles.envelope,
							{
								transform: [{ scale: scaleAnim }, { rotate: rotation }],
								opacity: opacityAnim
							}
						]}
					>
						{/* Decorative Elements - Top */}
						<View style={styles.decorativeTop}>
							{/* Gold coins floating */}
							{[0, 1, 2, 3, 4].map((index) => (
								<View
									key={`coin-${index}`}
									style={[styles.goldCoin, { left: `${20 + index * 15}%`, top: index % 2 === 0 ? 10 : 20 }]}
								/>
							))}

							{/* Firework decorations */}
							<View style={[styles.firework, { left: '10%', top: 30 }]} />
							<View style={[styles.firework, { right: '10%', top: 30 }]} />
						</View>

						{/* Center Seal/Symbol */}
						<View style={styles.centerSeal}>
							<View style={styles.sealOuter}>
								<View style={styles.sealInner}>
									<View style={styles.diamondShape} />
								</View>
							</View>
						</View>

						{/* Text Content */}
						<View style={styles.textContent}>
							<Text style={styles.title}>Lì xì nhóm</Text>
							<Text style={styles.message}>"{message}"</Text>
						</View>

						{/* Button */}
						<View style={styles.openButton}>
							<Text style={styles.openButtonText}>Mở lì xì</Text>
						</View>

						{/* Footer */}
						<View style={styles.footer}>
							<Text style={styles.expiryText}>{expiryTime}</Text>
						</View>

						{/* Particles for animation */}
						{particleAnims.map((anim, index) => (
							<Animated.View
								key={`particle-${index}`}
								style={[
									styles.particle,
									{
										transform: [{ translateX: anim.translateX }, { translateY: anim.translateY }, { scale: anim.scale }],
										opacity: anim.opacity
									}
								]}
							>
								<Icon name="circle" size={12} color="#FDD835" />
							</Animated.View>
						))}
					</Animated.View>
				</TouchableOpacity>
			</View>
		);
	}
);

MessageLuckyMoney.displayName = 'MessageLuckyMoney';

export default MessageLuckyMoney;
