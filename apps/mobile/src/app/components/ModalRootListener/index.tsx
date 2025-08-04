import { ActionEmitEvent } from '@mezon/mobile-components';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, DeviceEventEmitter, Keyboard, StyleSheet, View } from 'react-native';

const useModalState = () => {
	const [children, setChildren] = useState<any>(null);

	const clearDataModal = () => {
		setChildren(null);
	};

	return {
		children,
		clearDataModal,
		setChildren
	};
};

const ModalRootListener = () => {
	const [visible, setVisible] = useState<boolean>(false);
	const { children, clearDataModal, setChildren } = useModalState();

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.6)).current;

	const onTriggerModal = useCallback((data) => {
		if (data?.children) setChildren(data.children);

		fadeAnim.setValue(0);
		scaleAnim.setValue(0.6);

		setVisible(true);

		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, scaleAnim, setChildren]);

	const closeModal = useCallback(() => {
		setVisible(false);
		clearDataModal();
	}, [clearDataModal]);

	useEffect(() => {
		const modalListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_TRIGGER_MODAL, ({ isDismiss, data }) => {
			if (isDismiss) {
				closeModal();
			} else {
				Keyboard.dismiss();
				onTriggerModal(data);
			}
		});

		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (visible) {
				closeModal();
				return true;
			}
			return false;
		});

		return () => {
			modalListener.remove();
			backHandler.remove();
		};
	}, [visible, closeModal, onTriggerModal]);

	if (!visible) return null;

	return (
		visible && (
			<View style={styles.overlay}>
				<Animated.View
					style={[
						styles.modalContent,
						{
							opacity: fadeAnim,
							transform: [{ scale: scaleAnim }]
						}
					]}
				>
					{children}
				</Animated.View>
			</View>
		)
	);
};

const styles = StyleSheet.create({
	overlay: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1002,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalContent: {
		width: '100%',
		height: '100%',
		zIndex: 1002,
		backgroundColor: 'transparent'
	}
});

export default memo(ModalRootListener, () => true);
