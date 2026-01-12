import React, { useEffect, useRef, useState } from 'react';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { BuilderSectionWrapper, BuilderTextInput } from '../ui/BuilderUI';

export const MediaSection: React.FC = () => {
	const { data, updateEmbedSection } = useEmbedBuilder();
	const { uploadFile, processUrl, uploading, progress } = useMediaUpload();
	const thumbnailInputRef = useRef<HTMLInputElement>(null);
	const mediaInputRef = useRef<HTMLInputElement>(null);
	const [urlInput, setUrlInput] = useState({
		thumbnail: data.embed?.thumbnail?.url || '',
		image: data.embed?.image?.url || ''
	});
	const [error, setError] = useState<string>('');

	useEffect(() => {
		setUrlInput({
			thumbnail: data.embed?.thumbnail?.url || '',
			image: data.embed?.image?.url || ''
		});
	}, [data.embed?.thumbnail?.url, data.embed?.image?.url]);

	const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setError('');
		try {
			const result = await uploadFile(file);
			updateEmbedSection('thumbnail', {
				url: result.url
			});
			setUrlInput((prev) => ({ ...prev, thumbnail: result.url }));
		} catch (err) {
			setError(`Upload failed: ${err}`);
		}
	};

	const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setError('');
		try {
			const result = await uploadFile(file);

			updateEmbedSection('image', {
				url: result.url,
				width: result.width,
				height: result.height
			});
			setUrlInput((prev) => ({ ...prev, image: result.url }));
		} catch (err) {
			setError(`Upload failed: ${err}`);
		}
	};

	const handleThumbnailUrlChange = async (url: string) => {
		setUrlInput((prev) => ({ ...prev, thumbnail: url }));
		setError('');

		if (!url) {
			updateEmbedSection('thumbnail', { url: '' });
			return;
		}

		try {
			const result = await processUrl(url);
			updateEmbedSection('thumbnail', {
				url: result.url
			});
		} catch (err) {
			updateEmbedSection('thumbnail', { url });
		}
	};

	const handleMediaUrlChange = async (url: string) => {
		setUrlInput((prev) => ({ ...prev, image: url }));
		setError('');

		if (!url) {
			updateEmbedSection('image', { url: '' });
			return;
		}

		updateEmbedSection('image', { url });
	};

	return (
		<BuilderSectionWrapper title="Media">
			<div className="space-y-3">
				{/* Thumbnail Section */}
				<div>
					<label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
						Thumbnail (Top Left)
						<span className="ml-2 text-xs font-normal text-gray-400 normal-case">Support: URL or {`{key}`}</span>
					</label>

					{/* URL Input */}
					<BuilderTextInput
						placeholder="https://example.com/image.png or {user.avatar}"
						value={urlInput.thumbnail}
						onChange={(e) => handleThumbnailUrlChange(e.target.value)}
						disabled={uploading}
					/>

					{/* Upload Button & Preview */}
					<div className="mt-2 flex items-center gap-2">
						<button
							type="button"
							onClick={() => thumbnailInputRef.current?.click()}
							disabled={uploading}
							className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							📤 Upload File
						</button>
						<input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
					</div>
				</div>

				{/* Media Section */}
				<div>
					<label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
						Media (Bottom)
						<span className="ml-2 text-xs font-normal text-gray-400 normal-case">Support: URL or {`{key}`}</span>
					</label>

					<div className="flex gap-2 items-end">
						{/* URL Input */}
						<div className="flex-1">
							<BuilderTextInput
								placeholder="https://example.com/image.png or {media.url}"
								value={urlInput.image}
								onChange={(e) => handleMediaUrlChange(e.target.value)}
								disabled={uploading}
							/>
						</div>
					</div>

					{/* Upload Button & Preview */}
					<div className="mt-2 flex items-center gap-2">
						{/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
						<button
							type="button"
							onClick={() => mediaInputRef.current?.click()}
							disabled={uploading}
							className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							📤 Upload File
						</button>
						<input ref={mediaInputRef} type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
					</div>
				</div>

				{/* Upload Progress */}
				{uploading && (
					<div className="p-2 bg-blue-50 rounded">
						<div className="text-xs text-blue-600 mb-1">Uploading... {progress}%</div>
						<div className="w-full bg-blue-200 rounded-full h-1.5">
							<div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
						</div>
					</div>
				)}

				{/* Error Message */}
				{error && (
					<div className="p-2 bg-red-50 border border-red-200 rounded">
						<div className="text-xs text-red-600">{error}</div>
					</div>
				)}
			</div>
		</BuilderSectionWrapper>
	);
};
