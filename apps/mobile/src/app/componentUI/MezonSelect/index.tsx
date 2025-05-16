import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useMemo, useState } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { IconCDN } from '../../constants/icon_cdn';
import MezonFakeInputBox, { IMezonFakeBoxProps } from '../MezonFakeBox';
import MezonIconCDN from '../MezonIconCDN';
import MezonOption, { IMezonOptionData } from '../MezonOption';
import { style } from './styles';

type IMezonSelectProps = Omit<IMezonFakeBoxProps, 'onPress' | 'postfixIcon' | 'value'> & {
	onChange?: (value: number | string) => void;
	data: IMezonOptionData;
	initValue?: number | string;
};

export default function MezonSelect({ data, onChange, initValue, ...props }: IMezonSelectProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [currentValue, setCurrentValue] = useState(initValue || data?.[0]?.value || 0);
	const initContent = useMemo(() => data?.find((item) => item?.value === initValue)?.title, [data, initValue]);
	const [currentContent, setCurrentContent] = useState(initContent || data?.[0]?.title || 'unknown');

	function handleChange(value: number) {
		setCurrentValue(value);
		setCurrentContent(data?.filter((item) => item.value === value)?.[0]?.title || 'unknown');
		onChange && onChange(value);
	}

	function handlePress() {
		const dataBottomSheet = {
			heightFitContent: true,
			title: props.title,
			children: (
				<View style={styles.bsContainer}>
					<MezonOption data={data} onChange={handleChange} value={currentValue} />
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data: dataBottomSheet });
	}

	return (
		<View>
			<MezonFakeInputBox
				{...props}
				postfixIcon={<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />}
				value={currentContent}
				onPress={handlePress}
			/>
		</View>
	);
}
