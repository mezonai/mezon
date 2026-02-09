import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { handleAddAgentToVoice, handleKichAgentFromVoice, selectVoiceInfo, useAppDispatch } from '@mezon/store-mobile';
import React, { memo, useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

const SendVoiceSound = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentVoice = useSelector(selectVoiceInfo);
	const [onAgent, setOnAgent] = useState(false);
	const dispatch = useAppDispatch();

	const handleAddAgent = useCallback(() => {
		if (!currentVoice) {
			return;
		}
		setOnAgent(!onAgent);

		if (!onAgent) {
			dispatch(handleAddAgentToVoice({ channel_id: currentVoice?.channelId, room_name: currentVoice?.roomId || '' }));
		} else {
			dispatch(handleKichAgentFromVoice({ channel_id: currentVoice?.channelId, room_name: currentVoice?.roomId || '' }));
		}
	}, [currentVoice, dispatch, onAgent]);

	return (
		<TouchableOpacity onPress={handleAddAgent} style={[styles.buttonCircle, onAgent && styles.buttonAgentActive]}>
			<MezonIconCDN icon={IconCDN.agentIcon} height={size.s_20} width={size.s_20} color={onAgent ? baseColor.white : themeValue.white} />
		</TouchableOpacity>
	);
});

export default React.memo(SendVoiceSound);
