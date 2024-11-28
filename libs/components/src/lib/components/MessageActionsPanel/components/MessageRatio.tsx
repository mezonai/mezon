import React from 'react';

type MessageRatioButtonProps = {
	onCheckRatio: () => void;
	checked: boolean;
	name: string;
};

export const MessageRatioButton: React.FC<MessageRatioButtonProps> = ({ name, onCheckRatio, checked }) => {
	return (
		<div className="flex flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm text-sm py-2 px-4 text-left cursor-pointer">
			<input
				name={name}
				type="checkbox"
				checked={checked}
				className={`appearance-none text-white w-5 h-5 bg-transparent relative rounded-full accent-white border-2  border-channelTextLabel checked:after:absolute checked:after:w-3 checked:after:h-3 checked:after:top-[2.4px] checked:after:left-[2.4px] checked:after:bg-white checked:after:content-[""] checked:after:rounded-full
          checked:border-white`}
				onClick={onCheckRatio}
			/>
		</div>
	);
};
