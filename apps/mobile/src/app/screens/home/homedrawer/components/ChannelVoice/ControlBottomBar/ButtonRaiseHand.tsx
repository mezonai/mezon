import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, selectMemberByIdAndClanId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

export const RAISE_HAND_COOLDOWN_MS = 10000;

type ButtonRaiseHandProps = {
	channelId: string;
	clanId: string;
};

const ButtonRaiseHand = ({ channelId, clanId }: ButtonRaiseHandProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { socketRef } = useMezon();

	const [isCooldown, setIsCooldown] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const useProfile = useSelector(selectAllAccount);
	const clanProfile = useSelector((state) => selectMemberByIdAndClanId(state, clanId, useProfile?.user?.id || ''));

	const senderName = useMemo(() => {
		if (!clanProfile) return '';
		return clanProfile?.clan_nick || clanProfile?.user?.display_name || clanProfile?.user?.username || '';
	}, [clanProfile]);

	const senderAvatar = useMemo(() => {
		if (!clanProfile) return '';
		return clanProfile?.clan_avatar || clanProfile?.user?.avatar_url || '';
	}, [clanProfile]);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	const startAutoLowerTimer = () => {
		if (timerRef.current) clearTimeout(timerRef.current);

		timerRef.current = setTimeout(() => {
			setIsCooldown(false);
			timerRef.current = null;
		}, RAISE_HAND_COOLDOWN_MS);
	};

	const handleRaiseHand = useCallback(async () => {
		if (!socketRef.current) return;

		try {
			if (isCooldown) {
				await socketRef.current.writeVoiceReaction([`raising-down:${channelId}`, senderName, senderAvatar], channelId);
				setIsCooldown(false);
			} else {
				await socketRef.current.writeVoiceReaction([`raising-up:${channelId}`, senderName, senderAvatar], channelId);
				setIsCooldown(true);
				startAutoLowerTimer();
			}
		} catch (error) {
			console.error('Error sending raise hand:', error);
		}
	}, [socketRef, isCooldown, channelId, senderName, senderAvatar]);

	return (
		<TouchableOpacity style={[styles.menuIcon]} onPress={handleRaiseHand}>
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
