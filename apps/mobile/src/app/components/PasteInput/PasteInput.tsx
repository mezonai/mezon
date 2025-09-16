import React from 'react';
import { HostComponent, NativeSyntheticEvent, requireNativeComponent, StyleProp, TextInputProps, TextStyle } from 'react-native';
// Internal RN helpers to better align behavior with TextInput
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TextAncestor from 'react-native/Libraries/Text/TextAncestor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

export interface PasteImageEvent {
	uri: string;
}

export interface PasteInputProps extends TextInputProps {
	style?: StyleProp<TextStyle>;
	onPasteImage?: (e: NativeSyntheticEvent<PasteImageEvent>) => void;
}

export interface PasteInputRef {
	focus: () => void;
	blur: () => void;
	clear?: () => void;
	isFocused?: () => boolean;
	getNativeRef?: () => React.ElementRef<HostComponent<any>> | null;
}

// Ép kiểu để TypeScript hiểu đây là một React component có thể dùng trong JSX
const RNPasteInput: HostComponent<PasteInputProps> = requireNativeComponent<PasteInputProps>('PasteInput');

// Forward ref để component giống TextInput hơn (cần cho focus(), blur(), v.v.)
const PasteInput = React.forwardRef<PasteInputRef, PasteInputProps>((props, ref) => {
	const innerRef = React.useRef<React.ElementRef<HostComponent<any>> | null>(null);

	// Register with TextInputState for consistent focus/blur behavior
	React.useLayoutEffect(() => {
		const current = innerRef.current;
		if (current) {
			TextInputState.registerInput(current);
		}
		return () => {
			if (current) {
				TextInputState.unregisterInput(current);
				if (typeof TextInputState.currentlyFocusedInput === 'function' && TextInputState.currentlyFocusedInput() === current) {
					(current as any)?.blur?.();
				}
			}
		};
	}, []);

	const handleChange = (e: any) => {
		props.onChange?.(e);
		const text = e?.nativeEvent?.text;
		if (typeof text === 'string') props.onChangeText?.(text);
	};

	const handleFocus = (e: any) => {
		if (typeof TextInputState.focusInput === 'function') {
			TextInputState.focusInput(innerRef.current);
		}
		props.onFocus?.(e);
	};

	const handleBlur = (e: any) => {
		if (typeof TextInputState.blurInput === 'function') {
			TextInputState.blurInput(innerRef.current);
		}
		props.onBlur?.(e);
	};
	React.useImperativeHandle(ref, () => ({
		focus: () => innerRef.current?.focus?.(),
		blur: () => innerRef.current?.blur?.(),
		clear: () => (innerRef.current as any)?.clear?.(),
		isFocused: () => (innerRef.current as any)?.isFocused?.() ?? false,
		getNativeRef: () => innerRef.current
	}));

	const element = <RNPasteInput ref={innerRef} {...props} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />;

	return <TextAncestor.Provider value={true}>{element}</TextAncestor.Provider>;
});

export default PasteInput;
