import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import { connectField } from 'uniforms';

export interface EmbedFields {
	title?: string;
	url?: string;
	image?: string;
	thumbnail?: string;
	video?: string;
	description?: string;
	author?: string;
	color?: string;
	timestamp?: string;
	[key: string]: any;
}

export interface EmbedValue {
	mode?: 'fields' | 'raw';
	fields?: EmbedFields;
	raw?: string;
}

interface CustomEmbedFieldProps {
	onChange: (value: EmbedValue) => void;
	value?: EmbedValue;
	label?: string;
	error?: any;
	errorMessage?: string;
	showInlineError?: boolean;
	[key: string]: any;
}

const defaultFields: EmbedFields = {
	title: '',
	url: '',
	image: '',
	thumbnail: '',
	video: '',
	description: '',
	author: '',
	color: '',
	timestamp: ''
};

const EmbedTextField = ({
	name,
	label,
	value,
	onChange,
	placeholder,
	multiline = false
}: {
	name: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	multiline?: boolean;
}) => (
	<div className="mb-3">
		<label className="block text-sm font-medium mb-1">{label}</label>
		{multiline ? (
			<textarea
				name={name}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full p-2 rounded border bg-gray-700 text-white border-gray-600 focus:outline-none focus:border-blue-500"
				rows={3}
			/>
		) : (
			<input
				type="text"
				name={name}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full p-2 rounded border bg-gray-700 text-white border-gray-600 focus:outline-none focus:border-blue-500"
			/>
		)}
	</div>
);

