import type { EMessageComponentType } from '@mezon/utils';
import React from 'react';
import { BuilderTextInput } from '../ui/BuilderUI';

interface GridEditorProps {
	data: {
		type: EMessageComponentType;
		id: string;
		columns?: number;
		rows?: number;
		component: {
			items?: any[];
		};
	};
	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const GridEditor: React.FC<GridEditorProps> = ({ data, onChange, onRemove }) => {
	return (
		<div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-green-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-green-600 uppercase bg-green-100 px-2 py-0.5 rounded">Grid Layout</span>
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

				<div className="grid grid-cols-2 gap-3">
					<BuilderTextInput
						label="Columns"
						type="number"
						value={data.columns || ''}
						onChange={(e) => onChange({ ...data, columns: parseInt(e.target.value) || undefined })}
						placeholder="2"
					/>
					<BuilderTextInput
						label="Rows"
						type="number"
						value={data.rows || ''}
						onChange={(e) => onChange({ ...data, rows: parseInt(e.target.value) || undefined })}
						placeholder="2"
					/>
				</div>
			</div>

			<div className="text-xs text-green-700 bg-green-100 p-2 rounded mt-2">
				Grid layout definition. Items are usually managed within the grid structure in the renderer.
			</div>
		</div>
	);
};
