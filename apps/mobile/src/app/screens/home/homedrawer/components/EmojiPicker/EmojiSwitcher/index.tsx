import { size, useTheme } from '@mezon/mobile-ui';
import React, { memo, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';

export type IProps = {
	mode: string;
	onChange: (mode: string) => void;
};

function EmojiSwitcher({ mode: _mode, onChange }: IProps) {
	const { themeValue } = useTheme();
	const [mode, setMode] = useState<string>(_mode);

	const onPickerPress = () => {
		if (mode !== 'emoji') {
			onChange && onChange('emoji');
			setMode('emoji');
		} else {
			setMode('text');
			onChange && onChange('text');
		}
	};

	useEffect(() => {
		setMode(_mode);
	}, [_mode]);

	return (
		<View>
			<TouchableOpacity onPress={onPickerPress}>
				{mode !== 'emoji' ? (
					<MezonIconCDN icon={IconCDN.reactionIcon} width={size.s_22} height={size.s_22} color={themeValue.text} />
				) : (
					<MezonIconCDN icon={IconCDN.keyboardIcon} width={size.s_22} height={size.s_22} color={themeValue.text} />
				)}
			</TouchableOpacity>
		</View>
	);
}

export default memo(EmojiSwitcher);
