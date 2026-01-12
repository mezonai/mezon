import { EMessageComponentType, EMessageSelectType } from '@mezon/utils';
import React, { useMemo } from 'react';
import type { IEmbedField } from '../context/EmbedBuilderContext';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { AnimationEditor } from '../editors/AnimationEditor';
import { ButtonsEditor } from '../editors/ButtonsEditor';
import { DatePickerEditor } from '../editors/DatePickerEditor';
import { GridEditor } from '../editors/GridEditor';
import { InputEditor } from '../editors/InputEditor';
import { RadioEditor } from '../editors/RadioEditor';
import { SelectEditor } from '../editors/SelectEditor';
import { BuilderButton, BuilderSectionWrapper, BuilderSwitch, BuilderTextInput, BuilderTextarea } from '../ui/BuilderUI';

export const FieldsSection: React.FC = () => {
	const { data, updateEmbed } = useEmbedBuilder();
	const fields = useMemo(() => data.embed?.fields || [], [data.embed?.fields]);

	const addField = () => {
		if (fields.length >= 25) return;
		updateEmbed({
			fields: [...fields, { name: '', value: '', inline: false }]
		});
	};

	const updateField = (index: number, data: Partial<IEmbedField>) => {
		const newFields = [...fields];
		newFields[index] = { ...newFields[index], ...data };
		updateEmbed({ fields: newFields });
	};

	const removeField = (index: number) => {
		const newFields = fields.filter((_, i) => i !== index);
		updateEmbed({ fields: newFields });
	};

	const moveField = (index: number, direction: 'up' | 'down') => {
		if (direction === 'up' && index === 0) return;
		if (direction === 'down' && index === fields.length - 1) return;

		const newFields = [...fields];
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
		updateEmbed({ fields: newFields });
	};

	const groupedFields = useMemo(() => {
		let currentIndex = 0;
		return fields.reduce<{ field: (typeof fields)[0]; index: number }[][]>((acc, field) => {
			const item = { field, index: currentIndex++ };
			if (!field.inline) {
				acc.push([item]);
			} else {
				const lastRow = acc[acc.length - 1];
				if (lastRow && lastRow[0].field.inline && lastRow.length < 3) {
					lastRow.push(item);
				} else {
					acc.push([item]);
				}
			}
			return acc;
		}, []);
	}, [fields]);

	const addComponent = (index: number, type: 'input' | 'select' | 'grid' | 'button' | 'datepicker' | 'radio' | 'animation') => {
		const id = Date.now().toString();
		let data: any = {};

		if (type === 'input') {
			data = {
				inputs: {
					type: EMessageComponentType.INPUT,
					id: `input_${id}`,
					component: { placeholder: 'Enter text', type: 'text' }
				}
			};
		} else if (type === 'select') {
			data = {
				inputs: {
					type: EMessageComponentType.SELECT,
					id: `select_${id}`,
					component: {
						type: EMessageSelectType.TEXT,
						options: [{ label: 'Option 1', value: '1' }]
					}
				}
			};
		} else if (type === 'datepicker') {
			data = {
				inputs: {
					type: EMessageComponentType.DATEPICKER,
					id: `datepicker_${id}`,
					component: { value: '' }
				}
			};
		} else if (type === 'radio') {
			data = {
				inputs: {
					type: EMessageComponentType.RADIO,
					id: `radio_${id}`,
					component: [
						{ label: 'Option 1', value: '1', name: 'radio_group' },
						{ label: 'Option 2', value: '2', name: 'radio_group' }
					]
				}
			};
		} else if (type === 'animation') {
			data = {
				inputs: {
					type: EMessageComponentType.ANIMATION,
					id: `animation_${id}`,
					component: {
						duration: 2,
						repeat: undefined
					}
				}
			};
		} else if (type === 'grid') {
			data = {
				shape: {
					type: EMessageComponentType.GRID,
					id: `grid_${id}`,
					columns: 2,
					rows: 2,
					component: { items: [] }
				}
			};
		} else if (type === 'button') {
			data = {
				button: [
					{
						type: EMessageComponentType.BUTTON,
						id: `btn_${id}`,
						component: { label: 'Click Me', style: 1 }
					}
				]
			};
		}

		updateField(index, data);
	};

	return (
		<BuilderSectionWrapper title={`Fields (${fields.length})`}>
			<div className="space-y-4">
				{groupedFields.map((row, rowIndex) => (
					<div
						key={rowIndex}
						className={`grid gap-4 ${row.length === 1 ? 'grid-cols-1' : row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
					>
						{row.map(({ field, index }) => (
							<div
								key={index}
								className={`p-3 bg-gray-50 border border-gray-200 rounded-md relative group ${
									field.inline ? `col-span-${3 / row.length}` : 'col-span-3'
								}`}
							>
								<div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
									<button
										onClick={() => moveField(index, 'up')}
										className="p-1 text-gray-400 hover:text-blue-500 bg-white rounded shadow-sm"
										disabled={index === 0}
									>
										↑
									</button>
									<button
										onClick={() => moveField(index, 'down')}
										className="p-1 text-gray-400 hover:text-blue-500 bg-white rounded shadow-sm"
										disabled={index === fields.length - 1}
									>
										↓
									</button>
									<button
										onClick={() => removeField(index)}
										className="p-1 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm"
									>
										🗑
									</button>
								</div>

								<div className="grid grid-cols-1 gap-3">
									<BuilderTextInput
										label="Name"
										placeholder="Field Name"
										maxLength={256}
										value={field.name}
										onChange={(e) => updateField(index, { name: e.target.value })}
									/>
									<BuilderTextarea
										label="Value"
										placeholder="Field Value"
										maxLength={1024}
										rows={2}
										value={field.value}
										onChange={(e) => updateField(index, { value: e.target.value })}
									/>
									<BuilderSwitch
										label="Inline"
										checked={field.inline}
										onChange={(checked) => updateField(index, { inline: checked })}
									/>

									{/* Advanced Components Section */}
									<div className="mt-2 pt-2 border-t border-gray-200">
										<p className="text-xs font-semibold text-gray-500 mb-2">Components</p>

										{!field.inputs && !field.shape && (
											<div className="flex flex-wrap gap-2 mb-2">
												<button
													onClick={() => addComponent(index, 'input')}
													className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
												>
													+ Input
												</button>
												<button
													onClick={() => addComponent(index, 'select')}
													className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
												>
													+ Select
												</button>
												<button
													onClick={() => addComponent(index, 'datepicker')}
													className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
												>
													+ DatePicker
												</button>
												<button
													onClick={() => addComponent(index, 'radio')}
													className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded hover:bg-rose-200"
												>
													+ Radio
												</button>
												<button
													onClick={() => addComponent(index, 'animation')}
													className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
												>
													+ Animation
												</button>
												<button
													onClick={() => addComponent(index, 'grid')}
													className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
												>
													+ Grid
												</button>
											</div>
										)}

										{/* Inputs/Select Editor */}
										{field.inputs && field.inputs.type === EMessageComponentType.INPUT && (
											<InputEditor
												data={field.inputs}
												onChange={(data) => updateField(index, { inputs: data })}
												onRemove={() => updateField(index, { inputs: undefined })}
											/>
										)}

										{field.inputs && field.inputs.type === EMessageComponentType.SELECT && (
											<SelectEditor
												data={field.inputs}
												onChange={(data) => updateField(index, { inputs: data })}
												onRemove={() => updateField(index, { inputs: undefined })}
											/>
										)}

										{field.inputs && field.inputs.type === EMessageComponentType.DATEPICKER && (
											<DatePickerEditor
												data={field.inputs}
												onChange={(data) => updateField(index, { inputs: data })}
												onRemove={() => updateField(index, { inputs: undefined })}
											/>
										)}

										{field.inputs && field.inputs.type === EMessageComponentType.RADIO && (
											<RadioEditor
												data={field.inputs}
												onChange={(data) => updateField(index, { inputs: data })}
												onRemove={() => updateField(index, { inputs: undefined })}
											/>
										)}

										{field.inputs && field.inputs.type === EMessageComponentType.ANIMATION && (
											<AnimationEditor
												data={field.inputs}
												onChange={(data) => updateField(index, { inputs: data })}
												onRemove={() => updateField(index, { inputs: undefined })}
											/>
										)}

										{/* Shape/Grid Editor */}
										{field.shape && (
											<GridEditor
												data={field.shape}
												onChange={(data) => updateField(index, { shape: data })}
												onRemove={() => updateField(index, { shape: undefined })}
											/>
										)}

										{/* Buttons Editor */}
										<div className="mt-2 pt-2 border-t border-gray-100">
											<ButtonsEditor data={field.button || []} onChange={(data) => updateField(index, { button: data })} />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				))}

				<BuilderButton onClick={addField} variant="secondary" className="w-full border-dashed">
					+ Add Field
				</BuilderButton>
			</div>
		</BuilderSectionWrapper>
	);
};
