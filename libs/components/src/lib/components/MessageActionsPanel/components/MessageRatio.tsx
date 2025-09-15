import { EButtonMessageStyle } from '@mezon/utils';
import React, { useMemo } from 'react';

type MessageRatioButtonProps = {
	onCheckRatio: () => void;
	name: string;
	checked: boolean;
	color?: EButtonMessageStyle;
	disabled?: boolean;
};

export const MessageRatioButton: React.FC<MessageRatioButtonProps> = ({ name, onCheckRatio, checked, color, disabled = false }) => {
	const buttonColor = useMemo(() => {
		if (color) {
			switch (color) {
				case EButtonMessageStyle.PRIMARY:
					return 'accent-buttonPrimary checked:bg-buttonPrimary border-buttonPrimary';
				case EButtonMessageStyle.SECONDARY:
					return 'accent-buttonSecondary checked:bg-buttonSecondary border-buttonSecondary';
				case EButtonMessageStyle.SUCCESS:
					return 'accent-colorSuccess checked:bg-colorSuccess border-colorSuccess';
				case EButtonMessageStyle.DANGER:
					return 'accent-colorDanger checked::bg-colorDanger border-colorDanger';
				case EButtonMessageStyle.LINK:
					return 'accent-buttonSecondary checked:bg-buttonSecondary border-buttonSecondary';
				default:
					return 'accent-white checked:bg-buttonPrimary border-buttonPrimary ';
			}
		}
		return 'accent-white checked:bg-white border-white';
	}, [color]);

	return (
		<div
			className={`!border-2 border-channelTextLabel ${checked ? buttonColor : null} flex flex-row  w-5 h-5 justify-center  items-center dark:text-textPrimary text-textPrimaryLight rounded-full text-sm text-left !bg-transparent flex-shrink-0`}
		>
			<input
				disabled={disabled}
				name={name}
				type="radio"
				className={`appearance-none w-3 h-3 text-white bg-transparent cursor-pointer relative rounded-full
				 ${buttonColor}`}
				onClick={onCheckRatio}
				defaultChecked={checked}
			/>
		</div>
	);
};
