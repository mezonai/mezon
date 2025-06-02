import { size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { Dispatch, Fragment, SetStateAction, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import AttachmentSwitcher from '../../AttachmentPicker/AttachmentSwitcher';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import { style } from '../MentionTextInput/style';

interface IChatMessageLeftAreaProps {
	isAvailableSending: boolean;
	isShowAttachControl: boolean;
	setIsShowAttachControl: Dispatch<SetStateAction<boolean>>;
	isShowCreateThread?: boolean;
	modeKeyBoardBottomSheet: IModeKeyboardPicker;
	handleKeyboardBottomSheetMode: (mode: IModeKeyboardPicker) => void;
}

export const ChatMessageLeftArea = memo(
	({
		isAvailableSending,
		isShowAttachControl,
		setIsShowAttachControl,
		isShowCreateThread,
		modeKeyBoardBottomSheet,
		handleKeyboardBottomSheetMode
	}: IChatMessageLeftAreaProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const navigation = useNavigation<any>();
		return (
			<View
				style={{
					flexDirection: 'row'
				}}
			>
				{isAvailableSending && !isShowAttachControl ? (
					<TouchableOpacity style={[styles.btnIcon]} onPress={() => setIsShowAttachControl(!isShowAttachControl)}>
						<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} width={size.s_22} height={size.s_22} color={themeValue.textStrong} />
					</TouchableOpacity>
				) : (
					<Fragment>
						<AttachmentSwitcher onChange={handleKeyboardBottomSheetMode} mode={modeKeyBoardBottomSheet} />
						{isShowCreateThread && (
							<TouchableOpacity
								style={[styles.btnIcon, { marginLeft: size.s_6 }]}
								onPress={() => navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD })}
							>
								<MezonIconCDN icon={IconCDN.threadPlusIcon} width={size.s_22} height={size.s_22} color={themeValue.textStrong} />
							</TouchableOpacity>
						)}
					</Fragment>
				)}
			</View>
		);
	}
);
