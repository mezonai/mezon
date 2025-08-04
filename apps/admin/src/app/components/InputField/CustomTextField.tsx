import { connectField, HTMLFieldProps } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
};
function CustomTextField({ onChange, value, label, errorMessage, showInlineError, fieldType, changed, ...props }: CustomFormFieldProps) {
	return (
		<div className="ImageField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			<input
				className="my-1 block w-full px-3 py-2 rounded-md border-[1px] focus:border-[1px] bg-slate-50 dark:bg-slate-400 focus-visible:outline-none focus-visible:border-[1px] focus-visible:border-gray-400"
				onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
					onChange(event.target.value);
				}}
				onDragStart={(e) => e.preventDefault()}
				draggable={false}
				value={value || ''}
				type={props.type}
				placeholder={props.placeholder}
				disabled={props.disabled}
				name={props.name}
				ref={undefined}
			/>
		</div>
	);
}
export default connectField<CustomFormFieldProps>(CustomTextField);
