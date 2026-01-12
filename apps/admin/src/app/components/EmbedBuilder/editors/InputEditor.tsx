import type { EMessageComponentType } from '@mezon/utils';
import React from 'react';
import { BuilderTextInput } from '../ui/BuilderUI';

interface InputEditorProps {
	data: {
		type: EMessageComponentType;
		id: string;
		component: {
			placeholder?: string;
			type?: string;
			label?: string;
			required?: boolean;
			min_length?: number;
			max_length?: number;
			value?: string;
		};
	};

	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const InputEditor: React.FC<InputEditorProps> = ({ data, onChange, onRemove }) => {
	const handleComponentChange = (key: string, value: any) => {
		onChange({
			...data,
			component: {
				...data.component,
				[key]: value
			}
		});
	};

	return (
		<div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-gray-500 uppercase bg-gray-200 px-2 py-0.5 rounded">Input</span>
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

				<div className="w-full">
					<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
					<select
						className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={data.component.type || 'text'}
						onChange={(e) => handleComponentChange('type', e.target.value)}
					>
						<option value="text">Text</option>
						<option value="number">Number</option>
						<option value="email">Email</option>
						<option value="password">Password</option>
						<option value="tel">Phone</option>
						<option value="url">URL</option>
					</select>
				</div>

				<BuilderTextInput
					label="Label"
					value={data.component.label || ''}
					onChange={(e) => handleComponentChange('label', e.target.value)}
					placeholder="Input Label"
				/>

				<BuilderTextInput
					label="Placeholder"
					value={data.component.placeholder || ''}
					onChange={(e) => handleComponentChange('placeholder', e.target.value)}
					placeholder="Placeholder text..."
				/>

				<BuilderTextInput
					label="Min Length"
					type="number"
					value={data.component.min_length || ''}
					onChange={(e) => handleComponentChange('min_length', parseInt(e.target.value) || undefined)}
					placeholder="0"
				/>

				<BuilderTextInput
					label="Max Length"
					type="number"
					value={data.component.max_length || ''}
					onChange={(e) => handleComponentChange('max_length', parseInt(e.target.value) || undefined)}
					placeholder="255"
				/>
			</div>

			<div className="flex items-center gap-2 pt-2">
				<label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
					<input
						type="checkbox"
						className="rounded text-blue-600 focus:ring-blue-500"
						checked={data.component.required || false}
						onChange={(e) => handleComponentChange('required', e.target.checked)}
					/>
					Required
				</label>
			</div>
		</div>
	);
};
