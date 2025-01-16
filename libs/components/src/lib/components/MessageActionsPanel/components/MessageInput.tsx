import { embedActions } from '@mezon/store';
import { IMessageInput } from '@mezon/utils';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';

type MessageRatioButtonProps = {
	input: IMessageInput;
	messageId: string;
	senderId: string;
	buttonId: string;
};

export const MessageInput: React.FC<MessageRatioButtonProps> = ({ input, messageId, buttonId }) => {
	const { placeholder, required, textarea, type = 'text' } = input;
	const dispatch = useDispatch();

	const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		debouncedChangeInput(e.target.value);
	};

	useEffect(() => {
		if (input.defaultValue) {
			debouncedChangeInput(input.defaultValue);
		}
	}, []);

	const debouncedChangeInput = useDebouncedCallback(async (value: string) => {
		dispatch(
			embedActions.addEmbedValue({
				message_id: messageId,
				data: {
					id: buttonId,
					value: value
				}
			})
		);
	}, 300);
	return (
		<div className="flex flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm text-sm text-left w-auto min-w-[300px]">
			{textarea ? (
				<textarea
					onChange={handleChangeInput}
					placeholder={placeholder + (required ? '*' : '')}
					className={`outline-none p-4 py-2  dark:bg-bgTertiary bg-bgLightModeThird text-textSecondary800 dark:text-textSecondary rounded max-h-40 w-full hide-scrollbar`}
					required={required}
					defaultValue={input.defaultValue}
				/>
			) : (
				<input
					onChange={handleChangeInput}
					min={type === 'number' ? 0 : undefined}
					placeholder={placeholder + (required ? '*' : '')}
					type={type}
					className={`outline-none p-4 py-2 dark:bg-bgTertiary bg-bgLightModeThird text-textSecondary800 dark:text-textSecondary rounded w-full hide-scrollbar`}
					required={required}
					defaultValue={input.defaultValue}
					step={type === 'number' ? 0.5 : undefined}
				/>
			)}
		</div>
	);
};
