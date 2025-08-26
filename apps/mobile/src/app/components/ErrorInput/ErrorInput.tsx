import { baseColor, size } from '@mezon/mobile-ui';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { styles } from './ErrorInput.style';

type ErrorInputProps = { errorMessage: string; style?: ViewStyle; isShowIcon?: boolean; textErrorStyle?: TextStyle };

export const ErrorInput = (props: ErrorInputProps) => {
	const { errorMessage, style, isShowIcon = true, textErrorStyle } = props;
	return (
		<View style={[styles.errorWrapper, style]}>
			{isShowIcon && <MezonIconCDN icon={IconCDN.circleExlaimionIcon} width={size.s_12} height={size.s_12} color={baseColor.redStrong} />}
			<Text style={[styles.textError, textErrorStyle]}>{errorMessage}</Text>
		</View>
	);
};
