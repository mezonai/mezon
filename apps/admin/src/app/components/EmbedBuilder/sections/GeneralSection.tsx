import React, { useEffect, useRef, useState } from 'react';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { BuilderColorPicker, BuilderSectionWrapper, BuilderTextInput } from '../ui/BuilderUI';

export const GeneralSection: React.FC = () => {
	const { data, updateEmbed, updateEmbedSection } = useEmbedBuilder();
	const { uploadFile, processUrl } = useMediaUpload();
	const authorIconInputRef = useRef<HTMLInputElement>(null);
	const [authorIconUrl, setAuthorIconUrl] = useState(data.embed?.author?.icon_url || '');

	useEffect(() => {
		setAuthorIconUrl(data.embed?.author?.icon_url || '');
	}, [data.embed?.author?.icon_url]);

	const containsTemplateVariables = (url: string): boolean => {
		return /\{\{[^}]+}}|\$\{[^}]+}/.test(url);
	};

	const handleAuthorIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const result = await uploadFile(file);
			updateEmbedSection('author', { icon_url: result.url });
			setAuthorIconUrl(result.url);
		} catch (err) {
			console.error('Upload failed:', err);
		}
	};

	const handleAuthorIconUrlChange = async (url: string) => {
		setAuthorIconUrl(url);

		if (!url) {
			updateEmbedSection('author', { icon_url: '' });
			return;
		}

		try {
			const result = await processUrl(url);
			updateEmbedSection('author', { icon_url: result.url });
		} catch (err) {
			// If validation fails, still set URL
			updateEmbedSection('author', { icon_url: url });
		}
	};

	return (
		<BuilderSectionWrapper title="General & Author" defaultOpen={true}>
			<BuilderColorPicker label="Side Strip Color" value={data.embed?.color} onChange={(color) => updateEmbed({ color })} />

			<div className="pt-2 border-t border-gray-100 space-y-3">
				<h4 className="text-xs font-semibold text-gray-400 uppercase">Author</h4>
				<BuilderTextInput
					label="Author Name"
					placeholder="e.g. Mezon Bot"
					value={data.embed?.author?.name || ''}
					onChange={(e) => updateEmbedSection('author', { name: e.target.value })}
				/>
				<BuilderTextInput
					label="Author URL"
					placeholder="https://..."
					value={data.embed?.author?.url || ''}
					onChange={(e) => updateEmbedSection('author', { url: e.target.value })}
				/>

				{/* Author Icon with Upload */}
				<div>
					<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
						Author Icon URL
						<span className="ml-2 text-xs font-normal normal-case">Support: URL or {`{key}`}</span>
					</label>
					<BuilderTextInput
						placeholder="https://... or {user.avatar}"
						value={authorIconUrl}
						onChange={(e) => handleAuthorIconUrlChange(e.target.value)}
					/>

					{/* Template Variable Indicator */}
					{authorIconUrl && containsTemplateVariables(authorIconUrl) && (
						<div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
							<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Template variable được phát hiện</span>
						</div>
					)}

					{/* Upload Button & Preview */}
					<div className="mt-2 flex items-center gap-2">
						<button
							type="button"
							onClick={() => authorIconInputRef.current?.click()}
							className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
						>
							📤 Upload Icon
						</button>
						<input ref={authorIconInputRef} type="file" accept="image/*" onChange={handleAuthorIconUpload} className="hidden" />

						{/* Preview - only for real URLs */}
						{authorIconUrl && !containsTemplateVariables(authorIconUrl) && (
							<img src={authorIconUrl} alt="Author icon preview" className="h-8 w-8 object-cover rounded-full border border-gray-300" />
						)}
					</div>
				</div>
			</div>
		</BuilderSectionWrapper>
	);
};
