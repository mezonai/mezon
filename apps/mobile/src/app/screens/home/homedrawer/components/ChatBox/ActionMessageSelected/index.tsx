import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { resetCachedChatbox, resetCachedMessageActionNeedToResolve } from '../../../../../../utils/helpers';
import { EMessageActionType } from '../../../enums';
import type { IMessageActionNeedToResolve } from '../../../types';
import { styles } from './index.styles';

interface IActionMessageSelectedProps {
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	onClose: () => void;
}

export const ActionMessageSelected = memo(({ messageActionNeedToResolve, onClose }: IActionMessageSelectedProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['message']);
	const style = styles(themeValue);

	const handleCloseMessageAction = (type: EMessageActionType) => {
		switch (type) {
			case EMessageActionType.EditMessage:
				onClose();
				resetCachedMessageActionNeedToResolve(messageActionNeedToResolve?.targetMessage?.channel_id);
				resetCachedChatbox(messageActionNeedToResolve?.targetMessage?.channel_id);
				DeviceEventEmitter.emit(ActionEmitEvent.CLEAR_TEXT_INPUT);
				break;
			case EMessageActionType.Reply:
				onClose();
				break;
			default:
				break;
		}
	};

	return (
		<View style={style.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFill]}
			/>
			{messageActionNeedToResolve?.replyTo ? (
				<View style={style.replyContainer}>
					<Pressable onPress={() => handleCloseMessageAction(EMessageActionType.Reply)} style={style.closeButton}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</Pressable>
					<Text style={style.replyText}>
						{t('chatBox.replyingTo')} {messageActionNeedToResolve?.replyTo}
					</Text>
				</View>
			) : null}
			{messageActionNeedToResolve?.type === EMessageActionType.EditMessage ? (
				<View style={style.editContainer}>
					<Pressable onPress={() => handleCloseMessageAction(EMessageActionType.EditMessage)}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={20} width={20} color={themeValue.text} />
					</Pressable>
					<Text style={style.editText}>{t('chatBox.editingMessage')}</Text>
				</View>
			) : null}
		</View>
	);
});
