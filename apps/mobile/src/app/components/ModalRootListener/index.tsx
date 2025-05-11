import { ActionEmitEvent } from '@mezon/mobile-components';
import React, { memo, useEffect, useState } from 'react';
import { BackHandler, DeviceEventEmitter, Keyboard, StyleSheet, View } from 'react-native';

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

	const onTriggerModal = (data) => {
		setVisible(true);
		if (data?.children) setChildren(data.children);
	};

	useEffect(() => {
		const modalListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_TRIGGER_MODAL, ({ isDismiss, data }) => {
			clearDataModal();
			if (isDismiss) {
				setVisible(false);
			} else {
				Keyboard.dismiss();
				onTriggerModal(data);
			}
		});

		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (visible) {
				setVisible(false);
				return true;
			}
			return false;
		});

		return () => {
			modalListener.remove();
			backHandler.remove();
		};
	}, [visible]);

	return (
		visible && (
			<View style={styles.overlay}>
				<View style={styles.modalContent}>{children && children}</View>
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
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalContent: {
		width: '100%',
		height: '100%',
		backgroundColor: 'transparent'
	}
});

export default memo(ModalRootListener, () => true);
