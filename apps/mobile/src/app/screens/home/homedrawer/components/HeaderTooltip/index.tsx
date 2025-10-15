import { IOption } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import ChannelHeaderOptions from '../HeaderOptions';
import { style } from './styles';

type ITooltipHeaderProps = {
	onPressOption?: (option: IOption) => void;
	options: IOption[];
};

const HeaderTooltip = ({ onPressOption, options }: ITooltipHeaderProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isShowTooltip, setIsShowTooltip] = useState(false);

	const toggleTooltip = () => {
		setIsShowTooltip(!isShowTooltip);
	};

	const onPressOptionTooltip = useCallback(
		(option: IOption) => {
			onPressOption(option);
			setIsShowTooltip(false);
		},
		[onPressOption]
	);

	return (
		<View style={styles.tooltipButton}>
			<View style={styles.toolTipContainer}>
				<Tooltip
					isVisible={isShowTooltip}
					content={<ChannelHeaderOptions onPressOption={onPressOptionTooltip} options={options} />}
					contentStyle={styles.toolTip}
					arrowSize={{ width: 0, height: 0 }}
					placement="left"
					onClose={() => setIsShowTooltip(false)}
					closeOnBackgroundInteraction={true}
					disableShadow={true}
					closeOnContentInteraction={true}
				>
					{!isShowTooltip && (
						<TouchableOpacity onPress={toggleTooltip} style={styles.iconTooltip}>
							<MezonIconCDN icon={IconCDN.moreVerticalIcon} height={size.s_20} width={size.s_18} color={themeValue.text} />
						</TouchableOpacity>
					)}
				</Tooltip>
			</View>
		</View>
	);
};

export default HeaderTooltip;
