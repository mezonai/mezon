import { embedActions, selectDataFormEmbedByMessageId } from '@mezon/store';
import type { IMessageRatioOption } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageRatioButton } from '../../MessageActionsPanel/components/MessageRatio';
import { EmbedDescription } from './EmbedDescription';
import { EmbedTitle } from './EmbedTitle';

interface EmbedOptionRatioProps {
	options: IMessageRatioOption[];
	messageId: string;
	idRadio: string;
	max_options?: number;
	disabled?: boolean;
}

export function EmbedOptionRatio({ options, messageId, idRadio, max_options, disabled = false }: EmbedOptionRatioProps) {
	const embedData = useSelector((state) => selectDataFormEmbedByMessageId(state, messageId))?.[idRadio];
	const [checked, setChecked] = useState<string[]>(embedData ? (Array.isArray(embedData) ? embedData : [embedData]) : []);
	const handleCheckedOption = (value: string) => {
		if (disabled) return;
		if (!max_options || (checkMultiple && checked.length < max_options) || !checkMultiple || checked.includes(value)) {
			handleAddEmbedRadioValue(value);
		}
	};

	const dispatch = useDispatch();

	const checkMultiple = useMemo(() => {
		if (options?.length > 1 && options?.[0]?.name) {
			return options?.[0].name !== options?.[1].name;
		}
		return false;
	}, [options]);

	const handleAddEmbedRadioValue = useCallback(
		(value: string) => {
			dispatch(
				embedActions.addEmbedValue({
					messageId,
					data: {
						id: idRadio,
						value
					},
					multiple: checkMultiple,
					onlyChooseOne: !checkMultiple
				})
			);
		},
		[checkMultiple]
	);
	if (!options || !Array.isArray(options)) return null;
	return (
		<>
			{options.map((option, index) => (
				<EmbedOptionRatioItem
					key={option.value + messageId}
					setChecked={setChecked}
					messageId={messageId}
					option={option}
					checkMultiple={checkMultiple}
					checked={checked.includes(option.value)}
					handleCheckedOption={() => handleCheckedOption(option.value)}
					disabled={disabled}
				/>
			))}
		</>
	);
}

const EmbedOptionRatioItem = ({
	option,
	messageId,
	setChecked,
	checkMultiple,
	handleCheckedOption,
	checked,
	disabled
}: {
	setChecked: React.Dispatch<React.SetStateAction<string[]>>;
	option: IMessageRatioOption;
	messageId: string;
	handleCheckedOption: () => void;
	checkMultiple: boolean;
	checked: boolean;
	disabled?: boolean;
}) => {
	const handleCheckedOptionItem = () => {
		if (disabled) return;
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
				key={`${option.name ? `${option.name + messageId}_${checked}` : `ratio_button${messageId}_${checked}`}`}
				name={option.name ? option.name + messageId : `ratio_button${messageId}`}
				onCheckRatio={handleCheckedOptionItem}
				checked={checked}
				color={option.style}
				disabled={option.disabled}
			/>
		</div>
	);
};
