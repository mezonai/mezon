import { load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { selectSignalingDataByUserId, useAppSelector } from '@mezon/store-mobile';
import { WebrtcSignalingType } from 'mezon-js';
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import CallingModal from '../CallingModal';

const CallingModalWrapper = () => {
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));

	if (!signalingData?.length || signalingData?.[signalingData?.length - 1]?.signalingData?.data_type !== WebrtcSignalingType.WEBRTC_SDP_OFFER) {
		return <View />;
	}

	return <CallingModal />;
};

export default memo(CallingModalWrapper, () => true);
