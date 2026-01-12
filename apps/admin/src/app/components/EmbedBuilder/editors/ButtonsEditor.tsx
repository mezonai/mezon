import type { ButtonComponent } from '@mezon/utils';
import { EMessageComponentType } from '@mezon/utils';
import React from 'react';
import { BuilderTextInput } from '../ui/BuilderUI';

interface ButtonsEditorProps {
	data: ButtonComponent[];
	onChange: (data: ButtonComponent[]) => void;
}

export const ButtonsEditor: React.FC<ButtonsEditorProps> = ({ data, onChange }) => {
	const addButton = () => {
		if (data.length >= 5) return;
		const newButton: ButtonComponent = {
			id: `btn_${Date.now()}`,
			type: EMessageComponentType.BUTTON,
			component: {
				label: 'New Button',
				style: 1 // Primary
			}
		};

		onChange([...data, newButton]);
	};

	const updateButton = (index: number, buttonData: Partial<ButtonComponent['component']> | Partial<ButtonComponent>) => {
		const newButtons = [...data];
		if ('label' in buttonData || 'style' in buttonData || 'url' in buttonData) {
			newButtons[index] = {
				...newButtons[index],
				component: { ...newButtons[index].component, ...buttonData }
			};
		} else {
			newButtons[index] = { ...newButtons[index], ...(buttonData as Partial<ButtonComponent>) };
		}
		onChange(newButtons);
	};

	const removeButton = (index: number) => {
		onChange(data.filter((_, i) => i !== index));
	};

	const buttonStyles = [
		{ value: 1, label: 'Primary (Blue)', color: 'bg-blue-500' },
		{ value: 2, label: 'Secondary (Gray)', color: 'bg-gray-500' },
		{ value: 3, label: 'Success (Green)', color: 'bg-green-500' },
		{ value: 4, label: 'Danger (Red)', color: 'bg-red-500' },
		{ value: 5, label: 'Link (URL)', color: 'bg-gray-400' }
	];

	return (
		<div className="space-y-3">
			<div className="flex justify-between items-center">
				<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buttons</label>
				{data.length < 5 && (
					<button onClick={addButton} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
						+ Add Button
					</button>
				)}
			</div>

			<div className="space-y-3">
				{data.map((btn, idx) => (
					<div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-md relative">
						<button onClick={() => removeButton(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
							×
						</button>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
							<BuilderTextInput
								label="Label"
								value={btn.component.label}
								onChange={(e) => updateButton(idx, { label: e.target.value })}
								placeholder="Button Label"
							/>

							<div className="w-full">
								<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Style</label>
								<select
									className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={btn.component.style || 1}
									onChange={(e) => updateButton(idx, { style: parseInt(e.target.value) })}
								>
									{buttonStyles.map((s) => (
										<option key={s.value} value={s.value}>
											{s.label}
										</option>
									))}
								</select>
							</div>

							{(btn.component.style || 1) === 5 && (
								<div className="md:col-span-2">
									<BuilderTextInput
										label="URL"
										value={btn.component.url || ''}
										onChange={(e) => updateButton(idx, { url: e.target.value })}
										placeholder="https://..."
									/>
								</div>
							)}
						</div>
					</div>
				))}
				{data.length === 0 && (
					<div className="text-xs text-gray-400 text-center border border-dashed border-gray-300 rounded py-4">No buttons added</div>
				)}
			</div>
		</div>
	);
};
