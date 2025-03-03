import { ActionEmitEvent } from '@mezon/mobile-components';
import { useAppDispatch } from '@mezon/store-mobile';
import React, { memo, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { InviteToChannel } from '../../InviteToChannel';

const ChannelListBottomSheet = () => {
	const bottomSheetInviteRef = useRef(null);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const eventOpenInvite = DeviceEventEmitter.addListener(ActionEmitEvent.ON_OPEN_INVITE_CHANNEL, () => {
			bottomSheetInviteRef?.current?.present?.();
		});

		return () => {
			eventOpenInvite.remove();
		};
	}, [dispatch]);

	return <InviteToChannel isUnknownChannel={false} ref={bottomSheetInviteRef} />;
};

export default memo(ChannelListBottomSheet, () => true);
