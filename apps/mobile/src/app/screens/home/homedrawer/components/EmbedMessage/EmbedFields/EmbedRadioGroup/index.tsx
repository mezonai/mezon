import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { IMessageRatioOption } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { EmbedRadioButton } from '../EmbedRadioItem';

interface EmbedOptionRatioProps {
	options: IMessageRatioOption[];
	message_id: string;
	idRadio: string;
	max_options?: number;
	disabled?: boolean;
}

export const EmbedRadioGroup = ({ options, message_id, idRadio, max_options, disabled = false }: EmbedOptionRatioProps) => {
	const [checked, setChecked] = useState<string[]>([]);
	const dispatch = useAppDispatch();

	const handleCheckRadioButton = (option: IMessageRatioOption, radioId: string) => {
		if (!checkMultiple) {
			setChecked([option.value]);
			handleRadioValue(option?.value, radioId);
			return;
		}
		setChecked((prev) => {
			if (prev.includes(option?.value)) {
				return prev.filter((item) => item !== option?.value);
			}
			return [...prev, option?.value];
		});
		if (!max_options || checked.length < max_options || !checkMultiple || checked?.includes(option?.value)) {
			handleRadioValue(option?.value, radioId);
		}
	};

	const checkMultiple = useMemo(() => {
		if (options?.length > 1 && options[0]?.name) {
			return options[0].name !== options[1]?.name;
		}
		return false;
	}, [options]);

	const handleRadioValue = useCallback(
		(value: string, id: string) => {
			dispatch(
				embedActions.addEmbedValue({
					message_id: message_id,
					data: {
						id: id,
						value: value
					},
					multiple: checkMultiple,
					onlyChooseOne: !checkMultiple
				})
			);
		},
		[checkMultiple]
	);

	return (
		<View>
			{options?.length > 0 &&
				options.map((optionItem, optionIndex) => (
					<EmbedRadioButton
						key={`Embed_field_option_${optionItem}_${optionIndex}`}
						option={optionItem}
						checked={checked?.includes(optionItem?.value)}
						onCheck={() => handleCheckRadioButton(optionItem, idRadio)}
					/>
				))}
		</View>
	);
};
