import { IMessageRatioOption } from '@mezon/utils';
import { useState } from 'react';
import { MessageRatioButton } from '../../MessageActionsPanel/components/MessageRatio';
import { EmbedDescription } from './EmbedDescription';
import { EmbedTitle } from './EmbedTitle';

interface EmbedOptionRatioProps {
	options: IMessageRatioOption[];
}

export function EmbedOptionRatio({ options }: EmbedOptionRatioProps) {
	const [checked, setChecked] = useState<number[]>([]);
	const handleCheckedOption = (index: number) => {
		if (checked.includes(index)) {
			setChecked(checked.filter((check) => check !== index));
			return;
		}
		setChecked([...checked, index]);
	};
	return (
		<>
			{options &&
				options.map((option, index) => (
					<div className="flex justify-between">
						<div className="flex flex-col">
							<EmbedTitle title={option.label} />
							<EmbedDescription description={option.description || ''} />
						</div>
						<MessageRatioButton
							name={option.name ? option.name : 'ratio_button'}
							onCheckRatio={() => handleCheckedOption(index)}
							checked={checked.includes(index)}
						/>
					</div>
				))}
		</>
	);
}
