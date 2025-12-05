import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface FieldItem {
	id: string;
	name: string;
	type: FieldType;
	value: string;
}

type CustomFieldMappingProps = HTMLFieldProps<FieldItem[], HTMLDivElement> & {
	label?: string;
	placeholder?: string;
	className?: string;
};

const typeOptions: { label: string; value: FieldType }[] = [
	{ label: 'String', value: 'string' },
	{ label: 'Number', value: 'number' },
	{ label: 'Boolean', value: 'boolean' },
	{ label: 'Object', value: 'object' },
	{ label: 'Array', value: 'array' }
];

const createField = (): FieldItem => ({
	id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
	name: '',
	type: 'string',
	value: ''
});

function CustomFieldMapping({
	value = [],
	onChange,
	label = 'Fields to Set',
	//placeholder = 'Drag input fields here or Add Field',
	className = '',
	...props
}: CustomFieldMappingProps) {
	const updateField = (fieldId: string, key: keyof FieldItem, fieldValue: string) => {
		const next = value.map((field) => (field.id === fieldId ? { ...field, [key]: fieldValue } : field));
		onChange?.(next);
	};

	const removeField = (fieldId: string) => {
		onChange?.(value.filter((field) => field.id !== fieldId));
	};

	const addField = () => {
		onChange?.([...value, createField()]);
	};

	return (
		<div className={`space-y-3 ${className}`} {...props}>
			{label && <div className="text-sm font-semibold text-gray-200">{label}</div>}

			{value.length > 0 && (
				<div className="space-y-3">
					{value.map((field) => (
						<div key={field.id} className="rounded-xl border border-gray-700 bg-[#1c1c20] p-3 shadow-inner space-y-2">
							<div className="flex items-center gap-3">
								<input
									className="flex-1 rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
									placeholder="Field name"
									value={field.name}
									onChange={(event) => updateField(field.id, 'name', event.target.value)}
								/>
								<select
									className="w-40 rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
									value={field.type}
									onChange={(event) => updateField(field.id, 'type', event.target.value as FieldType)}
								>
									{typeOptions.map((option) => (
										<option key={option.value} value={option.value} className="bg-[#1c1c20]">
											{option.label}
										</option>
									))}
								</select>
							</div>

							<textarea
								className="h-20 w-full resize-y rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
								placeholder="Value"
								value={field.value}
								onChange={(event) => updateField(field.id, 'value', event.target.value)}
							/>

							<div className="flex justify-end">
								<button
									type="button"
									onClick={() => removeField(field.id)}
									className="text-xs font-medium text-red-400 hover:text-red-300"
								>
									Remove
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<button
				type="button"
				onClick={addField}
				className="w-full rounded-xl border border-dashed border-gray-700 bg-[#1c1c20] px-4 py-6 text-center text-sm text-gray-400 hover:bg-[#23232a] transition"
				style={{ cursor: 'pointer' }}
			>
				Add Field
			</button>
		</div>
	);
}

export default connectField<CustomFieldMappingProps>(CustomFieldMapping);
