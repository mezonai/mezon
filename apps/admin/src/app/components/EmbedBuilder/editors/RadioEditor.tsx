import type { EButtonMessageStyle, IMessageRatioOption, RadioComponent } from '@mezon/utils';
import React from 'react';
import { BuilderSwitch, BuilderTextInput, BuilderTextarea } from '../ui/BuilderUI';

interface RadioEditorProps {
	data: RadioComponent;
	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const RadioEditor: React.FC<RadioEditorProps> = ({ data, onChange, onRemove }) => {
	const addOption = () => {
		const newOption: IMessageRatioOption = {
			label: 'New Option',
			value: `value_${Date.now()}`,
			name: 'radio_group',
			style: 1
		};
		onChange({
			...data,
			component: [...data.component, newOption]
		});
	};

	const updateOption = (index: number, optionData: Partial<IMessageRatioOption>) => {
		const newOptions = [...data.component];
		newOptions[index] = { ...newOptions[index], ...optionData };
		onChange({
			...data,
			component: newOptions
		});
	};

	const removeOption = (index: number) => {
		const newOptions = data.component.filter((_, i) => i !== index);
		onChange({
			...data,
			component: newOptions
		});
	};

	const addExtraDataToOption = (optionIndex: number) => {
		const option = data.component[optionIndex];
		const newExtraData = [...(option.extraData || []), ''];
		updateOption(optionIndex, { extraData: newExtraData });
	};

	const updateOptionExtraData = (optionIndex: number, dataIndex: number, value: string) => {
		const option = data.component[optionIndex];
		const newExtraData = [...(option.extraData || [])];
		newExtraData[dataIndex] = value;
		updateOption(optionIndex, { extraData: newExtraData });
	};

	const removeOptionExtraData = (optionIndex: number, dataIndex: number) => {
		const option = data.component[optionIndex];
		const newExtraData = option.extraData?.filter((_, i) => i !== dataIndex);
		updateOption(optionIndex, { extraData: newExtraData });
	};

	return (
		<div className="space-y-3 p-3 bg-rose-50 border border-rose-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-rose-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded">Radio/Checkbox</span>
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

			{/* ID is auto-generated and used internally */}

			<div className="bg-rose-100 p-2 rounded text-xs text-rose-800 mb-2">
				<strong>Behavior:</strong> Same <code className="bg-rose-200 px-1 rounded">name</code> = Radio buttons (single select), Different{' '}
				<code className="bg-rose-200 px-1 rounded">name</code> = Checkboxes (multi-select)
			</div>

			<div className="border-t border-rose-100 pt-2">
				<div className="flex justify-between items-center mb-2">
					<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</label>
					<button onClick={addOption} className="text-xs text-rose-700 hover:text-rose-900 font-medium">
						+ Add Option
					</button>
				</div>

				<div className="space-y-3 pr-1">
					{data.component?.map((option, idx) => (
						<div key={idx} className="bg-white p-3 rounded border border-rose-100">
							<div className="flex justify-between items-start mb-2">
								<span className="text-xs font-semibold text-gray-600">Option {idx + 1}</span>
								<button onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500">
									×
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								<BuilderTextInput
									label="Label"
									value={option.label}
									onChange={(e) => updateOption(idx, { label: e.target.value })}
									placeholder="Option label"
									className="text-xs"
								/>
								<BuilderTextInput
									label="Value"
									value={option.value}
									onChange={(e) => updateOption(idx, { value: e.target.value })}
									placeholder="option_value"
									className="text-xs"
								/>

								<BuilderTextInput
									label="Name (group)"
									value={option.name || ''}
									onChange={(e) => updateOption(idx, { name: e.target.value })}
									placeholder="radio_group"
									className="text-xs"
								/>

								<div className="w-full">
									<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Style</label>
									<select
										className="w-full px-2 py-1 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
										value={option.style || 1}
										onChange={(e) => updateOption(idx, { style: parseInt(e.target.value) as EButtonMessageStyle })}
									>
										<option value={1}>Primary</option>
										<option value={2}>Secondary</option>
										<option value={3}>Success</option>
										<option value={4}>Danger</option>
										<option value={5}>Link</option>
									</select>
								</div>
							</div>

							<div className="mt-2">
								<BuilderTextarea
									label="Description (optional)"
									value={option.description || ''}
									onChange={(e) => updateOption(idx, { description: e.target.value })}
									placeholder="Additional description for this option"
									rows={2}
									className="text-xs"
								/>
							</div>

							<div className="mt-2 flex items-center">
								<BuilderSwitch
									label="Disabled"
									checked={option.disabled || false}
									onChange={(checked) => updateOption(idx, { disabled: checked })}
								/>
							</div>

							{/* Extra Data for this option */}
							<div className="mt-2 pt-2 border-t border-rose-50">
								<div className="flex justify-between items-center mb-1">
									<label className="text-xs font-semibold text-gray-500">Extra Data</label>
									<button
										onClick={() => addExtraDataToOption(idx)}
										className="text-xs text-rose-600 hover:text-rose-800 font-medium"
									>
										+ Add
									</button>
								</div>
								<div className="space-y-1">
									{option.extraData?.map((extraItem, extraIdx) => (
										<div key={extraIdx} className="flex gap-1 items-center">
											<input
												type="text"
												className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
												value={extraItem}
												onChange={(e) => updateOptionExtraData(idx, extraIdx, e.target.value)}
												placeholder={`Extra ${extraIdx + 1}`}
											/>
											<button
												onClick={() => removeOptionExtraData(idx, extraIdx)}
												className="text-gray-400 hover:text-red-500 text-xs"
											>
												×
											</button>
										</div>
									))}
									{(!option.extraData || option.extraData.length === 0) && (
										<p className="text-xs text-gray-400 italic py-1">No extra data</p>
									)}
								</div>
							</div>
						</div>
					))}
					{(!data.component || data.component.length === 0) && (
						<p className="text-xs text-gray-400 text-center italic py-2">No options added</p>
					)}
				</div>
			</div>
		</div>
	);
};
