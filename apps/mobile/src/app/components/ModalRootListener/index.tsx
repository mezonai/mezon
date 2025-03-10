import { ActionEmitEvent } from '@mezon/mobile-components';
import React, { memo, useEffect, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Modal } from 'react-native';

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
		return () => {
			modalListener.remove();
		};
	}, []);

	return <Modal visible={visible}>{children && children}</Modal>;
};

export default memo(ModalRootListener, () => true);
