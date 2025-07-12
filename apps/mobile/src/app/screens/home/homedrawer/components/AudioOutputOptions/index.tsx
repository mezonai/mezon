import { size, useTheme } from '@mezon/mobile-ui';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { AudioOutput } from '../ChannelVoice';
import { style } from './styles';

interface IAudioOutputOptionsProps {
	onSelectOutput?: (outputType: string) => void;
	availableOutputs: AudioOutput[];
	currentOutput: string;
}

const AudioOutputOptions = ({ onSelectOutput, availableOutputs, currentOutput }: IAudioOutputOptionsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handleSelectOutput = (outputType: string) => {
		onSelectOutput?.(outputType);
	};

	const getOutputIcon = (outputType: string) => {
		switch (outputType) {
			case 'bluetooth':
				return <MezonIconCDN icon={IconCDN.bluetoothIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />;
			case 'speaker':
				return <MezonIconCDN icon={IconCDN.channelVoice} height={size.s_18} width={size.s_18} color={themeValue.text} />;
			case 'headphones':
				return <MezonIconCDN icon={IconCDN.voiceLowIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />;
			case 'earpiece':
			default:
				return <MezonIconCDN icon={IconCDN.voiceLowIcon} height={size.s_18} width={size.s_20} color={themeValue.text} />;
		}
	};

	const getOutputLabel = (output: AudioOutput) => {
		const labels = {
			speaker: 'Speaker',
			earpiece: 'Earpiece',
			bluetooth: 'Bluetooth',
			headphones: 'Headphones'
		};
		return labels[output.type] || output.name;
	};

	const OutputItem = ({ output }: { output: AudioOutput }) => {
		const isSelected = output.id === currentOutput;

		return (
			<TouchableOpacity onPress={() => handleSelectOutput(output.id)}>
				<View style={[styles.wrapperOption, isSelected && styles.selectedOption]}>
					{getOutputIcon(output.type)}
					<View style={styles.content}>
						<Text numberOfLines={1} ellipsizeMode="tail" style={[styles.textOption, isSelected && styles.selectedText]}>
							{getOutputLabel(output)}
						</Text>
						{isSelected && (
							<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} height={size.s_16} width={size.s_16} color={themeValue.text} />
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.optionContainer}>
			{availableOutputs?.map((output, index) => <OutputItem output={output} key={`audio_output_${output.id}_${index}`} />)}
		</View>
	);
};

export default AudioOutputOptions;
