import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
	multiline?: boolean;
	rows?: number;
	placeholder?: string;
	disabled?: boolean;
	type?: string;
};

function CustomTextField({
	onChange,
	value,
	label,
	errorMessage,
	showInlineError,
	multiline = false,
	rows = 3,
	placeholder,
	name,
	disabled,
	type = 'text',
	...props
}: CustomFormFieldProps) {
	return (
		<div className="CustomTextField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			{multiline ? (
				<textarea
					className="my-1 block w-full px-3 py-2 rounded-md border-[1px] bg-slate-50 dark:bg-slate-400 focus-visible:outline-none focus:border-gray-400"
					name={name}
					value={value || ''}
					placeholder={placeholder}
					disabled={disabled}
					rows={rows}
					onChange={(event) => {
						onChange(event.target.value);
					}}
				/>
			) : (
				<input
					className="my-1 block w-full px-3 py-2 rounded-md border-[1px] bg-slate-50 dark:bg-slate-400 focus-visible:outline-none focus:border-gray-400"
					type={type}
					name={name}
					value={value || ''}
					placeholder={placeholder}
					disabled={disabled}
					onChange={(event) => {
						onChange(event.target.value);
					}}
					onDragStart={(e) => e.preventDefault()}
					draggable={false}
				/>
			)}
			{showInlineError && errorMessage && <span className="text-xs text-red-500">{errorMessage}</span>}
		</div>
	);
}

export default connectField<CustomFormFieldProps>(CustomTextField);
