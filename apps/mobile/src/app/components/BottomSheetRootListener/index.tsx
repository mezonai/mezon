import { BottomSheetScrollView, BottomSheetModal as OriginalBottomSheet } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Text, View } from 'react-native';
import Backdrop from '../../componentUI/MezonBottomSheet/backdrop';
import { style } from '../../componentUI/MezonBottomSheet/styles';
import useTabletLandscape from '../../hooks/useTabletLandscape';

const useBottomSheetState = () => {
	const [snapPoints, setSnapPoints] = useState(['90%']);
	const [heightFitContent, setHeightFitContent] = useState(false);
	const [children, setChildren] = useState<any>(null);
	const [title, setTitle] = useState<string>(null);
	const [headerLeft, setHeaderLeft] = useState<any>(null);
	const [headerRight, setHeaderRight] = useState<any>(null);
	const [titleSize, setTitleSize] = useState<string>(null);

	const clearDataBottomSheet = () => {
		setSnapPoints(['90%']);
		setHeightFitContent(false);
		setChildren(null);
		setTitle(null);
		setHeaderLeft(null);
		setHeaderRight(null);
		setTitleSize(null);
	};

	return {
		snapPoints,
		heightFitContent,
		children,
		title,
		headerLeft,
		headerRight,
		titleSize,
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
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
		setSnapPoints,
		setHeightFitContent,
		setChildren,
		setTitle,
		setHeaderLeft,
		setHeaderRight,
		setTitleSize,
		clearDataBottomSheet
	} = useBottomSheetState();

	const ref = useRef<OriginalBottomSheet>();

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
		if (data?.setTitleSize) setTitleSize(data.setTitleSize);
		ref?.current?.present();
	};

	useEffect(() => {
		const bottomSheetListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, ({ isDismiss, data }) => {
			clearDataBottomSheet();
			if (isDismiss) {
				onCloseBottomSheet();
			} else {
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
		>
			{renderHeader()}
			{children && <BottomSheetScrollView>{children}</BottomSheetScrollView>}
		</OriginalBottomSheet>
	);
};

export default memo(BottomSheetRootListener, () => true);
