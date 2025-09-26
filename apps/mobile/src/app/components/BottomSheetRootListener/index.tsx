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

type BottomSheetState = {
	snapPoints: string[];
	heightFitContent: boolean;
	children: any;
	title: string;
	headerLeft: any;
	headerRight: any;
	titleSize: string;
	hiddenHeaderIndicator: boolean;
	maxHeightPercent: string;
	containerStyle: StyleProp<ViewStyle>;
	backdropStyle: StyleProp<ViewStyle>;
};

const initialBottomSheetState: BottomSheetState = {
	snapPoints: ['90%'],
	heightFitContent: false,
	children: null,
	title: null,
	headerLeft: null,
	headerRight: null,
	titleSize: null,
	hiddenHeaderIndicator: false,
	maxHeightPercent: null,
	containerStyle: null,
	backdropStyle: null
};

const useBottomSheetState = () => {
	const [state, setState] = useState<BottomSheetState>(initialBottomSheetState);

	const clearDataBottomSheet = () => {
		setState(initialBottomSheetState);
	};

	return {
		...state,
		setAll: (updates: Partial<BottomSheetState>) => setState((prev) => ({ ...prev, ...updates })),
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
		hiddenHeaderIndicator,
		containerStyle,
		backdropStyle,
		setAll,
		clearDataBottomSheet
	} = useBottomSheetState();

	const ref = useRef<OriginalBottomSheet>(null);
	const { handleSheetPositionChange } = useBottomSheetBackHandler(ref);

	const onCloseBottomSheet = async () => {
		ref?.current?.close();
		await sleep(500);
		ref?.current?.forceClose();
	};

	const onTriggerBottomSheet = (data) => {
		const updates: Partial<BottomSheetState> = {};
		if (data?.snapPoints) updates.snapPoints = data.snapPoints;
		if (data?.heightFitContent !== undefined) updates.heightFitContent = data.heightFitContent;
		if (data?.children) updates.children = data.children;
		if (data?.title) updates.title = data.title;
		if (data?.headerLeft) updates.headerLeft = data.headerLeft;
		if (data?.headerRight) updates.headerRight = data.headerRight;
		if (data?.setTitleSize) updates.titleSize = data.setTitleSize;
		if (data?.hiddenHeaderIndicator !== undefined) updates.hiddenHeaderIndicator = data.hiddenHeaderIndicator;
		if (data?.containerStyle) updates.containerStyle = data.containerStyle;
		if (data?.backdropStyle) updates.backdropStyle = data.backdropStyle;
		if (data?.maxHeightPercent) updates.maxHeightPercent = data.maxHeightPercent;
		setAll(updates);
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
			style={styles.container}
			handleComponent={
				hiddenHeaderIndicator
					? null
					: () => {
							return <View style={styles.handleIndicator} />;
						}
			}
			containerStyle={containerStyle}
			animationConfigs={{
				duration: 200
			}}
			onChange={handleSheetPositionChange}
		>
			{renderHeader()}
			{children && (
				<BottomSheetScrollView bounces={false} keyboardShouldPersistTaps={'handled'}>
					{children}
				</BottomSheetScrollView>
			)}
		</OriginalBottomSheet>
	);
};

export default memo(BottomSheetRootListener, () => true);
