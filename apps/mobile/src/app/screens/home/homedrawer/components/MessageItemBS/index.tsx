import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAnimatedState, useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { MezonBottomSheet } from '../../../../../../app/temp-ui';
import { EMessageBSToShow } from '../../enums';
import { IReplyBottomSheet } from '../../types/message.interface';
import { ContainerModal } from './ContainerModal';
import { style } from './styles';

export const MessageItemBS = React.memo((props: IReplyBottomSheet) => {
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { type, onClose, isOnlyEmojiPicker = false } = props;
	const [isShowEmojiPicker, setIsShowEmojiPicker] = useAnimatedState(false);

	const setVisibleBottomSheet = (isShow: boolean) => {
		if (bottomSheetRef) {
			if (isShow) {
				bottomSheetRef.current?.present();
			} else {
				bottomSheetRef.current?.close();
			}
		}
	};

	useEffect(() => {
		switch (type) {
			case EMessageBSToShow.MessageAction:
				setVisibleBottomSheet(true);
				break;
			case EMessageBSToShow.UserInformation:
				setVisibleBottomSheet(true);
				break;
			default:
				setVisibleBottomSheet(false);
		}
	}, [type, isShowEmojiPicker, isOnlyEmojiPicker]);

	const snapPoints = useMemo(() => {
		if (isShowEmojiPicker || isOnlyEmojiPicker) {
			return ['90%'];
		}
		if ([EMessageBSToShow.UserInformation].includes(type)) {
			return ['60%'];
		}
		return ['50%'];
	}, [isShowEmojiPicker, isOnlyEmojiPicker, type]);

	return (
		<MezonBottomSheet
			ref={bottomSheetRef}
			snapPoints={snapPoints}
			heightFitContent={true}
			onDismiss={() => {
				onClose();
				setIsShowEmojiPicker(false);
			}}
			style={styles.bottomSheet}
			handleComponent={() => {
				return (
					<View style={styles.bottomSheetBarWrapper}>
						<View style={styles.bottomSheetBar} />
					</View>
				);
			}}
		>
			<ContainerModal {...props} />
		</MezonBottomSheet>
	);
});
