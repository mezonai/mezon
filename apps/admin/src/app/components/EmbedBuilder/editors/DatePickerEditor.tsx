import type { DatePickerComponent } from '@mezon/utils';
import React from 'react';
import { BuilderTextInput } from '../ui/BuilderUI';

interface DatePickerEditorProps {
	data: DatePickerComponent;
	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const DatePickerEditor: React.FC<DatePickerEditorProps> = ({ data, onChange, onRemove }) => {
	const handleComponentChange = (value: string | Date) => {
		onChange({
			...data,
			component: { value }
		});
	};

	return (
		<div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-amber-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">DatePicker</span>
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

			<div className="bg-amber-100 p-2 rounded text-xs text-amber-800 mb-2">
				<strong>DatePicker:</strong> Configure the default value for the date picker. Users can select a date when interacting with the embed.
			</div>

			<div className="grid grid-cols-1 gap-3">
				<BuilderTextInput
					label="Default Value"
					type="date"
					value={typeof data.component.value === 'string' ? data.component.value : ''}
					onChange={(e) => handleComponentChange(e.target.value)}
					placeholder="YYYY-MM-DD"
				/>
			</div>
		</div>
	);
};
