import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { Block, Text, size, useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable } from 'react-native';
import { resetCachedMessageActionNeedToResolve } from '../../../../../../utils/helpers';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve } from '../../../types';

interface IActionMessageSelectedProps {
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	onClose: () => void;
}

export const ActionMessageSelected = memo(({ messageActionNeedToResolve, onClose }: IActionMessageSelectedProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['message']);

	const handleCloseMessageAction = (type: EMessageActionType) => {
		switch (type) {
			case EMessageActionType.EditMessage:
				onClose();
				resetCachedMessageActionNeedToResolve(messageActionNeedToResolve?.targetMessage?.channel_id);
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
		<Block flexDirection="column" backgroundColor={themeValue.primary}>
			{messageActionNeedToResolve?.replyTo ? (
				<Block
					flexDirection="row"
					alignItems="center"
					padding={size.tiny}
					gap={10}
					borderBottomWidth={1}
					borderBottomColor={themeValue.border}
				>
					<Pressable onPress={() => handleCloseMessageAction(EMessageActionType.Reply)}>
						<Icons.CircleXIcon height={20} width={20} color={themeValue.text} />
					</Pressable>
					<Text color={themeValue.text} h6>
						{t('chatBox.replyingTo')} {messageActionNeedToResolve?.replyTo}
					</Text>
				</Block>
			) : null}
			{messageActionNeedToResolve?.type === EMessageActionType.EditMessage ? (
				<Block
					flexDirection="row"
					alignItems="center"
					padding={size.tiny}
					gap={10}
					borderBottomWidth={1}
					borderBottomColor={themeValue.border}
				>
					<Pressable onPress={() => handleCloseMessageAction(EMessageActionType.EditMessage)}>
						<Icons.CircleXIcon height={20} width={20} color={themeValue.text} />
					</Pressable>
					<Text color={themeValue.text} h6>
						{t('chatBox.editingMessage')}
					</Text>
				</Block>
			) : null}
		</Block>
	);
});
