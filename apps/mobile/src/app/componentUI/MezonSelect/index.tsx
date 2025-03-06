import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useRef, useState } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import MezonFakeInputBox, { IMezonFakeBoxProps } from '../MezonFakeBox';
import MezonOption, { IMezonOptionData } from '../MezonOption';
import { style } from './styles';

type IMezonSelectProps = Omit<IMezonFakeBoxProps, 'onPress' | 'postfixIcon' | 'value'> & {
	onChange?: (value: number) => void;
	data: IMezonOptionData;
};

export default function MezonSelect({ data, onChange, ...props }: IMezonSelectProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [currentValue, setCurrentValue] = useState(data?.[0]?.value || 0);
	const [currentContent, setCurrentContent] = useState(data?.[0]?.title || 'unknown');
	const bottomSheetRef = useRef<BottomSheetModalMethods>();

	function handleChange(value: number) {
		setCurrentValue(value);
		setCurrentContent(data?.filter((item) => item.value === value)?.[0]?.title || 'unknown');
		bottomSheetRef?.current?.dismiss();
		onChange && onChange(value);
	}

	function handlePress() {
		bottomSheetRef?.current?.present();
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
				postfixIcon={<Icons.ChevronSmallDownIcon height={size.s_20} width={size.s_20} color={themeValue.text} />}
				value={currentContent}
				onPress={handlePress}
			/>
		</View>
	);
}
