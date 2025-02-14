import { ArrowLeftIcon, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React, { ReactNode } from 'react';
import { Keyboard, Modal, ModalBaseProps, Pressable, Text, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../configs/toastConfig';
import { style as _style } from './style';

interface IMezonModalProps extends Pick<ModalBaseProps, 'animationType'> {
	visible: boolean;
	visibleChange?: (value: boolean) => void;
	title?: ReactNode | string;
	titleStyle?: ViewStyle;
	children: JSX.Element | ReactNode;
	confirmText?: string;
	onConfirm?: () => void | undefined;
	style?: ViewStyle;
	headerStyles?: ViewStyle;
	onBack?: () => void;
	rightClose?: boolean;
	visibleBackButton?: boolean;
	rightBtnText?: string;
	onClickRightBtn?: () => void | undefined;
	containerStyle?: ViewStyle;
}

export const MezonModal = (props: IMezonModalProps) => {
	const { themeValue } = useTheme();
	const styles = _style(themeValue);
	const {
		visible,
		visibleChange,
		onConfirm = undefined,
		confirmText,
		children,
		title,
		titleStyle = {},
		style = {},
		animationType = 'slide',
		headerStyles = {},
		onBack,
		rightClose = false,
		visibleBackButton = false,
		rightBtnText,
		onClickRightBtn,
		containerStyle
	} = props;

	const setVisible = (value: boolean) => {
		if (visibleChange && typeof visibleChange === 'function') {
			visibleChange(value);
		}
	};

	const pressConfirm = () => {
		if (onConfirm && typeof onConfirm === 'function') {
			onConfirm();
		}
	};

	const isTitleString = typeof title === 'string';
	const isEmptyHeader = !title || !confirmText;

	return (
		<Modal visible={visible} animationType={animationType} transparent={true}>
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={[styles.container, containerStyle]}>
					{rightClose ? (
						<View style={[styles.headerWrapper, isEmptyHeader && styles.bgDefault, headerStyles]}>
							{visibleBackButton ? (
								<Pressable onPress={() => onBack && onBack()}>
									<ArrowLeftIcon height={size.s_20} width={size.s_20} />
								</Pressable>
							) : (
								<View />
							)}
							<Pressable onPress={() => setVisible(false)}>
								<Icons.CloseIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />
							</Pressable>
						</View>
					) : (
						<View style={[styles.headerWrapper, isEmptyHeader && styles.bgDefault, headerStyles]}>
							<View style={styles.headerContent}>
								<Pressable onPress={() => setVisible(false)}>
									<Icons.CloseIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />
								</Pressable>
								{isTitleString ? (
									<Text style={[styles.textTitle, titleStyle]}>{title}</Text>
								) : (
									<View style={titleStyle}>{title}</View>
								)}
								<View style={{ width: size.s_60 }}>
									{rightBtnText ? (
										<Pressable onPress={() => onClickRightBtn()}>
											<Text style={styles.confirm}>{rightBtnText}</Text>
										</Pressable>
									) : null}
								</View>
							</View>
							{confirmText ? (
								<Pressable onPress={() => pressConfirm()}>
									<Text style={styles.confirm}>{confirmText}</Text>
								</Pressable>
							) : (
								<View />
							)}
						</View>
					)}
					<View style={[styles.fill, style]}>{children}</View>
				</View>
			</TouchableWithoutFeedback>
			<Toast config={toastConfig} />
		</Modal>
	);
};
