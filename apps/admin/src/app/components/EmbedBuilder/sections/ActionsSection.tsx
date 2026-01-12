import { EMessageComponentType, EMessageSelectType } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { InputEditor } from '../editors/InputEditor';
import { SelectEditor } from '../editors/SelectEditor';
import { BuilderButton, BuilderSectionWrapper } from '../ui/BuilderUI';

export const ActionsSection: React.FC = () => {
	const { data, updateData } = useEmbedBuilder();
	const actionRows = useMemo(() => data.components || [], [data.components]);

	const addActionRow = () => {
		updateData({
			components: [...actionRows, { components: [] }]
		});
	};

	const updateActionRow = (rowIndex: number, components: any[]) => {
		const newRows = [...actionRows];
		newRows[rowIndex] = { components };
		updateData({ components: newRows });
	};

	const removeActionRow = (rowIndex: number) => {
		const newRows = actionRows.filter((_, i) => i !== rowIndex);
		updateData({ components: newRows });
	};

	const moveActionRow = (rowIndex: number, direction: 'up' | 'down') => {
		if (direction === 'up' && rowIndex === 0) return;
		if (direction === 'down' && rowIndex === actionRows.length - 1) return;

		const newRows = [...actionRows];
		const targetIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
		[newRows[rowIndex], newRows[targetIndex]] = [newRows[targetIndex], newRows[rowIndex]];
		updateData({ components: newRows });
	};

	const addComponentToRow = (rowIndex: number, type: 'button' | 'select' | 'input') => {
		const id = Date.now().toString();
		const row = actionRows[rowIndex];
		let newComponent: any;

		if (type === 'button') {
			newComponent = {
				type: EMessageComponentType.BUTTON,
				id: `btn_${id}`,
				component: { label: 'Button', style: 1 }
			};
		} else if (type === 'select') {
			newComponent = {
				type: EMessageComponentType.SELECT,
				id: `select_${id}`,
				component: {
					type: EMessageSelectType.TEXT,
					options: [{ label: 'Option 1', value: '1' }],
					placeholder: 'Select...'
				}
			};
		} else if (type === 'input') {
			newComponent = {
				type: EMessageComponentType.INPUT,
				id: `input_${id}`,
				component: { placeholder: 'Enter text', type: 'text' }
			};
		}

		updateActionRow(rowIndex, [...row.components, newComponent]);
	};

	const updateComponentInRow = (rowIndex: number, componentIndex: number, data: any) => {
		const row = actionRows[rowIndex];
		const newComponents = [...row.components];
		newComponents[componentIndex] = data;
		updateActionRow(rowIndex, newComponents);
	};

	const removeComponentFromRow = (rowIndex: number, componentIndex: number) => {
		const row = actionRows[rowIndex];
		const newComponents = row.components.filter((_: any, i: number) => i !== componentIndex);
		updateActionRow(rowIndex, newComponents);
	};

	const renderComponentEditor = (rowIndex: number, component: any, componentIndex: number) => {
		if (component.type === EMessageComponentType.INPUT) {
			return (
				<InputEditor
					key={componentIndex}
					data={component}
					onChange={(data) => updateComponentInRow(rowIndex, componentIndex, data)}
					onRemove={() => removeComponentFromRow(rowIndex, componentIndex)}
				/>
			);
		} else if (component.type === EMessageComponentType.SELECT) {
			return (
				<SelectEditor
					key={componentIndex}
					data={component}
					onChange={(data) => updateComponentInRow(rowIndex, componentIndex, data)}
					onRemove={() => removeComponentFromRow(rowIndex, componentIndex)}
				/>
			);
		} else if (component.type === EMessageComponentType.BUTTON) {
			return (
				<div key={componentIndex} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
					<div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold text-gray-500 uppercase bg-gray-200 px-2 py-0.5 rounded">Button</span>
							<span className="text-xs font-mono text-gray-400">{component.id}</span>
						</div>
						<button
							onClick={() => removeComponentFromRow(rowIndex, componentIndex)}
							className="text-gray-400 hover:text-red-500 transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Label</label>
							<input
								type="text"
								className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={component.component.label || ''}
								onChange={(e) => {
									const newData = { ...component, component: { ...component.component, label: e.target.value } };
									updateComponentInRow(rowIndex, componentIndex, newData);
								}}
								placeholder="Button label"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Style</label>
							<select
								className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={component.component.style || 1}
								onChange={(e) => {
									const newData = { ...component, component: { ...component.component, style: parseInt(e.target.value) } };
									updateComponentInRow(rowIndex, componentIndex, newData);
								}}
							>
								<option value={1}>Primary</option>
								<option value={2}>Secondary</option>
								<option value={3}>Success</option>
								<option value={4}>Danger</option>
								<option value={5}>Link</option>
							</select>
						</div>

						<div className="md:col-span-2">
							<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">URL (optional)</label>
							<input
								type="text"
								className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={component.component.url || ''}
								onChange={(e) => {
									const newData = { ...component, component: { ...component.component, url: e.target.value } };
									updateComponentInRow(rowIndex, componentIndex, newData);
								}}
								placeholder="https://example.com"
							/>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};

	return (
		<BuilderSectionWrapper title={`Action Rows (${actionRows.length})`}>
			<div className="space-y-4">
				<div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
					<strong>Action Rows:</strong> These components appear below the embed message. Use them for interactive actions like Submit/Cancel
					buttons or forms.
				</div>

				{actionRows.map((row, rowIndex) => (
					<div key={rowIndex} className="p-4 bg-blue-50 border border-blue-200 rounded-md">
						<div className="flex justify-between items-center mb-3">
							<div className="flex items-center gap-2">
								<span className="text-sm font-bold text-blue-700 uppercase bg-blue-100 px-2 py-1 rounded">Row {rowIndex + 1}</span>
								<span className="text-xs text-gray-500">({row.components.length} components)</span>
							</div>

							<div className="flex gap-1">
								<button
									onClick={() => moveActionRow(rowIndex, 'up')}
									className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm transition-colors"
									disabled={rowIndex === 0}
									title="Move up"
								>
									↑
								</button>
								<button
									onClick={() => moveActionRow(rowIndex, 'down')}
									className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm transition-colors"
									disabled={rowIndex === actionRows.length - 1}
									title="Move down"
								>
									↓
								</button>
								<button
									onClick={() => removeActionRow(rowIndex)}
									className="p-1 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm transition-colors"
									title="Remove row"
								>
									🗑
								</button>
							</div>
						</div>

						<div className="space-y-2">
							{row.components.length === 0 ? (
								<p className="text-xs text-gray-500 italic text-center py-2">No components in this row</p>
							) : (
								<div className="space-y-2">
									{row.components.map((component: any, componentIndex: number) =>
										renderComponentEditor(rowIndex, component, componentIndex)
									)}
								</div>
							)}

							<div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100">
								<button
									onClick={() => addComponentToRow(rowIndex, 'button')}
									className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
								>
									+ Button
								</button>
								<button
									onClick={() => addComponentToRow(rowIndex, 'select')}
									className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium"
								>
									+ Select
								</button>
								<button
									onClick={() => addComponentToRow(rowIndex, 'input')}
									className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
								>
									+ Input
								</button>
							</div>
						</div>
					</div>
				))}

				<BuilderButton onClick={addActionRow} variant="secondary" className="w-full border-dashed">
					+ Add Action Row
				</BuilderButton>
			</div>
		</BuilderSectionWrapper>
	);
};
