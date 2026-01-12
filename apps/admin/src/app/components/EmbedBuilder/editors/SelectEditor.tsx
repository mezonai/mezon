import type { EMessageComponentType, EMessageSelectType } from '@mezon/utils';
import React from 'react';
import { BuilderTextInput } from '../ui/BuilderUI';

interface ISelectOption {
	label: string;
	value: string;
	description?: string;
	emoji?: string;
	default?: boolean;
}

interface SelectEditorProps {
	data: {
		type: EMessageComponentType;
		id: string;
		component: {
			placeholder?: string;
			type?: EMessageSelectType;
			min_values?: number;
			max_values?: number;
			options: ISelectOption[];
		};
	};
	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const SelectEditor: React.FC<SelectEditorProps> = ({ data, onChange, onRemove }) => {
	const handleComponentChange = (key: string, value: any) => {
		onChange({
			...data,
			component: {
				...data.component,
				[key]: value
			}
		});
	};

	const addOption = () => {
		const newOptions = [...(data.component.options || []), { label: 'New Option', value: 'value' }];
		handleComponentChange('options', newOptions);
	};

	const updateOption = (index: number, optionData: Partial<ISelectOption>) => {
		const newOptions = [...(data.component.options || [])];
		newOptions[index] = { ...newOptions[index], ...optionData };
		handleComponentChange('options', newOptions);
	};

	const removeOption = (index: number) => {
		const newOptions = data.component.options.filter((_, i) => i !== index);
		handleComponentChange('options', newOptions);
	};

	return (
		<div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-purple-600 uppercase bg-purple-100 px-2 py-0.5 rounded">Select</span>
				</div>
				{onRemove && (
					<button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{/* ID is auto-generated and used internally */}

				<BuilderTextInput
					label="Placeholder"
					value={data.component.placeholder || ''}
					onChange={(e) => handleComponentChange('placeholder', e.target.value)}
					placeholder="Select an option..."
				/>

				<div className="grid grid-cols-2 gap-3 md:col-span-2">
					<BuilderTextInput
						label="Min Values"
						type="number"
						value={data.component.min_values || ''}
						onChange={(e) => handleComponentChange('min_values', parseInt(e.target.value) || undefined)}
						placeholder="1"
					/>
					<BuilderTextInput
						label="Max Values"
						type="number"
						value={data.component.max_values || ''}
						onChange={(e) => handleComponentChange('max_values', parseInt(e.target.value) || undefined)}
						placeholder="1"
					/>
				</div>
			</div>

			<div className="mt-2 border-t border-purple-100 pt-2">
				<div className="flex justify-between items-center mb-2">
					<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</label>
					<button onClick={addOption} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
						+ Add Option
					</button>
				</div>

				<div className="space-y-2 max-h-60 overflow-y-auto pr-1">
					{data.component.options?.map((option, idx) => (
						<div key={idx} className="flex gap-2 items-start bg-white p-2 rounded border border-purple-100">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
								<BuilderTextInput
									value={option.label}
									onChange={(e) => updateOption(idx, { label: e.target.value })}
									placeholder="Label"
									className="text-xs py-1"
								/>
								<BuilderTextInput
									value={option.value}
									onChange={(e) => updateOption(idx, { value: e.target.value })}
									placeholder="Value"
									className="text-xs py-1"
								/>
							</div>
							<button onClick={() => removeOption(idx)} className="mt-1 text-gray-400 hover:text-red-500">
								×
							</button>
						</div>
					))}
					{(!data.component.options || data.component.options.length === 0) && (
						<p className="text-xs text-gray-400 text-center italic py-2">No options added</p>
					)}
				</div>
			</div>
		</div>
	);
};
