import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { IMezonFakeBoxProps } from '../../../../../../../componentUI/MezonFakeBox';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../../../componentUI/MezonMenu';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
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

	function handleChange(item: ISelectItem) {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		setCurrentContent(item?.title || placeholder);
		onChange && onChange(item);
	}

	useEffect(() => {
		setCurrentContent(defaultValue?.title || placeholder);
	}, [defaultValue, placeholder]);

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
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
