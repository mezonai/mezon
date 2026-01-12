import React, { useEffect, useRef, useState } from 'react';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { BuilderSectionWrapper, BuilderTextInput } from '../ui/BuilderUI';

export const FooterSection: React.FC = () => {
	const { data, updateEmbedSection } = useEmbedBuilder();
	const { uploadFile, processUrl } = useMediaUpload();
	const footerIconInputRef = useRef<HTMLInputElement>(null);
	const [footerIconUrl, setFooterIconUrl] = useState(data.embed?.footer?.icon_url || '');

	useEffect(() => {
		setFooterIconUrl(data.embed?.footer?.icon_url || '');
	}, [data.embed?.footer?.icon_url]);

	const containsTemplateVariables = (url: string): boolean => {
		return /\{\{[^}]+}}|\$\{[^}]+}/.test(url);
	};

	const handleFooterIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const result = await uploadFile(file);
			updateEmbedSection('footer', { icon_url: result.url });
			setFooterIconUrl(result.url);
		} catch (err) {
			console.error('Upload failed:', err);
		}
	};

	// Handle footer icon URL change
	const handleFooterIconUrlChange = async (url: string) => {
		setFooterIconUrl(url);

		if (!url) {
			updateEmbedSection('footer', { icon_url: '' });
			return;
		}

		try {
			const result = await processUrl(url);
			updateEmbedSection('footer', { icon_url: result.url });
		} catch (err) {
			// If validation fails, still set URL
			updateEmbedSection('footer', { icon_url: url });
		}
	};

	return (
		<BuilderSectionWrapper title="Footer">
			<div className="space-y-3">
				<BuilderTextInput
					label="Footer Text"
					placeholder="Footer content..."
					maxLength={2048}
					value={data.embed?.footer?.text || ''}
					onChange={(e) => updateEmbedSection('footer', { text: e.target.value })}
				/>

				<div>
					<label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
						Footer Icon
						<span className="ml-2 text-xs font-normal normal-case">Support: URL or {`{key}`}</span>
					</label>
					<BuilderTextInput
						placeholder="https://... or {icon.url}"
						value={footerIconUrl}
						onChange={(e) => handleFooterIconUrlChange(e.target.value)}
					/>

					{/* Template Variable Indicator */}
					{footerIconUrl && containsTemplateVariables(footerIconUrl) && (
						<div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
							<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Template variable will detect</span>
						</div>
					)}

					{/* Upload Button & Preview */}
					<div className="mt-2 flex items-center gap-2">
						<button
							type="button"
							onClick={() => footerIconInputRef.current?.click()}
							className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
						>
							📤 Upload Icon
						</button>
						<input ref={footerIconInputRef} type="file" accept="image/*" onChange={handleFooterIconUpload} className="hidden" />

						{/* Preview - only for real URLs */}
						{footerIconUrl && !containsTemplateVariables(footerIconUrl) && (
							<img src={footerIconUrl} alt="Footer icon preview" className="h-8 w-8 object-cover rounded-full border border-gray-300" />
						)}
					</div>
				</div>
			</div>
		</BuilderSectionWrapper>
	);
};
