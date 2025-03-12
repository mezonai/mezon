import BottomSheet from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Keyboard, Platform, View } from 'react-native';
import AttachmentPicker from './components/AttachmentPicker';
import BottomKeyboardPicker, { IModeKeyboardPicker } from './components/BottomKeyboardPicker';
import EmojiPicker from './components/EmojiPicker';
import { IMessageActionNeedToResolve } from './types';

interface IProps {
	directMessageId?: string;
	currentChannelId: string;
	currentClanId: string;
}
const PanelKeyboard = React.forwardRef((props: IProps, ref) => {
	const { themeValue, themeBasic } = useTheme();
	const [keyboardHeight, setKeyboardHeight] = useState<number>(Platform.OS === 'ios' ? 345 : 274);
	const [heightKeyboardShow, setHeightKeyboardShow] = useState<number>(0);
	const [typeKeyboardBottomSheet, setTypeKeyboardBottomSheet] = useState<IModeKeyboardPicker>('text');
	const bottomPickerRef = useRef<BottomSheet>(null);
	const timer = useRef<NodeJS.Timeout | null>(null);
	const animatedHeight = useRef(new Animated.Value(0)).current;
	const [messageActionNeedToResolve, setMessageActionNeedToResolve] = useState<IMessageActionNeedToResolve | null>(null);

	const onShowKeyboardBottomSheet = useCallback(
		(isShow: boolean, type?: IModeKeyboardPicker) => {
			if (isShow) {
				setHeightKeyboardShow(keyboardHeight);
				Animated.timing(animatedHeight, {
					toValue: keyboardHeight,
					duration: 200,
					useNativeDriver: false
				}).start();
				if (type === 'attachment') {
					Keyboard.dismiss();
				}
				timer.current = setTimeout(() => {
					setTypeKeyboardBottomSheet(type);
				}, 100);
			} else {
				setHeightKeyboardShow(0);
				Animated.timing(animatedHeight, {
					toValue: 0,
					duration: 200,
					useNativeDriver: false
				}).start();
				setTypeKeyboardBottomSheet('text');
				bottomPickerRef.current?.forceClose();
			}
		},
		[animatedHeight, keyboardHeight]
	);

	const keyboardWillShow = useCallback(
		(event) => {
			if (keyboardHeight !== event.endCoordinates.height) {
				setKeyboardHeight(event.endCoordinates.height <= 300 ? 300 : event.endCoordinates.height);
			}
		},
		[keyboardHeight]
	);

	useEffect(() => {
		const keyboardListener = Keyboard.addListener('keyboardDidShow', keyboardWillShow);

		return () => {
			keyboardListener.remove();
		};
	}, [keyboardWillShow]);

	useImperativeHandle(ref, () => ({
		onShowKeyboardBottomSheet
	}));

	useEffect(() => {
		return () => {
			timer?.current && clearTimeout(timer.current);
		};
	}, []);

	const onClose = useCallback(() => {
		onShowKeyboardBottomSheet(false, 'text');
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, {});
	}, [onShowKeyboardBottomSheet]);

	useEffect(() => {
		const showKeyboard = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_KEYBOARD, (value) => {
			setMessageActionNeedToResolve(value);
		});
		return () => {
			showKeyboard.remove();
		};
	}, []);

	return (
		<>
			<Animated.View
				style={{
					height: Platform.OS === 'ios' || typeKeyboardBottomSheet !== 'text' ? animatedHeight : 0,
					backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
				}}
			/>
			{heightKeyboardShow !== 0 && typeKeyboardBottomSheet !== 'text' && (
				<BottomKeyboardPicker height={heightKeyboardShow} ref={bottomPickerRef} isStickyHeader={typeKeyboardBottomSheet === 'emoji'}>
					{typeKeyboardBottomSheet === 'emoji' ? (
						<EmojiPicker
							onDone={onClose}
							bottomSheetRef={bottomPickerRef}
							directMessageId={props?.directMessageId || ''}
							messageActionNeedToResolve={messageActionNeedToResolve}
						/>
					) : typeKeyboardBottomSheet === 'attachment' ? (
						<AttachmentPicker currentChannelId={props?.currentChannelId} currentClanId={props?.currentClanId} onCancel={onClose} />
					) : (
						<View />
					)}
				</BottomKeyboardPicker>
			)}
		</>
	);
});
export default PanelKeyboard;
