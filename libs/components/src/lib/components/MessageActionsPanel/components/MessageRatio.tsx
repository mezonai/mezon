import { EButtonMessageStyle } from '@mezon/utils';
import React, { useMemo } from 'react';

type MessageRatioButtonProps = {
	onCheckRatio: () => void;
	name: string;
	checked: boolean;
	color?: EButtonMessageStyle;
};

export const MessageRatioButton: React.FC<MessageRatioButtonProps> = ({ name, onCheckRatio, checked, color }) => {
	const buttonColor = useMemo(() => {
		if (color) {
			switch (color) {
				case EButtonMessageStyle.PRIMARY:
					return 'accent-buttonPrimary checked:border-buttonPrimary checked:after:bg-buttonPrimary ';
				case EButtonMessageStyle.SECONDARY:
					return 'accent-buttonSecondary checked:border-buttonSecondary checked:after:bg-buttonSecondary';
				case EButtonMessageStyle.SUCCESS:
					return 'accent-colorSuccess checked:border-colorSuccess checked:after:bg-colorSuccess';
				case EButtonMessageStyle.DANGER:
					return 'accent-colorDanger checked:border-colorDanger checked:after:bg-colorDanger';
				case EButtonMessageStyle.LINK:
					return 'accent-buttonSecondary checked:border-buttonSecondary checked:after:bg-buttonSecondary';
				default:
					return 'accent-white checked:border-white checked:after:bg-buttonPrimary ';
			}
		}
		return 'accent-white checked:border-white checked:after:bg-white ';
	}, [color]);

	return (
		<div className="flex flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm text-sm py-2 px-4 text-left ">
			<input
				name={name}
				type="radio"
				className={`appearance-none text-white w-5 h-5 bg-transparent cursor-pointer relative rounded-full  border-2  border-channelTextLabel checked:after:absolute checked:after:w-3 checked:after:h-3 checked:after:top-[2.4px] checked:after:left-[2.4px] checked:after:content-[""] checked:after:rounded-full
				 ${buttonColor}`}
				onClick={onCheckRatio}
				checked={checked}
			/>
		</div>
	);
};
