import { useEffect, useRef } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
	multiline?: boolean;
	rows?: number;
	placeholder?: string;
	disabled?: boolean;
	type?: string;
	autoResize?: boolean;
	maxLength?: number;
	showCharCount?: boolean;
};

function CustomTextField({
	onChange,
	value,
	label,
	errorMessage,
	showInlineError,
	multiline = false,
	rows = 5,
	placeholder,
	name,
	disabled,
	type = 'text',
	autoResize = true,
	maxLength,
	showCharCount = false,
	...props
}: CustomFormFieldProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (multiline && autoResize && textareaRef.current) {
			const textarea = textareaRef.current;
			textarea.style.height = 'auto';
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	}, [value, multiline, autoResize]);

	const currentLength = value?.length || 0;
	const showCounter = showCharCount && (multiline || maxLength);

	return (
		<div className="CustomTextField mt-2">
			{label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
			{multiline ? (
				<div className="relative">
					<textarea
						ref={textareaRef}
						className="my-1 block w-full px-4 py-3 rounded-md border-[1px] bg-slate-50 dark:bg-slate-700 dark:text-white border-gray-300 dark:border-gray-600 focus-visible:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all resize-none min-h-[120px] text-base leading-relaxed"
						name={name}
						value={value || ''}
						placeholder={placeholder}
						disabled={disabled}
						rows={rows}
						maxLength={maxLength}
						onChange={(event) => {
							onChange(event.target.value);
						}}
						style={autoResize ? { overflow: 'hidden' } : {}}
					/>
					{showCounter && (
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
							{currentLength}
							{maxLength && ` / ${maxLength}`}
						</div>
					)}
				</div>
			) : (
				<div className="relative">
					<input
						className="my-1 block w-full px-4 py-3 rounded-md border-[1px] bg-slate-50 dark:bg-slate-700 dark:text-white border-gray-300 dark:border-gray-600 focus-visible:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all text-base h-12"
						type={type}
						name={name}
						value={value || ''}
						placeholder={placeholder}
						disabled={disabled}
						maxLength={maxLength}
						onChange={(event) => {
							onChange(event.target.value);
						}}
						onDragStart={(e) => e.preventDefault()}
						draggable={false}
					/>
					{showCounter && (
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
							{currentLength}
							{maxLength && ` / ${maxLength}`}
						</div>
					)}
				</div>
			)}
			{showInlineError && errorMessage && <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">{errorMessage}</span>}
		</div>
	);
}

export default connectField<CustomFormFieldProps>(CustomTextField);
