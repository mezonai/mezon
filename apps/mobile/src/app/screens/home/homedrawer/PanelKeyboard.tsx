import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { EmitterSubscription } from 'react-native';
import { Animated, DeviceEventEmitter, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { createStyles } from './PanelKeyboard.styles';
import AdvancedFunction from './components/AdvancedFunction';
import Gallery from './components/AttachmentPicker/Gallery';
import HeaderAttachmentPicker from './components/AttachmentPicker/HeaderAttachmentPicker';
import EmojiPicker from './components/EmojiPicker';
import type { EMessageActionType } from './enums';
import type { IMessageActionNeedToResolve } from './types';

let lastKnownKeyboardHeight = Platform.OS === 'ios' ? 340 : 300;
let globalPanelKeyboardListener: EmitterSubscription | null = null;
let globalShowKeyboardListener: EmitterSubscription | null = null;
let activeInstanceId: string | null = null;
let activeKeyboardInstanceId: string | null = null;

interface IProps {
	directMessageId?: string;
	currentChannelId: string;
	currentClanId: string;
	messageAction?: EMessageActionType;
}
const PanelKeyboard = React.memo((props: IProps) => {
	const { themeValue } = useTheme();
	const [typeKeyboardBottomSheet, setTypeKeyboardBottomSheet] = useState<string>('text');
	const bottomPickerRef = useRef<BottomSheetModal>(null);
	const typeKeyboardBottomSheetRef = useRef<string>(null);
	const heightKeyboardShowRef = useRef<number>(0);
	const [heightKeyboardShow, setHeightKeyboardShow] = useState<number>(0);
	const [messageActionNeedToResolve, setMessageActionNeedToResolve] = useState<IMessageActionNeedToResolve | null>(null);
	const spacerHeightAnim = useRef(new Animated.Value(0)).current;
	const instanceIdRef = useRef(`panel-keyboard-${Date.now()}-${Math.random()}`);

	const styles = useMemo(() => createStyles(themeValue), [themeValue]);

	const snapPoints = useMemo(() => {
		const height = heightKeyboardShow > 0 ? heightKeyboardShow : 1;
		const validHeight = Math.max(1, height);
		return [validHeight, Platform.OS === 'ios' ? '95%' : '100%'];
	}, [heightKeyboardShow]);
	const getKeyboardHeightFromMetrics = useCallback(() => {
		return lastKnownKeyboardHeight;
	}, []);

	const applyKeyboardHeight = useCallback(
		(height: number) => {
			const validHeight = Math.max(0, Math.ceil(height));
			if (validHeight > 0) {
				lastKnownKeyboardHeight = validHeight;
			}
			spacerHeightAnim.stopAnimation();
			Animated.timing(spacerHeightAnim, {
				toValue: validHeight,
				duration: 200,
				useNativeDriver: false
			}).start();
			heightKeyboardShowRef.current = validHeight;
			setHeightKeyboardShow(validHeight);
			if (
				typeKeyboardBottomSheetRef.current !== 'advanced' &&
				!!typeKeyboardBottomSheetRef?.current &&
				typeKeyboardBottomSheetRef.current !== 'emoji' &&
				typeKeyboardBottomSheetRef.current !== 'attachment'
			) {
				bottomPickerRef?.current?.dismiss();
				bottomPickerRef?.current?.close();
			}
		},
		[spacerHeightAnim]
	);

	useFocusEffect(
		React.useCallback(() => {
			const currentInstanceId = instanceIdRef.current;
			activeKeyboardInstanceId = currentInstanceId;

			spacerHeightAnim.stopAnimation();
			spacerHeightAnim.setValue(0);
			heightKeyboardShowRef.current = 0;
			typeKeyboardBottomSheetRef.current = null;

			const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
			const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
			let fallbackTimeoutId: NodeJS.Timeout | null = null;

			const handleKeyboardShow = (e: { endCoordinates?: { height?: number } }) => {
				if (activeKeyboardInstanceId !== currentInstanceId) return;
				if (fallbackTimeoutId) {
					clearTimeout(fallbackTimeoutId);
					fallbackTimeoutId = null;
				}

				const eventHeight = e?.endCoordinates?.height || 0;
				const cachedHeight = getKeyboardHeightFromMetrics();
				const height = Math.max(eventHeight, cachedHeight);
				applyKeyboardHeight(height);
			};

			const handleKeyboardHide = () => {
				if (activeKeyboardInstanceId !== currentInstanceId) return;
				if (fallbackTimeoutId) {
					clearTimeout(fallbackTimeoutId);
					fallbackTimeoutId = null;
				}

				if (typeKeyboardBottomSheetRef.current !== 'text' && !!typeKeyboardBottomSheetRef?.current) {
					return;
				}
				heightKeyboardShowRef.current = 0;
				setHeightKeyboardShow(0);
				Animated.timing(spacerHeightAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: false
				}).start();
			};

			const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
			const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);

			const additionalShowEvent = Platform.OS === 'ios' ? 'keyboardDidShow' : 'keyboardWillShow';
			const additionalShowSub = Keyboard.addListener(additionalShowEvent, (e: { endCoordinates?: { height?: number } }) => {
				if (heightKeyboardShowRef.current === 0 && (e?.endCoordinates?.height ?? 0) > 0) {
					handleKeyboardShow(e);
				}
			});

			let intervalId: NodeJS.Timeout | null = null;
			if (Platform.OS === 'android') {
				intervalId = setInterval(() => {
					try {
						if (activeKeyboardInstanceId !== currentInstanceId) return;
						const isVisible = Keyboard.isVisible?.();
						if (isVisible && heightKeyboardShowRef.current === 0) {
							const height = getKeyboardHeightFromMetrics();
							if (height > 0) {
								applyKeyboardHeight(height);
							}
						}
					} catch {
						/* empty */
					}
				}, 500);
			}

			return () => {
				if (fallbackTimeoutId) {
					clearTimeout(fallbackTimeoutId);
				}
				if (intervalId) {
					clearInterval(intervalId);
				}
				showSub.remove();
				hideSub.remove();
				additionalShowSub.remove();
				spacerHeightAnim.stopAnimation();
				spacerHeightAnim.setValue(0);
				heightKeyboardShowRef.current = 0;
				setHeightKeyboardShow(0);
				bottomPickerRef?.current?.dismiss();
			};
		}, [spacerHeightAnim, applyKeyboardHeight, getKeyboardHeightFromMetrics])
	);

	const onShowKeyboardBottomSheet = useCallback(
		async (isShow: boolean, type?: string) => {
			const keyboardHeight = heightKeyboardShowRef.current ? heightKeyboardShowRef.current : lastKnownKeyboardHeight;
			const validHeight = Math.max(0, keyboardHeight);
			if (type !== 'force') {
				setTypeKeyboardBottomSheet(type);
				typeKeyboardBottomSheetRef.current = type;
			}
			if (isShow) {
				heightKeyboardShowRef.current = validHeight;
				setHeightKeyboardShow(validHeight);
				Animated.timing(spacerHeightAnim, {
					toValue: validHeight,
					duration: 200,
					useNativeDriver: false
				}).start();
				bottomPickerRef?.current?.present();
				Keyboard.dismiss();
			} else if (!isShow && typeKeyboardBottomSheetRef.current !== 'text' && (type !== 'text' || type === 'force' || !type)) {
				bottomPickerRef?.current?.dismiss();
				bottomPickerRef?.current?.close();
				Animated.timing(spacerHeightAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: false
				}).start();
				heightKeyboardShowRef.current = 0;
				setHeightKeyboardShow(0);
				setTypeKeyboardBottomSheet('text');
				typeKeyboardBottomSheetRef.current = 'text';
			}
		},
		[spacerHeightAnim]
	);

	useFocusEffect(
		useCallback(() => {
			const currentInstanceId = instanceIdRef.current;
			if (globalPanelKeyboardListener) {
				globalPanelKeyboardListener.remove();
				globalPanelKeyboardListener = null;
			}

			activeInstanceId = currentInstanceId;

			globalPanelKeyboardListener = DeviceEventEmitter.addListener(
				ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET,
				async ({ isShow = false, mode = '' }) => {
					if (activeInstanceId === currentInstanceId) {
						await onShowKeyboardBottomSheet(isShow, mode as string);
					}
				}
			);

			return () => {
				if (activeInstanceId === currentInstanceId) {
					if (globalPanelKeyboardListener) {
						globalPanelKeyboardListener.remove();
						globalPanelKeyboardListener = null;
					}
					activeInstanceId = null;
				}
			};
		}, [onShowKeyboardBottomSheet])
	);

	const onClose = useCallback(
		async (isFocusKeyboard = true) => {
			await onShowKeyboardBottomSheet(false, 'force');
			isFocusKeyboard && DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, {});
		},
		[onShowKeyboardBottomSheet]
	);

	useFocusEffect(
		useCallback(() => {
			const currentInstanceId = instanceIdRef.current;

			if (globalShowKeyboardListener) {
				globalShowKeyboardListener.remove();
				globalShowKeyboardListener = null;
			}

			globalShowKeyboardListener = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_KEYBOARD, (value) => {
				if (activeInstanceId === currentInstanceId) {
					setMessageActionNeedToResolve(value);
				}
			});

			return () => {
				if (activeInstanceId === currentInstanceId) {
					if (globalShowKeyboardListener) {
						globalShowKeyboardListener.remove();
						globalShowKeyboardListener = null;
					}
				}
			};
		}, [])
	);

	const handleSheetChange = async (index: number) => {
		if (index === -1) {
			setTypeKeyboardBottomSheet('text');
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, { isShow: false, mode: 'force' });
		}
	};

	return (
		<>
			<Animated.View style={[styles.spacerView, { height: spacerHeightAnim }]} />
			<BottomSheetModal
				ref={bottomPickerRef}
				snapPoints={snapPoints}
				index={0}
				animateOnMount
				animationConfigs={{
					duration: 200
				}}
				handleComponent={() => (
					<View style={styles.handleIndicatorContainer}>
						<View style={styles.handleIndicator} />
					</View>
				)}
				backgroundStyle={styles.backgroundBottomSheet}
				backdropComponent={null}
				enableDynamicSizing={false}
				enablePanDownToClose={true}
				onChange={handleSheetChange}
			>
				<LinearGradient
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFill]}
				/>
				<BottomSheetScrollView
					scrollEnabled={typeKeyboardBottomSheet !== 'attachment'}
					stickyHeaderIndices={[0]}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={typeKeyboardBottomSheet === 'emoji' ? styles.scrollViewContentFlex : undefined}
				>
					{typeKeyboardBottomSheet === 'attachment' ? (
						<View>
							<HeaderAttachmentPicker
								onCancel={onClose}
								messageAction={props?.messageAction}
								currentChannelId={props?.currentChannelId}
								currentClanId={props?.currentClanId}
							/>
							<Gallery currentChannelId={props?.currentChannelId} />
						</View>
					) : typeKeyboardBottomSheet === 'emoji' ? (
						<EmojiPicker
							onDone={onClose}
							bottomSheetRef={bottomPickerRef}
							directMessageId={props?.directMessageId || ''}
							messageActionNeedToResolve={messageActionNeedToResolve}
							channelId={props?.currentChannelId}
							messageAction={props?.messageAction}
						/>
					) : typeKeyboardBottomSheet === 'advanced' ? (
						<AdvancedFunction
							onClose={onClose}
							messageAction={props?.messageAction}
							directMessageId={props?.directMessageId || ''}
							currentChannelId={props?.currentChannelId}
						/>
					) : null}
				</BottomSheetScrollView>
			</BottomSheetModal>
		</>
	);
});
export default PanelKeyboard;