// Expression Editor Modal - Chỉ 2 cột: Expression và Result
const ExpressionEditorModal = ({
	isOpen,
	onClose,
	value,
	onChange,
	result
}: {
	isOpen: boolean;
	onClose: () => void;
	value: string;
	onChange: (value: string) => void;
	result: string;
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-lg w-[80vw] max-w-4xl h-[80vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-end p-3 border-b border-gray-700">
					<button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
						×
					</button>
				</div>

				{/* Content - 2 columns */}
				<div className="flex flex-1 overflow-hidden">
					{/* Left Panel - Expression Editor */}
					<div className="flex-1 p-4 border-r border-gray-700">
						<textarea
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className="w-full h-full bg-gray-900 text-white p-4 rounded border border-blue-500 font-mono text-sm resize-none focus:outline-none"
							placeholder="{}"
						/>
					</div>

					{/* Right Panel - Result */}
					<div className="w-80 p-4 overflow-y-auto">
						<pre className="text-white font-mono text-sm whitespace-pre-wrap">{result || '{}'}</pre>
					</div>
				</div>
			</div>
		</div>
	);
};

const CustomEmbedField: React.FC<CustomEmbedFieldProps> = ({ onChange, value = {} as EmbedValue, label }) => {
	const safeValue: EmbedValue = value || {};
	const currentFields = safeValue.fields || defaultFields;

	const [mode, setMode] = useState<string>(safeValue.mode || 'fields');
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [showResult, setShowResult] = useState(false);

	const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const newMode = e.target.value;
		setMode(newMode);

		if (newMode === 'raw') {
			onChange({
				mode: 'raw',
				raw: JSON.stringify(currentFields, null, 2),
				fields: currentFields
			});
		} else {
			let parsed = defaultFields;
			try {
				parsed = safeValue.raw ? JSON.parse(safeValue.raw) : defaultFields;
			} catch (err) {
				/* ignore json error */
			}
			onChange({
				mode: 'fields',
				fields: parsed,
				raw: safeValue.raw || '{}'
			});
		}
	};

	const handleFieldChange = (field: keyof EmbedFields, fieldValue: string) => {
		const newFields = { ...currentFields, [field]: fieldValue };
		onChange({ ...safeValue, mode: mode as 'fields' | 'raw', fields: newFields });
	};

	const handleRawChange = (fieldValue: string) => {
		onChange({ ...safeValue, mode: mode as 'fields' | 'raw', raw: fieldValue });
	};

	const getResult = () => {
		try {
			const parsed = JSON.parse(safeValue.raw || '{}');
			return JSON.stringify(parsed, null, 2);
		} catch {
			return safeValue.raw || '{}';
		}
	};

	return (
		<div>
			<label className="block font-bold mb-2">{label || 'Embeds'}</label>
			<div className="mb-3">
				<select
					className="p-2 rounded border bg-gray-700 text-white"
					value={mode === 'fields' ? 'fields' : 'raw'}
					onChange={handleModeChange}
				>
					<option value="fields">Enter Fields</option>
					<option value="raw">Raw JSON</option>
				</select>
			</div>

			{mode === 'fields' ? (
				<div>
					<EmbedTextField
						name="description"
						label="Description"
						value={currentFields.description || ''}
						onChange={(v) => handleFieldChange('description', v)}
						placeholder="e.g. My description"
						multiline
					/>
					<EmbedTextField
						name="author"
						label="Author"
						value={currentFields.author || ''}
						onChange={(v) => handleFieldChange('author', v)}
						placeholder="e.g. Author name"
					/>
					<EmbedTextField
						name="color"
						label="Color"
						value={currentFields.color || ''}
						onChange={(v) => handleFieldChange('color', v)}
						placeholder="Color"
					/>
					<EmbedTextField
						name="timestamp"
						label="Timestamp"
						value={currentFields.timestamp || ''}
						onChange={(v) => handleFieldChange('timestamp', v)}
						placeholder="e.g. 2023-02-08 09:30:26"
					/>
					<EmbedTextField
						name="title"
						label="Title"
						value={currentFields.title || ''}
						onChange={(v) => handleFieldChange('title', v)}
						placeholder="e.g. Embed's title"
					/>
					<EmbedTextField
						name="url"
						label="URL"
						value={currentFields.url || ''}
						onChange={(v) => handleFieldChange('url', v)}
						placeholder="e.g. https://mezon.com/"
					/>
					<EmbedTextField
						name="image"
						label="URL Image"
						value={currentFields.image || ''}
						onChange={(v) => handleFieldChange('image', v)}
						placeholder="e.g. https://example.com/image.png"
					/>
					<EmbedTextField
						name="thumbnail"
						label="URL Thumbnail"
						value={currentFields.thumbnail || ''}
						onChange={(v) => handleFieldChange('thumbnail', v)}
						placeholder="e.g. https://example.com/image.png"
					/>
					<EmbedTextField
						name="video"
						label="URL Video"
						value={currentFields.video || ''}
						onChange={(v) => handleFieldChange('video', v)}
						placeholder="e.g. https://example.com/video.mp4"
					/>
				</div>
			) : (
				<div>
					{/* Input Field */}
					<div className="relative">
						<div
							className="flex items-center bg-gray-800 border border-gray-600 rounded px-3 py-2 cursor-text"
							onClick={() => setShowResult(true)}
						>
							<span className="text-purple-400 mr-2 font-mono text-sm">ƒx</span>
							<input
								type="text"
								value={safeValue.raw || '{}'}
								onChange={(e) => handleRawChange(e.target.value)}
								onFocus={() => setShowResult(true)}
								className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
								placeholder="{}"
							/>
							{/* Expand Button */}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsEditorOpen(true);
								}}
								className="text-orange-400 hover:text-orange-300 ml-2"
								title="Expand editor"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Result Panel */}
					{showResult && (
						<div className="mt-2 bg-gray-900 border border-gray-700 rounded">
							<div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
								<span className="text-white text-sm font-medium">Result</span>
								<div className="flex items-center gap-2">
									<span className="text-gray-400 text-xs">Item</span>
									<span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded">0</span>
									<button className="text-gray-400 hover:text-white text-xs">{'<'}</button>
									<button className="text-gray-400 hover:text-white text-xs">{'>'}</button>
								</div>
							</div>
							<div className="p-3">
								<pre className="text-gray-300 font-mono text-sm">{getResult()}</pre>
							</div>
						</div>
					)}

					{/* Expression Editor Modal */}
					<ExpressionEditorModal
						isOpen={isEditorOpen}
						onClose={() => setIsEditorOpen(false)}
						value={safeValue.raw || '{}'}
						onChange={handleRawChange}
						result={getResult()}
					/>
				</div>
			)}
		</div>
	);
};

export default connectField<CustomEmbedFieldProps>(CustomEmbedField);
