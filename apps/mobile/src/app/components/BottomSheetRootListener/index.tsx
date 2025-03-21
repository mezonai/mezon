import { BottomSheetModalProps, BottomSheetScrollView, BottomSheetModal as OriginalBottomSheet } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, DeviceEventEmitter, Keyboard, NativeEventSubscription, Text, View } from 'react-native';
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
	const [isStickyHeader, setIsStickyHeader] = useState<boolean>(false);

	const clearDataBottomSheet = () => {
		setSnapPoints(['90%']);
		setHeightFitContent(false);
		setChildren(null);
		setTitle(null);
		setHeaderLeft(null);
		setHeaderRight(null);
		setTitleSize(null);
		setIsStickyHeader(false);
	};

	return {
		snapPoints,
		heightFitContent,
		children,
		title,
		headerLeft,
		headerRight,
		titleSize,
		isStickyHeader,
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
		setIsStickyHeader,
		clearDataBottomSheet
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
		isStickyHeader,
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
		setIsStickyHeader,
		clearDataBottomSheet
	} = useBottomSheetState();

	const ref = useRef<OriginalBottomSheet>();
	const { handleSheetPositionChange } = useBottomSheetBackHandler(ref);

	const onCloseBottomSheet = () => {
		ref?.current?.close();
	};

	const onTriggerBottomSheet = (data) => {
		if (data?.snapPoints) setSnapPoints(data.snapPoints);
		if (data?.heightFitContent) setHeightFitContent(data.heightFitContent);
		if (data?.children) setChildren(data.children);
		if (data?.title) setTitle(data.title);
		if (data?.headerLeft) setHeaderLeft(data.headerLeft);
		if (data?.headerRight) setHeaderRight(data.headerRight);
		if (data?.titleSize) setTitleSize(data.titleSize);
		if (data?.isStickyHeader) setIsStickyHeader(data.isStickyHeader);
		ref?.current?.present();
	};

	useEffect(() => {
		const bottomSheetListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, ({ isDismiss, data }) => {
			clearDataBottomSheet();
			if (isDismiss) {
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
			snapPoints={snapPoints}
			index={0}
			animateOnMount
			backgroundStyle={styles.backgroundStyle}
			backdropComponent={(prop) => <Backdrop {...prop} />}
			enableDynamicSizing={heightFitContent}
			handleIndicatorStyle={styles.handleIndicator}
			style={styles.container}
			onChange={handleSheetPositionChange}
		>
			{renderHeader()}
			{children && <BottomSheetScrollView stickyHeaderIndices={isStickyHeader ? [0] : []}>{children}</BottomSheetScrollView>}
		</OriginalBottomSheet>
	);
};

export default memo(BottomSheetRootListener, () => true);
