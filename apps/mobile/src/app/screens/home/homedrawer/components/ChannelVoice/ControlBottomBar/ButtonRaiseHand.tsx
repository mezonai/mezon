import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useMezon } from '@mezon/transport';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

const ButtonRaiseHand = ({ channelId }: { channelId: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { socketRef } = useMezon();

	const [isCooldown, setIsCooldown] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	const handleRaiseHand = useCallback(async () => {
		if (isCooldown) return;
		setIsCooldown(true);
		timerRef.current = setTimeout(() => {
			setIsCooldown(false);
		}, 5000);

		try {
			if (!socketRef.current) return;
			await socketRef.current.writeVoiceReaction([`raising:${'channelId'}`], BigInt(channelId));
		} catch (error) {
			console.error('Error sending raise hand:', error);
		}
	}, [channelId, isCooldown, socketRef]);

	return (
		<TouchableOpacity style={[styles.menuIcon]} onPress={handleRaiseHand} disabled={isCooldown}>
			<MezonIconCDN
				icon={IconCDN.raiseHandIcon}
				color={isCooldown ? baseColor.goldenrodYellow : themeValue.textStrong}
				height={size.s_32}
				width={size.s_32}
			/>
		</TouchableOpacity>
	);
};

export default React.memo(ButtonRaiseHand);
