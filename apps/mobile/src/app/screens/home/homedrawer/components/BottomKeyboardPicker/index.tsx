import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useTheme } from '@mezon/mobile-ui';
import React, { Ref, forwardRef, memo } from 'react';
import { View } from 'react-native';
import { style } from './styles';

export type IModeKeyboardPicker = 'text' | 'emoji' | 'attachment';

interface IProps {
	height: number;
	children: React.ReactNode;
	isStickyHeader?: boolean;
}

const BottomKeyboardPicker = forwardRef(function BottomKeyboardPicker(
	{ height = 1, children, isStickyHeader = false }: IProps,
	ref: Ref<BottomSheetMethods>
) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);

	return (
		<BottomSheet
			ref={ref}
			snapPoints={[height === 0 ? 1 : height, '100%']}
			animateOnMount
			backgroundStyle={{
				backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
			}}
		>
			<View
				// stickyHeaderIndices={isStickyHeader ? [0] : []}
				style={styles.contentContainer}
			>
				{children}
			</View>
		</BottomSheet>
	);
});

export default memo(BottomKeyboardPicker);
