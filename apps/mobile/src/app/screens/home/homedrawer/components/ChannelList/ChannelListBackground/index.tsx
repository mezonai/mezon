import { size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentClan } from '@mezon/store-mobile';
import React, { memo, useEffect, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { style } from './styles';

interface IProps {
	onPress: () => void;
}

const ChannelListBackground = ({ onPress }: IProps) => {
	const currentClan = useSelector(selectCurrentClan);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const previousBanner = useRef<string | null>(null);

	useEffect(() => {
		previousBanner.current = currentClan?.banner || '';
	}, [currentClan?.banner]);

	const bannerToShow = !currentClan?.id || currentClan?.id === '0' ? previousBanner.current : currentClan?.banner;

	if (!bannerToShow) return null;

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, { height: size.s_70 * 2 }]}>
			<FastImage source={{ uri: bannerToShow }} style={{ flex: 1 }} resizeMode="cover" />
		</TouchableOpacity>
	);
};

export default memo(ChannelListBackground);
