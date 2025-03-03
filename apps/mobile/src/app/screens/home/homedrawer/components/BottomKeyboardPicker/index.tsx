import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useTheme } from '@mezon/mobile-ui';
import React, { Ref, forwardRef, memo } from 'react';
import { style } from './styles';

export type IModeKeyboardPicker = 'text' | 'emoji' | 'attachment';

interface IProps {
	height: number;
	children: React.ReactNode;
	isStickyHeader: boolean;
	isAlbumHeader?: boolean;
	changeBottomSheet?: (isShow: boolean) => void;
}

const BottomKeyboardPicker = forwardRef(function BottomKeyboardPicker(
	{ height = 1, children, isStickyHeader = false, isAlbumHeader = false, changeBottomSheet }: IProps,
	ref: Ref<BottomSheetMethods>
) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);

	const handleBottomSheet = (index) => {
		if (index === 1 && isAlbumHeader) {
			changeBottomSheet(true);
		} else {
			changeBottomSheet(false);
		}
	};

	return (
		<BottomSheet
			ref={ref}
			snapPoints={[height === 0 ? 1 : height, '100%']}
			animateOnMount
			backgroundStyle={{
				backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
			}}
			onChange={handleBottomSheet}
		>
			<BottomSheetScrollView stickyHeaderIndices={isStickyHeader ? [0] : []} style={styles.contentContainer}>
				{children}
			</BottomSheetScrollView>
		</BottomSheet>
	);
});

export default memo(BottomKeyboardPicker);
