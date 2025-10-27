import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import { selectCurrentClan } from '@mezon/store-mobile';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../../../../../../components/ImageNative';
import ClanMenu from '../../ClanMenu/ClanMenu';
import { style } from './styles';

const ChannelListBackground = () => {
	const currentClan = useSelector(selectCurrentClan);
	const previousBanner = useRef<string | null>(null);

	useEffect(() => {
		previousBanner.current = currentClan?.banner || '';
	}, [currentClan?.banner]);

	const bannerToShow = !currentClan?.id || currentClan?.id === '0' ? previousBanner.current : currentClan?.banner;

	const handlePress = useCallback(() => {
		const data = {
			children: <ClanMenu />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	if (!bannerToShow) return null;

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={[style.container, { height: size.s_70 * 2 }]}>
			<ImageNative url={bannerToShow} style={style.image} resizeMode="cover" />
		</TouchableOpacity>
	);
};

export default memo(ChannelListBackground);
