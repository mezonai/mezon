import { BottomSheetModalProps, BottomSheetScrollView, BottomSheetModal as OriginalBottomSheet } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { sleep } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, DeviceEventEmitter, Keyboard, NativeEventSubscription, StyleProp, Text, View, ViewStyle } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import Backdrop from './backdrop';
import { style } from './styles';

const useBottomSheetBackHandler = (bottomSheetRef: React.RefObject<OriginalBottomSheet | null>) => {
	const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(null);
	const handleSheetPositionChange = useCallback<NonNullable<BottomSheetModalProps['onChange']>>(
		(index) => {
			const isBottomSheetVisible = index >= 0;
			if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
				backHandlerSubscriptionRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
					bottomSheetRef.current?.dismiss();
					return true;
				});
			} else if (!isBottomSheetVisible) {
				backHandlerSubscriptionRef.current?.remove();
				backHandlerSubscriptionRef.current = null;
			}
		},
		[bottomSheetRef, backHandlerSubscriptionRef]
	);
	return { handleSheetPositionChange };
};

const useBottomSheetState = () => {
	const [snapPoints, setSnapPoints] = useState(['90%']);
	const [heightFitContent, setHeightFitContent] = useState(false);
	const [children, setChildren] = useState<any>(null);
	const [title, setTitle] = useState<string>(null);
	const [headerLeft, setHeaderLeft] = useState<any>(null);
	const [headerRight, setHeaderRight] = useState<any>(null);
	const [titleSize, setTitleSize] = useState<string>(null);
	const [hiddenHeaderIndicator, setHiddenHeaderIndicator] = useState<boolean>(false);
	const [containerStyle, setContainerStyle] = useState<StyleProp<ViewStyle>>(null);
	const [backdropStyle, setBackdropStyle] = useState<StyleProp<ViewStyle>>(null);

	const clearDataBottomSheet = () => {
		setSnapPoints(['90%']);
		setHeightFitContent(false);
		setChildren(null);
		setTitle(null);
		setHeaderLeft(null);
		setHeaderRight(null);
		setTitleSize(null);
		setHiddenHeaderIndicator(false);
		setContainerStyle(null);
		setBackdropStyle(null);
	};

	return {
		snapPoints,
		heightFitContent,
		children,
		title,
		headerLeft,
		headerRight,
		titleSize,
		hiddenHeaderIndicator,
		containerStyle,
		backdropStyle,
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
		clearDataBottomSheet,
		setHiddenHeaderIndicator,
		setContainerStyle,
		setBackdropStyle
	};
};

const BottomSheetRootListener = () => {
	const {
		snapPoints,
		heightFitContent,
		children,
		title,
		headerLeft,
		headerRight,
		titleSize,
		hiddenHeaderIndicator,
		containerStyle,
		backdropStyle,
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
		clearDataBottomSheet,
		setHiddenHeaderIndicator,
		setContainerStyle,
		setBackdropStyle
	} = useBottomSheetState();

	const ref = useRef<OriginalBottomSheet>(null);
	const { handleSheetPositionChange } = useBottomSheetBackHandler(ref);

	const onCloseBottomSheet = async () => {
		ref?.current?.close();
		await sleep(500);
		ref?.current?.forceClose();
	};

	const onTriggerBottomSheet = (data) => {
		if (data?.snapPoints) setSnapPoints(data.snapPoints);
		if (data?.heightFitContent) setHeightFitContent(data.heightFitContent);
		if (data?.children) setChildren(data.children);
		if (data?.title) setTitle(data.title);
		if (data?.headerLeft) setHeaderLeft(data.headerLeft);
		if (data?.headerRight) setHeaderRight(data.headerRight);
		if (data?.setTitleSize) setTitleSize(data.setTitleSize);
		if (data?.hiddenHeaderIndicator) setHiddenHeaderIndicator(data.hiddenHeaderIndicator);
		if (data?.containerStyle) setContainerStyle(data.containerStyle);
		if (data?.backdropStyle) setBackdropStyle(data.backdropStyle);
		ref?.current?.present();
	};

	useEffect(() => {
		const bottomSheetListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, ({ isDismiss, data }) => {
			clearDataBottomSheet();
			if (isDismiss || !data) {
				onCloseBottomSheet();
			} else {
				Keyboard.dismiss();
				onTriggerBottomSheet(data);
			}
		});
		return () => {
			bottomSheetListener.remove();
		};
	}, []);

	const isTabletLandscape = useTabletLandscape();
	const themeValue = useTheme().themeValue;
	const styles = useMemo(() => style(themeValue, isTabletLandscape), [isTabletLandscape, themeValue]);

	const renderHeader = useCallback(() => {
		if (title || headerLeft || headerRight) {
			return (
				<View style={styles.header}>
					<View style={styles.sectionLeft}>{headerLeft}</View>
					<Text style={[styles.sectionTitle, titleSize === 'md' ? styles.titleMD : {}]}>{title}</Text>
					<View style={styles.sectionRight}>{headerRight}</View>
				</View>
			);
		}
		return null;
	}, [title, headerLeft, headerRight, styles, titleSize]);

	return (
		<OriginalBottomSheet
			ref={ref}
			snapPoints={heightFitContent ? null : snapPoints}
			index={0}
			animateOnMount
			backgroundStyle={styles.backgroundStyle}
			backdropComponent={(prop) => <Backdrop {...prop} style={backdropStyle} />}
			enableDynamicSizing={heightFitContent}
			handleIndicatorStyle={styles.handleIndicator}
			style={styles.container}
			containerStyle={containerStyle}
			animationConfigs={{
				duration: 200
			}}
			onChange={handleSheetPositionChange}
			handleComponent={
				hiddenHeaderIndicator
					? null
					: () => {
							return <View style={styles.handleIndicator} />;
						}
			}
		>
			{renderHeader()}
			{children && <BottomSheetScrollView>{children}</BottomSheetScrollView>}
		</OriginalBottomSheet>
	);
};

export default memo(BottomSheetRootListener, () => true);
