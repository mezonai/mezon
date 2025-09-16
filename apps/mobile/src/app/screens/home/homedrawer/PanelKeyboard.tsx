import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Platform, View } from 'react-native';
import AttachmentPicker from './components/AttachmentPicker';
import EmojiPicker from './components/EmojiPicker';
import { IMessageActionNeedToResolve } from './types';

interface IProps {
	directMessageId?: string;
	currentChannelId: string;
	currentClanId: string;
}
const PanelKeyboard = React.memo((props: IProps) => {
	const { themeValue, themeBasic } = useTheme();
	const [heightKeyboardShow, setHeightKeyboardShow] = useState<number>(0);
	const [typeKeyboardBottomSheet, setTypeKeyboardBottomSheet] = useState<string>('text');
	const bottomPickerRef = useRef<BottomSheetModal>(null);
	const [messageActionNeedToResolve, setMessageActionNeedToResolve] = useState<IMessageActionNeedToResolve | null>(null);

	const onShowKeyboardBottomSheet = useCallback(async (isShow: boolean, type?: string) => {
		const keyboardHeight = Platform.OS === 'ios' ? 365 : 300;
		if (isShow) {
			bottomPickerRef?.current?.present();
			setHeightKeyboardShow(keyboardHeight);
			setTypeKeyboardBottomSheet(type);
			Keyboard.dismiss();
		} else {
			bottomPickerRef?.current?.dismiss();
			bottomPickerRef?.current?.close();
			setHeightKeyboardShow(0);
			setTypeKeyboardBottomSheet('text');
		}
	}, []);

	useEffect(() => {
		const eventListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, ({ isShow = false, mode = '' }) => {
			onShowKeyboardBottomSheet(isShow, mode as string);
		});

		return () => {
			eventListener.remove();
		};
	}, [onShowKeyboardBottomSheet]);

	const onClose = useCallback(
		(isFocusKeyboard = true) => {
			onShowKeyboardBottomSheet(false, 'text');
			isFocusKeyboard && DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, {});
		},
		[onShowKeyboardBottomSheet]
	);

	useEffect(() => {
		const showKeyboard = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_KEYBOARD, (value) => {
			setMessageActionNeedToResolve(value);
		});
		return () => {
			showKeyboard.remove();
		};
	}, []);

	const handleSheetChange = (index: number) => {
		if (index === -1) {
			setHeightKeyboardShow(0);
			setTypeKeyboardBottomSheet('text');
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, { isShow: false, mode: '' });
		}
	};

	return (
		<>
			<View
				style={{
					height: Platform.OS === 'ios' || typeKeyboardBottomSheet !== 'text' ? heightKeyboardShow : 0,
					backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
				}}
			/>
			<BottomSheetModal
				ref={bottomPickerRef}
				snapPoints={[heightKeyboardShow ? heightKeyboardShow : 1, '100%']}
				index={0}
				animateOnMount
				animationConfigs={{
					duration: 200
				}}
				backgroundStyle={{
					backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
				}}
				backdropComponent={null}
				enableDynamicSizing={false}
				enablePanDownToClose={true}
				handleIndicatorStyle={{
					backgroundColor: themeValue.tertiary,
					height: size.s_6,
					width: size.s_50
				}}
				onChange={handleSheetChange}
			>
				<BottomSheetScrollView
					scrollEnabled={true}
					stickyHeaderIndices={[0]}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={typeKeyboardBottomSheet === 'emoji' ? { flex: 1 } : undefined}
					style={{ minHeight: heightKeyboardShow }}
				>
					{typeKeyboardBottomSheet === 'attachment' ? (
						<AttachmentPicker currentChannelId={props?.currentChannelId} currentClanId={props?.currentClanId} onCancel={onClose} />
					) : typeKeyboardBottomSheet === 'emoji' ? (
						<EmojiPicker
							onDone={onClose}
							bottomSheetRef={bottomPickerRef}
							directMessageId={props?.directMessageId || ''}
							messageActionNeedToResolve={messageActionNeedToResolve}
						/>
					) : (
						<View />
					)}
				</BottomSheetScrollView>
			</BottomSheetModal>
		</>
	);
});
export default PanelKeyboard;
