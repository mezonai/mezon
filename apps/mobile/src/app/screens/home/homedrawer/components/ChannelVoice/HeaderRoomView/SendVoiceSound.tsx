import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useMezon } from '@mezon/transport';
import React, { memo, useCallback } from 'react';
import { DeviceEventEmitter, TouchableOpacity } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import ReactionSoundEffect from '../../EmojiPicker/StickerSelector/ReactionSoundEffect';
import { style } from '../styles';

type SendVoiceSoundProps = {
	channelId: string;
	onPress?: () => void;
};

const SendVoiceSound = memo(({ channelId, onPress }: SendVoiceSoundProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { socketRef } = useMezon();

	const handleSoundSelect = useCallback(
		async (soundId: string) => {
			try {
				if (!socketRef.current || !channelId) return;
				await socketRef.current.writeVoiceReaction([`sound:${soundId}`], channelId);
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				console.error('Error sending sound effect:', error);
			}
		},
		[channelId, socketRef]
	);

	const handleOpenSoundEffect = () => {
		const data = {
			snapPoints: ['45%', '75%'],
			children: <ReactionSoundEffect onSelected={handleSoundSelect} />,
			containerStyle: { zIndex: 1001 },
			backdropStyle: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		onPress?.();
	};

	return (
		<TouchableOpacity onPress={handleOpenSoundEffect} style={[styles.buttonCircle]}>
			<MezonIconCDN icon={IconCDN.activityIcon} height={size.s_20} width={size.s_20} color={themeValue.white} />
		</TouchableOpacity>
	);
});

export default React.memo(SendVoiceSound);
