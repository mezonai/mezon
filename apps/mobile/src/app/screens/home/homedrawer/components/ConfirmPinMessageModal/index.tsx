import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor } from '@mezon/mobile-ui';
import { AppDispatch, getActiveMode, getCurrentChannelAndDm, pinMessageActions, selectCurrentClanId, UpdatePinMessage } from '@mezon/store-mobile';
import { isValidUrl } from '@mezon/transport';
import { IMessageWithUser } from '@mezon/utils';
import { useRoute } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Modal, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { SeparatorWithLine } from '../../../../../components/Common';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { EMessageActionType } from '../../enums';
import { styles } from './styles';

interface IConfirmPinMessageModalProps {
	isVisible: boolean;
	onClose: () => void;
	message: IMessageWithUser;
	type?: EMessageActionType;
}

export const ConfirmPinMessageModal = memo((props: IConfirmPinMessageModalProps) => {
	const { isVisible, message, onClose, type } = props;
	const isTabletLandscape = useTabletLandscape();
	const route = useRoute();
	const { params } = route;
	const dispatch = useDispatch<AppDispatch>();
	const { t } = useTranslation('message');
	const currentClanId = useSelector(selectCurrentClanId);
	const { currentChannel, currentDm } = useSelector(getCurrentChannelAndDm);

	const handleConfirmPinMessage = async () => {
		try {
			const mode = getActiveMode();
			const isDMMode = mode !== ChannelStreamMode.STREAM_MODE_CHANNEL && mode !== ChannelStreamMode.STREAM_MODE_THREAD;

			await dispatch(
				pinMessageActions.setChannelPinMessage({
					clan_id: message?.clan_id ?? '0',
					channel_id: message?.channel_id,
					message_id: message?.id,
					message: message
				})
			);

			const attachments = message.attachments?.filter((attach) => isValidUrl(attach.url || '')) || [];
			const jsonAttachments = attachments.length > 0 ? JSON.stringify(attachments) : '';
			const pinBody: UpdatePinMessage = {
				clanId: isDMMode ? '' : (currentClanId ?? ''),
				channelId: isDMMode ? currentDm?.id || '' : (currentChannel?.channel_id ?? ''),
				messageId: message?.id,
				isPublic: isDMMode ? false : currentChannel ? !currentChannel.channel_private : false,
				mode: mode as number,
				senderId: message.sender_id,
				senderUsername: message.display_name || message.username || message.user?.name || '',
				attachment: jsonAttachments,
				avatar: message.avatar || message.clan_avatar || '',
				content: JSON.stringify(message.content),
				createdTime: message.create_time_seconds ? new Date(message.create_time_seconds * 1000).toISOString() : ''
			};

			dispatch(pinMessageActions.joinPinMessage(pinBody));
		} catch (error) {
			console.error('Error pinning message:', error);
			Toast.show({
				type: 'error',
				props: {
					text2: t('pinError') || 'Failed to pin message'
				}
			});
		}
	};

	const onConfirm = async () => {
		switch (type) {
			case EMessageActionType.UnPinMessage:
				dispatch(
					pinMessageActions.deleteChannelPinMessage({
						channel_id: params?.['directMessageId'] ? params?.['directMessageId'] : message?.channel_id || '',
						message_id: message.id,
						clan_id: message?.clan_id
					})
				);
				break;
			case EMessageActionType.PinMessage:
				await handleConfirmPinMessage();
				break;
			default:
				break;
		}
		Toast.show({
			type: 'success',
			props: {
				text2: EMessageActionType.PinMessage === type ? t('pinSuccess') : t('unpinSuccess'),
				leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
			}
		});
		onClose();
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};
	return (
		<Modal
			visible={isVisible}
			animationType={'fade'}
			transparent={true}
			onRequestClose={onClose}
			supportedOrientations={['portrait', 'landscape']}
		>
			<View style={styles.wrapper}>
				<View style={[styles.container, isTabletLandscape && { maxWidth: '40%' }]}>
					<View>
						<Text style={styles.title}>{EMessageActionType.PinMessage === type ? t('pinMessage') : t('unpinMessage')}</Text>
						<SeparatorWithLine />
					</View>
					<Text style={styles.descriptionText}>
						{EMessageActionType.PinMessage === type ? t('confirmPinMessage') : t('confirmUnPinMessage')}
					</Text>
					<View style={styles.buttonsWrapper}>
						<TouchableOpacity onPress={() => onConfirm()} style={styles.yesButton}>
							<Text style={styles.buttonText}>{t('Yes')}</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => onClose()} style={styles.noButton}>
							<Text style={styles.buttonText}>{t('No')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
});
