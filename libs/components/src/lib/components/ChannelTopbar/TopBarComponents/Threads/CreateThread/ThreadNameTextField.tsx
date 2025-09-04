import { selectNameThreadError, threadsActions, useAppDispatch } from '@mezon/store';
import { ValidateSpecialCharacters, threadError } from '@mezon/utils';
import { KeyboardEvent, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

interface ThreadNameTextFieldProps {
	label?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>) => Promise<void>;
	error?: string;
	className?: string;
	dataE2E?: string;
}

const ThreadNameTextField = ({ label, placeholder, value, className, onChange, onKeyDown, dataE2E }: ThreadNameTextFieldProps) => {
	const dispatch = useAppDispatch();
	const nameThreadError = useSelector(selectNameThreadError);
	const [checkValidate, setCheckValidate] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const regex = ValidateSpecialCharacters().test(value);
		setCheckValidate(!regex);
		dispatch(threadsActions.setNameThreadError(''));
		onChange(value);
	};

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>) => {
			const element = event.target as HTMLInputElement;
			if (!(element.value || '').trim()) {
				dispatch(threadsActions.setNameThreadError(threadError.name));
			}
			onKeyDown(event);
		},
		[dispatch, onKeyDown]
	);

	return (
		<div className="flex flex-col mt-4 mb-4">
			<span className="text-xs font-semibold uppercase mb-2 text-theme-primary-active">{label}</span>
			<input
				value={value}
				onChange={handleInputChange}
				type="text"
				placeholder={placeholder}
				className={className}
				onKeyDown={handleKeyDown}
				maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
				data-e2e={dataE2E}
			/>
			{nameThreadError && <span className="text-[#e44141] text-xs italic font-thin">{nameThreadError}</span>}
			{checkValidate && (
				<span className="text-[#e44141] text-xs italic font-thin">
					Please enter a valid channel name (max 64 characters, only words, numbers, _ or -).
				</span>
			)}
		</div>
	);
};

export default ThreadNameTextField;
