import type { AnimationComponent } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { BuilderSwitch, BuilderTextInput } from '../ui/BuilderUI';

interface AnimationEditorProps {
	data: AnimationComponent;
	onChange: (data: any) => void;
	onRemove?: () => void;
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({ data, onChange, onRemove }) => {
	const [showAdvanced, setShowAdvanced] = useState(false);
	const { uploadFile, processUrl } = useMediaUpload();
	const spriteSheetInputRef = useRef<HTMLInputElement>(null);
	const [spriteSheetUrl, setSpriteSheetUrl] = useState(data.component.url_image || '');

	const containsTemplateVariables = (url: string): boolean => {
		return /\{\{[^}]+}}|\$\{[^}]+}/.test(url);
	};

	const handleComponentChange = (key: string, value: any) => {
		onChange({
			...data,
			component: {
				...data.component,
				[key]: value
			}
		});
	};

	// Handle sprite sheet upload
	const handleSpriteSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const result = await uploadFile(file);
			handleComponentChange('url_image', result.url);
			setSpriteSheetUrl(result.url);
		} catch (err) {
			console.error('Upload failed:', err);
		}
	};

	// Handle sprite sheet URL change
	const handleSpriteSheetUrlChange = async (url: string) => {
		setSpriteSheetUrl(url);

		if (!url) {
			handleComponentChange('url_image', '');
			return;
		}

		try {
			const result = await processUrl(url);
			handleComponentChange('url_image', result.url);
		} catch (err) {
			// If validation fails, still set URL
			handleComponentChange('url_image', url);
		}
	};

	const addPool = () => {
		const newPools = [...(data.component.pool || []), []];
		handleComponentChange('pool', newPools);
	};

	const updatePool = (poolIndex: number, frames: string[]) => {
		const newPools = [...(data.component.pool || [])];
		newPools[poolIndex] = frames;
		handleComponentChange('pool', newPools);
	};

	const removePool = (poolIndex: number) => {
		const newPools = data.component.pool?.filter((_, i) => i !== poolIndex);
		handleComponentChange('pool', newPools);
	};

	const addFrameToPool = (poolIndex: number) => {
		const pool = data.component.pool?.[poolIndex] || [];
		updatePool(poolIndex, [...pool, '']);
	};

	const updateFrameInPool = (poolIndex: number, frameIndex: number, value: string) => {
		const pool = [...(data.component.pool?.[poolIndex] || [])];
		pool[frameIndex] = value;
		updatePool(poolIndex, pool);
	};

	const removeFrameFromPool = (poolIndex: number, frameIndex: number) => {
		const pool = data.component.pool?.[poolIndex]?.filter((_, i) => i !== frameIndex) || [];
		updatePool(poolIndex, pool);
	};

	return (
		<div className="space-y-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md relative group">
			<div className="flex justify-between items-center border-b border-indigo-200 pb-2 mb-2">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">Animation</span>
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

			<div className="bg-indigo-100 p-2 rounded text-xs text-indigo-800 mb-2">
				<strong>Sprite Animation:</strong> Provide a sprite sheet image and JSON position data defining frame coordinates for animation
				playback.
			</div>

			<div className="grid grid-cols-1 gap-3">
				{/* ID is auto-generated and used internally */}

				{/* Sprite Sheet URL with Upload */}
				<div>
					<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
						Sprite Sheet URL
						<span className="ml-2 text-xs font-normal normal-case">Support: URL or {`{key}`}</span>
					</label>
					<BuilderTextInput
						placeholder="https://... or {spritesheet.url}"
						value={spriteSheetUrl}
						onChange={(e) => handleSpriteSheetUrlChange(e.target.value)}
					/>

					{/* Template Variable Indicator */}
					{spriteSheetUrl && containsTemplateVariables(spriteSheetUrl) && (
						<div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
							<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Template will be detect</span>
						</div>
					)}

					{/* Upload Button & Preview */}
					<div className="mt-2 flex items-center gap-2">
						<button
							type="button"
							onClick={() => spriteSheetInputRef.current?.click()}
							className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
						>
							📤 Upload Sprite Sheet
						</button>
						<input ref={spriteSheetInputRef} type="file" accept="image/*" onChange={handleSpriteSheetUpload} className="hidden" />

						{/* Preview - only for real URLs */}
						{spriteSheetUrl && !containsTemplateVariables(spriteSheetUrl) && (
							<img
								src={spriteSheetUrl}
								alt="Sprite sheet preview"
								className="h-8 w-auto object-contain rounded border border-gray-300"
							/>
						)}
					</div>
				</div>

				<BuilderTextInput
					label="Position Data URL"
					value={data.component.url_position || ''}
					onChange={(e) => handleComponentChange('url_position', e.target.value)}
					placeholder="https://example.com/positions.json"
				/>

				<div className="grid grid-cols-2 gap-3">
					<BuilderTextInput
						label="Duration (seconds)"
						type="number"
						value={data.component.duration || 2}
						onChange={(e) => handleComponentChange('duration', parseFloat(e.target.value) || 2)}
						placeholder="2"
					/>

					<BuilderTextInput
						label="Repeat Count"
						type="number"
						value={data.component.repeat ?? ''}
						onChange={(e) => {
							const val = e.target.value;
							handleComponentChange('repeat', val === '' ? undefined : parseInt(val));
						}}
						placeholder="Empty = infinite"
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<BuilderSwitch
						label="Vertical Layout"
						checked={data.component.vertical || false}
						onChange={(checked) => handleComponentChange('vertical', checked)}
					/>

					<div className="w-full">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Show Result</label>
						<select
							className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							value={data.component.isResult || 0}
							onChange={(e) => handleComponentChange('isResult', parseInt(e.target.value))}
						>
							<option value={0}>Animate</option>
							<option value={1}>Final Frame Only</option>
						</select>
					</div>
				</div>
			</div>

			{/* Advanced: Animation Pools */}
			<div className="mt-3 border-t border-indigo-100 pt-3">
				<button
					onClick={() => setShowAdvanced(!showAdvanced)}
					className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-indigo-700 transition-colors"
				>
					<span>Advanced: Animation Pools</span>
					<span className="text-indigo-600">{showAdvanced ? '▼' : '▶'}</span>
				</button>

				{showAdvanced && (
					<div className="mt-2">
						<div className="bg-indigo-50 p-2 rounded text-xs text-gray-600 mb-2">
							Animation pools define sequences of frame names. Each pool is an array of frame identifiers from the position JSON.
						</div>

						<div className="flex justify-between items-center mb-2">
							<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pools</label>
							<button onClick={addPool} className="text-xs text-indigo-700 hover:text-indigo-900 font-medium">
								+ Add Pool
							</button>
						</div>

						<div className="space-y-2 max-h-60 overflow-y-auto pr-1">
							{data.component.pool?.map((pool, poolIdx) => (
								<div key={poolIdx} className="bg-white p-2 rounded border border-indigo-100">
									<div className="flex justify-between items-center mb-2">
										<span className="text-xs font-semibold text-gray-600">Pool {poolIdx + 1}</span>
										<button onClick={() => removePool(poolIdx)} className="text-gray-400 hover:text-red-500">
											×
										</button>
									</div>

									<div className="space-y-1">
										{pool.map((frame, frameIdx) => (
											<div key={frameIdx} className="flex gap-1 items-center">
												<input
													type="text"
													className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
													value={frame}
													onChange={(e) => updateFrameInPool(poolIdx, frameIdx, e.target.value)}
													placeholder={`Frame ${frameIdx + 1}`}
												/>
												<button
													onClick={() => removeFrameFromPool(poolIdx, frameIdx)}
													className="text-gray-400 hover:text-red-500 text-xs"
												>
													×
												</button>
											</div>
										))}
										<button
											onClick={() => addFrameToPool(poolIdx)}
											className="text-xs text-indigo-600 hover:text-indigo-800 font-medium w-full text-left"
										>
											+ Add Frame
										</button>
									</div>
								</div>
							))}
							{(!data.component.pool || data.component.pool.length === 0) && (
								<p className="text-xs text-gray-400 text-center italic py-2">No animation pools</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
