import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomToggleFieldProps = HTMLFieldProps<boolean, HTMLDivElement> & {
	label?: string;
};

function CustomToggleFieldComponent({ value = false, onChange, label, ...props }: CustomToggleFieldProps) {
	return (
		<div className="flex items-center justify-between py-2" {...props}>
			{label && <span className="text-sm font-medium">{label}</span>}
			<button
				type="button"
				onClick={() => onChange?.(!value)}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-600'}`}
			>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
						value ? 'translate-x-6' : 'translate-x-1'
					}`}
				/>
			</button>
		</div>
	);
}

export default connectField<CustomToggleFieldProps>(CustomToggleFieldComponent);
