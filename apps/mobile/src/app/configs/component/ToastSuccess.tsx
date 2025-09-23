import { size, useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { View } from 'react-native';
import type { ToastConfigParams } from 'react-native-toast-message';
import { BaseToast } from 'react-native-toast-message';
import { style } from '../styles';

const WrapperIcon = ({ children }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return <View style={styles.iconWrapper}>{children}</View>;
};

export const ToastSuccess = memo((props: ToastConfigParams<any>) => {
	const { text1Style, text2Style, props: data } = props;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const containerStyle = data?.customStyle ? [styles.container, data.customStyle] : styles.container;

	return (
		<BaseToast
			style={containerStyle}
			contentContainerStyle={{ paddingHorizontal: size.s_20 }}
			text1Style={[
				{
					fontSize: size.label,
					color: themeValue.text
				},
				text1Style
			]}
			text2Style={[
				{
					fontSize: size.medium,
					color: themeValue.text
				},
				text2Style
			]}
			text1={data?.text1}
			text2={data?.text2}
			text2NumberOfLines={2}
			renderLeadingIcon={() => <WrapperIcon>{data?.leadingIcon}</WrapperIcon>}
			renderTrailingIcon={() => <WrapperIcon>{data?.trailingIcon}</WrapperIcon>}
		/>
	);
});
