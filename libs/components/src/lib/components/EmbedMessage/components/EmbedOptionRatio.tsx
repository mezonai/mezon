import { embedActions } from '@mezon/store';
import { IMessageRatioOption } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { MessageRatioButton } from '../../MessageActionsPanel/components/MessageRatio';
import { EmbedDescription } from './EmbedDescription';
import { EmbedTitle } from './EmbedTitle';

interface EmbedOptionRatioProps {
	options: IMessageRatioOption[];
	message_id: string;
	idRadio: string;
	max_options?: number;
	disabled?: boolean;
}

export function EmbedOptionRatio({ options, message_id, idRadio, max_options }: EmbedOptionRatioProps) {
	const [checked, setChecked] = useState<string[]>([]);
	const handleCheckedOption = (value: string) => {
		if (!max_options || checked.length < max_options || !checkMultiple) {
			handleAddEmbedRadioValue(value);
		}
	};

	const dispatch = useDispatch();

	const checkMultiple = useMemo(() => {
		if (options.length > 1 && options[0].name) {
			return options[0].name !== options[1].name;
		}
		return false;
	}, [options]);

	const handleAddEmbedRadioValue = useCallback(
		(value: string) => {
			dispatch(
				embedActions.addEmbedValue({
					message_id: message_id,
					data: {
						id: idRadio,
						value: value
					},
					multiple: checkMultiple,
					onlyChooseOne: !checkMultiple
				})
			);
		},
		[checkMultiple]
	);
	if (!options) return null;
	return (
		<>
			{options.map((option, index) => (
				<EmbedOptionRatioItem
					key={option.value + message_id}
					setChecked={setChecked}
					message_id={message_id}
					option={option}
					checkMultiple={checkMultiple}
					checked={checked.includes(option.value)}
					handleCheckedOption={() => handleCheckedOption(option.value)}
				/>
			))}
		</>
	);
}

const EmbedOptionRatioItem = ({
	option,
	message_id,
	setChecked,
	checkMultiple,
	handleCheckedOption,
	checked
}: {
	setChecked: React.Dispatch<React.SetStateAction<string[]>>;
	option: IMessageRatioOption;
	message_id: string;
	handleCheckedOption: () => void;
	checkMultiple: boolean;
	checked: boolean;
}) => {
	const handleCheckedOptionItem = () => {
		handleCheckedOption();
		if (!checkMultiple) {
			setChecked([option.value]);
			return;
		}
		setChecked((prev) => {
			if (prev.includes(option.value)) {
				return prev.filter((item) => item !== option.value);
			}
			return [...prev, option.value];
		});
	};
	return (
		<div className="flex justify-between items-center gap-4">
			<div className="flex flex-col">
				<EmbedTitle title={option.label} />
				<EmbedDescription description={option.description || ''} />
			</div>
			<MessageRatioButton
				name={option.name ? option.name + message_id : 'ratio_button' + message_id}
				onCheckRatio={handleCheckedOptionItem}
				checked={checked}
				color={option.style}
				disabled={option.disabled}
			/>
		</div>
	);
};
