import { ActionEmitEvent } from '@mezon/mobile-components';
import { attachmentActions, AttachmentEntity, messagesActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiUser } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Platform, View } from 'react-native';
import { ImageListModal } from '../../../components/ImageListModal';
import { MessageItemBS } from './components';
import { ConfirmPinMessageModal } from './components/ConfirmPinMessageModal';
import ForwardMessageModal from './components/ForwardMessage';
import { ReportMessageModal } from './components/ReportMessageModal';
import { EMessageActionType, EMessageBSToShow } from './enums';
import { IConfirmActionPayload, IMessageActionPayload } from './types';

type ChannelMessageActionListenerProps = {
	mode: ChannelStreamMode;
	isPublic?: boolean;
	channelId: string;
	clanId: string;
};
let isHaveEventListenerRef = false;
let isHaveEventListenerImageRef = false;
const ChannelMessageActionListener = React.memo(({ mode, isPublic, clanId, channelId }: ChannelMessageActionListenerProps) => {
	const dispatch = useAppDispatch();
	const { socketRef } = useMezon();
	const [visibleImageModal, setVisibleImageModal] = useState<boolean>(false);
	const [imageSelected, setImageSelected] = useState<AttachmentEntity>();
	const [messageSelected, setMessageSelected] = useState<IMessageWithUser | null>(null);
	const [isOnlyEmojiPicker, setIsOnlyEmojiPicker] = useState<boolean>(false);
	const [senderDisplayName, setSenderDisplayName] = useState<string>('');
	const [userSelected, setUserSelected] = useState<ApiUser | null>(null);
	const [openBottomSheet, setOpenBottomSheet] = useState<EMessageBSToShow | null>(null);
	const [currentMessageActionType, setCurrentMessageActionType] = useState<EMessageActionType | null>(null);

	const onCloseModalImage = useCallback(() => {
		setVisibleImageModal(false);
	}, []);

	const onOpenImage = useCallback(
		async (image: AttachmentEntity) => {
			await dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }));
			setImageSelected(image);
			setVisibleImageModal(true);
		},
		[channelId, clanId, dispatch]
	);

	const onMessageAction = useCallback((payload: IMessageActionPayload) => {
		const { message, type, user, senderDisplayName, isOnlyEmoji = false } = payload;
		switch (type) {
			case EMessageBSToShow.MessageAction:
				setMessageSelected(message);
				setSenderDisplayName(senderDisplayName);
				setIsOnlyEmojiPicker(isOnlyEmoji);
				break;
			case EMessageBSToShow.UserInformation:
				setUserSelected(user);
				setMessageSelected(message);
				break;
			default:
				break;
		}
		Keyboard.dismiss();
		setOpenBottomSheet(type);
	}, []);

	const onDeleteMessage = useCallback(
		async (messageId: string) => {
			const socket = socketRef.current;
			dispatch(
				messagesActions.remove({
					channelId,
					messageId
				})
			);
			await socket.removeChatMessage(clanId || '', channelId, mode, isPublic, messageId);
		},
		[channelId, clanId, dispatch, isPublic, mode, socketRef]
	);

	const onConfirmAction = useCallback(
		(payload: IConfirmActionPayload) => {
			const { type, message } = payload;
			switch (type) {
				case EMessageActionType.DeleteMessage:
					onDeleteMessage(message?.id);
					break;
				case EMessageActionType.ForwardMessage:
				case EMessageActionType.Report:
				case EMessageActionType.PinMessage:
				case EMessageActionType.UnPinMessage:
					setCurrentMessageActionType(type);
					break;
				default:
					break;
			}
		},
		[onDeleteMessage, setCurrentMessageActionType]
	);

	useEffect(() => {
		if (!isHaveEventListenerRef) {
			const eventOpenMessageAction = DeviceEventEmitter.addListener(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, onMessageAction);
			const messageItemBSListener = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_INFO_USER_BOTTOM_SHEET, ({ isHiddenBottomSheet }) => {
				isHiddenBottomSheet && setOpenBottomSheet(null);
			});
			isHaveEventListenerRef = true;
			return () => {
				eventOpenMessageAction.remove();
				messageItemBSListener.remove();
				isHaveEventListenerRef = false;
			};
		}
	}, [onMessageAction]);

	useEffect(() => {
		if (!isHaveEventListenerImageRef || Platform.OS === 'ios') {
			const eventOpenImage = DeviceEventEmitter.addListener(ActionEmitEvent.ON_OPEN_IMAGE_DETAIL_MESSAGE_ITEM, onOpenImage);
			isHaveEventListenerImageRef = true;
			return () => {
				eventOpenImage.remove();
				isHaveEventListenerImageRef = false;
			};
		}
	}, [onOpenImage]);

	return (
		<View>
			{visibleImageModal && (
				<ImageListModal channelId={channelId} visible={visibleImageModal} onClose={onCloseModalImage} imageSelected={imageSelected} />
			)}
			<MessageItemBS
				mode={mode}
				message={messageSelected}
				onConfirmAction={onConfirmAction}
				type={openBottomSheet}
				isOnlyEmojiPicker={isOnlyEmojiPicker}
				onClose={() => {
					setOpenBottomSheet(null);
				}}
				user={userSelected}
				senderDisplayName={senderDisplayName}
				isPublic={isPublic}
			/>
			{currentMessageActionType === EMessageActionType.ForwardMessage && (
				<ForwardMessageModal
					show={currentMessageActionType === EMessageActionType.ForwardMessage}
					onClose={() => setCurrentMessageActionType(null)}
					message={messageSelected}
					isPublic={isPublic}
				/>
			)}

			{currentMessageActionType === EMessageActionType.Report && (
				<ReportMessageModal
					isVisible={currentMessageActionType === EMessageActionType.Report}
					onClose={() => setCurrentMessageActionType(null)}
					message={messageSelected}
				/>
			)}

			{[EMessageActionType.PinMessage, EMessageActionType.UnPinMessage].includes(currentMessageActionType) && (
				<ConfirmPinMessageModal
					isVisible={[EMessageActionType.PinMessage, EMessageActionType.UnPinMessage].includes(currentMessageActionType)}
					onClose={() => setCurrentMessageActionType(null)}
					message={messageSelected}
					type={currentMessageActionType}
				/>
			)}
		</View>
	);
});

export default ChannelMessageActionListener;
