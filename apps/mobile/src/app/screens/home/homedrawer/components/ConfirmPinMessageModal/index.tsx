import { CheckIcon } from '@mezon/mobile-components';
import { Colors } from '@mezon/mobile-ui';
import { AppDispatch, pinMessageActions } from '@mezon/store-mobile';
import { IMessageWithUser } from '@mezon/utils';
import { useRoute } from '@react-navigation/native';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { SeparatorWithLine } from '../../../../../components/Common';
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

	const onConfirm = async () => {
		switch (type) {
			case EMessageActionType.UnPinMessage:
				dispatch(
					pinMessageActions.deleteChannelPinMessage({
						channel_id: params?.['directMessageId'] ? params?.['directMessageId'] : message?.channel_id || '',
						message_id: message.id
					})
				);
				break;
			case EMessageActionType.PinMessage:
				await dispatch(
					pinMessageActions.setChannelPinMessage({
						clan_id: message?.clan_id ?? '0',
						channel_id: message?.channel_id,
						message_id: message?.id,
						message: message
					})
				);
				dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: message?.channel_id }));
				break;
			default:
				break;
		}
		Toast.show({
			type: 'success',
			props: {
				text2: EMessageActionType.PinMessage === type ? t('pinSuccess') : t('unpinSuccess'),
				leadingIcon: <CheckIcon color={Colors.green} />
			}
		});
		onClose();
	};
	return (
		<Modal
			isVisible={isVisible}
			animationIn={'fadeIn'}
			hasBackdrop={true}
			coverScreen={true}
			avoidKeyboard={false}
			backdropColor={'rgba(0,0,0, 0.7)'}
		>
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
		</Modal>
	);
});
