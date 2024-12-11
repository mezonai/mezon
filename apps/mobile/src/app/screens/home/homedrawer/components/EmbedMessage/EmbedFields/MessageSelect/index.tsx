import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useRef, useState } from 'react';
import { Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { IMezonMenuItemProps, IMezonMenuSectionProps, MezonBottomSheet, MezonMenu } from '../../../../../../../componentUI';
import { IMezonFakeBoxProps } from '../../../../../../../componentUI/MezonFakeBox';
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
	const [currentValue, setCurrentValue] = useState(defaultValue);
	const [currentContent, setCurrentContent] = useState(defaultValue?.title || placeholder);
	const bottomSheetRef = useRef<BottomSheetModalMethods>();

	function handleChange(item: ISelectItem) {
		setCurrentValue(item);
		setCurrentContent(data?.filter((item) => item.value === item?.value)?.[0]?.title || placeholder);
		bottomSheetRef?.current?.dismiss();
		onChange && onChange(item);
	}

	function handlePress() {
		Keyboard.dismiss();
		bottomSheetRef?.current?.present();
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
			<MezonBottomSheet ref={bottomSheetRef} heightFitContent title={props.title}>
				<View style={styles.bsContainer}>
					<MezonMenu menu={menu} />
				</View>
			</MezonBottomSheet>
		</View>
	);
}
