import { size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { Fragment, forwardRef, memo, useImperativeHandle, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import AttachmentSwitcher from '../../AttachmentPicker/AttachmentSwitcher';
import { style } from '../ChatBoxBottomBar/style';

interface IChatMessageLeftAreaProps {
	isAvailableSending: boolean;
	isShowCreateThread?: boolean;
	modeKeyBoardBottomSheet: string;
	handleKeyboardBottomSheetMode: (mode: string) => void;
}

export interface IChatMessageLeftAreaRef {
	setAttachControlVisibility: (visible: boolean) => void;
}

export const ChatMessageLeftArea = memo(
	forwardRef<IChatMessageLeftAreaRef, IChatMessageLeftAreaProps>(
		({ isAvailableSending, isShowCreateThread, modeKeyBoardBottomSheet, handleKeyboardBottomSheetMode }, ref) => {
			const { themeValue } = useTheme();
			const styles = style(themeValue);
			const navigation = useNavigation<any>();
			const [isShowAttachControl, setIsShowAttachControl] = useState<boolean>(false);

			useImperativeHandle(ref, () => ({
				setAttachControlVisibility: (visible: boolean) => {
					if (visible === isShowAttachControl) return;

					setIsShowAttachControl(visible);
				}
			}));

			const handleCreateThread = () => {
				handleKeyboardBottomSheetMode('');
				navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
					screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD
				});
			};

			return (
				<View style={styles.wrapper}>
					{isAvailableSending && !isShowAttachControl ? (
						<TouchableOpacity style={[styles.btnIcon]} onPress={() => setIsShowAttachControl(!isShowAttachControl)}>
							<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} width={size.s_22} height={size.s_22} color={themeValue.textStrong} />
						</TouchableOpacity>
					) : (
						<Fragment>
							<AttachmentSwitcher onChange={handleKeyboardBottomSheetMode} mode={modeKeyBoardBottomSheet} />
							{isShowCreateThread && (
								<TouchableOpacity style={[styles.btnIcon, { marginLeft: size.s_6 }]} onPress={handleCreateThread}>
									<MezonIconCDN icon={IconCDN.threadPlusIcon} width={size.s_22} height={size.s_22} color={themeValue.textStrong} />
								</TouchableOpacity>
							)}
						</Fragment>
					)}
				</View>
			);
		}
	)
);
