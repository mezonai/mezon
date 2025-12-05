import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
	options?: { label: string; value: string }[]; // Options for the select field
};
function CustomSelectField({
	onChange,
	value,
	label,
	errorMessage,
	showInlineError,
	fieldType,
	changed,
	options = [],
	...props
}: CustomFormFieldProps) {
	return (
		<div className="ImageField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			<select
				onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
					onChange(event.target.value);
				}}
				value={value || ''}
				disabled={props.disabled}
				name={props.name}
				required
				className="bg-transparent border rounded-sm px-2 py-2 outline-none"
			>
				{options.map((option, index) => (
					<option className="bg-white text-gray-800 dark:bg-gray-700 dark:text-white" key={index} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
export default connectField<CustomFormFieldProps>(CustomSelectField);
