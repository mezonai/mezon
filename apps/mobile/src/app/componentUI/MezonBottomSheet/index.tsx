import { BottomSheetModalProps, BottomSheetScrollView, BottomSheetModal as OriginalBottomSheet } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useTheme } from '@mezon/mobile-ui';
import React, { ReactNode, Ref, forwardRef, useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import Backdrop from './backdrop';
import { style } from './styles';

export interface IMezonBottomSheetProps extends BottomSheetModalProps {
	children: ReactNode;
	title?: string;
	titleSize?: 'sm' | 'md' | 'lg';
	headerLeft?: ReactNode;
	headerRight?: ReactNode;
	heightFitContent?: boolean;
	snapPoints?: string[];
	footer?: ReactNode;
	onBackdropPress?: () => void;
	enablePanDownToClose?: boolean;
}

const MezonBottomSheet = forwardRef(function MezonBottomSheet(props: IMezonBottomSheetProps, ref: Ref<BottomSheetModalMethods>) {
	//check later

	const { children, title, headerLeft, headerRight, heightFitContent, snapPoints = ['90%'], titleSize = 'sm', footer } = props;
	const isTabletLandscape = useTabletLandscape();
	const themeValue = useTheme().themeValue;
	const styles = useMemo(() => style(themeValue, isTabletLandscape), [isTabletLandscape, themeValue]);

	const renderHeader = useCallback(() => {
		if (title || headerLeft || headerRight) {
			return (
				<View style={styles.header}>
					<View style={[styles.sectionLeft]}>{headerLeft}</View>
					<Text style={[styles.sectionTitle, titleSize === 'md' ? styles.titleMD : {}]}>{title}</Text>
					<View style={[styles.sectionRight]}>{headerRight}</View>
				</View>
			);
		}

		return null;
	}, [title, headerLeft, headerRight, styles, titleSize]);

	return (
		<OriginalBottomSheet
			{...props}
			ref={ref}
			snapPoints={snapPoints}
			index={0}
			animateOnMount
			backgroundStyle={styles.backgroundStyle}
			backdropComponent={(prop) => <Backdrop {...prop} onBackdropPress={props?.onBackdropPress} />}
			enableDynamicSizing={heightFitContent}
			handleIndicatorStyle={styles.handleIndicator}
			style={styles.container}
		>
			{renderHeader()}
			<BottomSheetScrollView>{children}</BottomSheetScrollView>
			{footer && footer}
		</OriginalBottomSheet>
	);
});

export default React.memo(MezonBottomSheet);
