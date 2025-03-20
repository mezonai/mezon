import { load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { selectSignalingDataByUserId, useAppSelector } from '@mezon/store-mobile';
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import CallingModal from '../CallingModal';

const CallingModalWrapper = () => {
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));

	if (!signalingData?.length) {
		return <View />;
	}

	return <CallingModal />;
};

export default memo(CallingModalWrapper, () => true);
