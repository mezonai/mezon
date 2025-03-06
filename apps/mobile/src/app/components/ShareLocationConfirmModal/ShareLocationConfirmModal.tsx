import { useIdleRender } from '@mezon/core';
import { referencesActions, selectGeolocation } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import ShareLocation from './ShareLocation';

const BaseShareLocationConfirmModal = ({ mode, channelId }: { mode: ChannelStreamMode; channelId: string }) => {
	const geoLocation = useSelector(selectGeolocation);
	const [visible, setVisible] = useState<boolean>(false);
	const dispatch = useDispatch();

	useEffect(() => {
		if (geoLocation) {
			setVisible(true);
		}
	}, [geoLocation]);

	const handelCancelModal = useCallback(() => {
		setVisible(false);
		dispatch(referencesActions.setGeolocation(null));
	}, []);

	return (
		<Modal
			isVisible={visible}
			animationIn={'bounceIn'}
			animationOut={'bounceOut'}
			hasBackdrop={true}
			avoidKeyboard={false}
			backdropColor={'rgba(0,0,0, 0.7)'}
			coverScreen={false}
			deviceHeight={Dimensions.get('screen').height}
		>
			<ShareLocation oncancel={handelCancelModal} mode={mode} channelId={channelId} geoLocation={geoLocation} />
		</Modal>
	);
};

const ShareLocationConfirmModal = (props: { mode: ChannelStreamMode; channelId: string }) => {
	const shouldRender = useIdleRender();

	if (!shouldRender) {
		return null;
	}

	return <BaseShareLocationConfirmModal {...props} />;
};

export default React.memo(ShareLocationConfirmModal);
