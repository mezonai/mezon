import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useRef, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { IMezonFakeBoxProps } from '../../../../../../../componentUI/MezonFakeBox';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../../../componentUI/MezonMenu';
import { style } from './styles';

type ISelectItem = {
	title: string;
	value: number | string;
};

type IMezonSelectProps = Omit<IMezonFakeBoxProps, 'onPress' | 'postfixIcon' | 'value'> & {
	onChange?: (item: ISelectItem) => void;
	placeholder?: string;
	data: ISelectItem[];
	defaultValue?: ISelectItem;
};

export default function MessageSelect({ data, placeholder, defaultValue, onChange, ...props }: IMezonSelectProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [currentContent, setCurrentContent] = useState(defaultValue?.title || placeholder);
	const bottomSheetRef = useRef<BottomSheetModalMethods>();

	function handleChange(item: ISelectItem) {
		setCurrentContent(item?.title || placeholder);
		bottomSheetRef?.current?.dismiss();
		onChange && onChange(item);
	}

	const menuOptions: IMezonMenuItemProps[] = data?.length
		? data.map((item) => {
				return {
					title: item?.title,
					onPress: () => handleChange(item)
				};
			})
		: [];

	const menu: IMezonMenuSectionProps[] = [
		{
			items: menuOptions
		}
	];

	function handlePress() {
		Keyboard.dismiss();
		const data = {
			heightFitContent: true,
			title: props.title,
			children: (
				<View style={styles.bsContainer}>
					<MezonMenu menu={menu} />
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}

	return (
		<View>
			<View style={styles.input}>
				<TouchableOpacity onPress={handlePress}>
					<View style={styles.fakeBox}>
						<Text style={styles.text}>{currentContent as string}</Text>
						<Icons.ChevronSmallDownIcon height={size.s_20} width={size.s_20} color={themeValue.text} />
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
