import type { CustomFile } from '@mezon/transport';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { processFile } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'video/mp4',
	'video/webm',
	'video/quicktime',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

type CustomFormFieldProps = HTMLFieldProps<ApiMessageAttachment[], HTMLDivElement>;

const MultiMediaUploadField = connectField((props: CustomFormFieldProps) => {
	const { value = [], onChange } = props;
	const { sessionRef, clientRef } = useMezon();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [expandedUrls, setExpandedUrls] = useState<Set<number>>(() => new Set());
	const [urlInput, setUrlInput] = useState('');

	// Format file size - defined first since it's used by validateFile
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
	};

	const validateFile = (file: File): { valid: boolean; error?: string } => {
		// Check size
		if (file.size > MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `File "${file.name}" is too large. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}.`
			};
		}

		// Check type
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return {
				valid: false,
				error: `File "${file.name}" has an unsupported format (${file.type}).`
			};
		}

		return { valid: true };
	};

	const getFileTypeIcon = (filetype?: string) => {
		if (!filetype) return <Icons.SelectFileIcon className="w-5 h-5 text-gray-400" />;
		if (filetype.startsWith('image/')) return <Icons.ImageUploadIcon className="w-5 h-5 text-blue-500" />;
		if (filetype.startsWith('video/')) return <Icons.VideoIcon className="w-5 h-5 text-purple-500" />;
		if (filetype.includes('pdf')) return <Icons.FileIcon className="w-5 h-5 text-red-500" />;
		if (filetype.includes('word')) return <Icons.FileIcon className="w-5 h-5 text-blue-600" />;
		if (filetype.includes('excel') || filetype.includes('sheet')) return <Icons.FileIcon className="w-5 h-5 text-green-600" />;
		return <Icons.FileIcon className="w-5 h-5 text-gray-500" />;
	};

	// Get file type label
	const getFileTypeLabel = (filetype?: string): string => {
		if (!filetype) return 'File';
		if (filetype.startsWith('image/')) return 'Image';
		if (filetype.startsWith('video/')) return 'Video';
		if (filetype.includes('pdf')) return 'PDF';
		if (filetype.includes('word')) return 'Word';
		if (filetype.includes('excel') || filetype.includes('sheet')) return 'Excel';
		return 'File';
	};

	const handleChooseFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!client || !session) {
				setError('Client or session is not initialized');
				return;
			}
			setIsUploading(true);
			setUploadProgress(0);
			setError(null);
			try {
				const newAttachments: Array<ApiMessageAttachment> = [];
				const errors: string[] = [];
				const totalFiles = e.target.files.length;

				for (let i = 0; i < e.target.files.length; i++) {
					const file: CustomFile = e.target.files[i];

					// Update progress
					setUploadProgress(Math.round((i / totalFiles) * 100));

					const validation = validateFile(file);
					if (!validation.valid) {
						errors.push(validation.error || 'Unknown error');
						continue;
					}

					try {
						const extraAttributes = await processFile<CustomFile>(file);
						file.width = extraAttributes.width;
						file.height = extraAttributes.height;

						const attachment = await handleUploadFile(client, session, file.name, file);

						if (attachment && attachment.url) {
							const completeAttachment: ApiMessageAttachment = {
								...attachment,
								filename: file.name,
								filetype: file.type, // MIME type: "image/png", "video/mp4", etc.
								size: file.size,
								width: file.width,
								height: file.height
							};
							newAttachments.push(completeAttachment);
						} else {
							errors.push(`Failed to upload file: ${file.name}`);
						}
					} catch (fileError) {
						console.error(`Error processing file ${file.name}:`, fileError);
						errors.push(`Error processing file: ${file.name}`);
					}
				}

				setUploadProgress(100);

				if (value === null) {
					onChange([...newAttachments]);
				} else {
					onChange([...value, ...newAttachments]);
				}

				if (errors.length > 0) {
					setError(errors.join('\n'));
				}
			} catch (error) {
				console.error('Error uploading files:', error);
				setError('Failed to upload files. Please try again.');
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
			}
		}
	};

	const extractFileNameFromUrl = (file: ApiMessageAttachment): string => {
		if (file.filename) {
			return file.filename;
		}

		const parts = file?.url?.split('undefined');
		return parts?.[parts.length - 1].split('/').pop() || 'unknown';
	};

	const handleRemoveFile = useCallback(
		(index: number) => {
			const newValue = value.filter((_, i) => i !== index);
			onChange(newValue);
		},
		[value, onChange]
	);

	const handleCopyUrl = useCallback(async (url: string, index: number) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}, []);

	const toggleUrlExpanded = useCallback((index: number) => {
		setExpandedUrls((prev) => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(index)) {
				newExpanded.delete(index);
			} else {
				newExpanded.add(index);
			}
			return newExpanded;
		});
	}, []);

	const truncateUrl = (url: string, maxLength = 50): string => {
		if (url.length <= maxLength) return url;
		return `${url.substring(0, maxLength - 3)}...`;
	};

	const isImageFile = (filetype?: string) => filetype?.startsWith('image/');
	const isVideoFile = (filetype?: string) => filetype?.startsWith('video/');

	const containsTemplateVariables = (url: string): boolean => {
		return /\{[^}]+}|\{\{[^}]+}}|\$\{[^}]+}/.test(url);
	};

	const extractTemplateKey = (url: string): string => {
		const match = url.match(/\{\{([^}]+)}}|\$\{([^}]+)}|\{([^}]+)}/);
		if (match) {
			return match[1] || match[2] || match[3] || url;
		}
		return url;
	};

	const wrapTemplateKey = (key: string): string => {
		if (key.startsWith('{') && key.endsWith('}')) {
			const extracted = extractTemplateKey(key);
			return `{${extracted}}`;
		}
		return `{${key}}`;
	};

	const isValidUrl = (url: string): boolean => {
		try {
			const urlObj = new URL(url);
			return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
		} catch {
			return false;
		}
	};

	const handleAddUrl = async () => {
		const url = urlInput.trim();
		if (!url) return;

		setError(null);

		if (url.length >= 512) {
			setError('The URL is too long. Please enter a URL shorter than 512 characters.');
			return;
		}

		try {
			let finalUrl = url;
			let filetype = 'template/variable';

			if (containsTemplateVariables(url)) {
				const key = extractTemplateKey(url);
				finalUrl = wrapTemplateKey(key);
			} else if (!isValidUrl(url)) {
				finalUrl = wrapTemplateKey(url);
			} else {
				filetype = 'image/unknown';
			}

			const attachment: ApiMessageAttachment = {
				url: finalUrl,
				filename: finalUrl.split('/').pop() || 'template',
				filetype,
				size: 0,
				width: 0,
				height: 0
			};

			const newValue = value === null ? [attachment] : [...value, attachment];

			onChange(newValue);
			setUrlInput('');
		} catch (err) {
			console.error('[MultiMediaUploadField] Error adding URL:', err);
			setError(`Failed to add URL: ${err}`);
		}
	};

	return (
		<div className="MultiMediaUploadField mt-2">
			<label className="block text-sm font-medium mb-1.5">
				Upload Media
				<span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">Hỗ trợ: File Upload, URL, {`{key}`}</span>
			</label>
			<div className="my-1 w-full flex flex-col items-center p-2 gap-4 bg-[#f2f3f5] dark:bg-[#2b2d31] border dark:border-[#4d4f52] rounded-md">
				{/* Manual URL Input Section */}
				<div className="w-full space-y-2">
					<label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Enter URL or Template Variable</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
							placeholder="https://..., {url}"
							disabled={isUploading}
							className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						<button
							type="button"
							onClick={handleAddUrl}
							disabled={isUploading || !urlInput.trim()}
							className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Add URL
						</button>
					</div>
				</div>

				{/* Divider */}
				<div className="w-full flex items-center gap-3">
					<div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
					<span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Or Upload Files</span>
					<div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
				</div>

				{/* File Upload Section */}
				<input
					type="file"
					ref={fileInputRef}
					hidden
					onChange={handleChooseFiles}
					accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					multiple
				/>
				<div
					className="relative w-full h-12 cursor-pointer flex justify-center items-center bg-bgLightModeThird dark:bg-[#141416] hover:bg-[#c6ccd2] dark:hover:bg-[#1a1c1e] transition-colors duration-200 rounded-md"
					onClick={() => !isUploading && fileInputRef.current?.click()}
				>
					{isUploading ? (
						<div className="flex items-center gap-2">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-gray-100"></div>
							<p>Uploading... {uploadProgress}%</p>
						</div>
					) : (
						<>
							<Icons.SelectFileIcon className="w-8 h-8 text-gray-400" />
							<p className="ml-2">Select Files from Device</p>
						</>
					)}
				</div>

				{/* Upload Progress Bar */}
				{isUploading && (
					<div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
						<div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
							<span>Uploading to CDN...</span>
							<span>{uploadProgress}%</span>
						</div>
						<div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
							<div
								className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				)}

				{value?.length > 0 && (
					<div className="w-full flex gap-2 flex-col">
						{value.map((file, index) => (
							<div
								key={index}
								className="flex flex-col bg-white dark:bg-[#36393f] rounded-md hover:bg-gray-50 dark:hover:bg-[#3d4046] transition-colors overflow-hidden"
							>
								<div className="flex items-center gap-3 p-3">
									{/* Thumbnail/Icon */}
									<div className="flex-shrink-0">
										{isImageFile(file.filetype) && file.url ? (
											<div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
												<img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
											</div>
										) : isVideoFile(file.filetype) && file.url ? (
											<div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
												<Icons.VideoIcon className="w-6 h-6 text-purple-500" />
											</div>
										) : (
											getFileTypeIcon(file.filetype)
										)}
									</div>

									{/* File Info */}
									<div className="flex-1 min-w-0">
										<p className="truncate font-medium text-sm">{file.filename || extractFileNameFromUrl(file)}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
											{getFileTypeLabel(file.filetype)}
											{file.size ? ` • ${formatFileSize(file.size)}` : ''}
											{file.width && file.height ? ` • ${file.width}×${file.height}` : ''}
										</p>

										{/* CDN URL Display */}
										{file.url && (
											<div className="mt-1.5 flex items-center gap-1">
												<span className="text-xs text-gray-400">
													{file.filetype === 'template/variable' ? 'Template:' : 'URL:'}
												</span>
												<button
													type="button"
													onClick={() => toggleUrlExpanded(index)}
													className={`text-xs hover:underline truncate max-w-[300px] ${
														file.filetype === 'template/variable'
															? 'text-purple-600 dark:text-purple-400'
															: 'text-blue-600 dark:text-blue-400'
													}`}
													title={file.url}
												>
													{expandedUrls.has(index) ? file.url : truncateUrl(file.url)}
												</button>
											</div>
										)}
									</div>

									{/* Action Buttons */}
									<div className="flex-shrink-0 flex items-center gap-1">
										{/* Copy URL Button */}
										{file.url && (
											<button
												type="button"
												className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
												onClick={() => handleCopyUrl(file.url || '', index)}
												title="Copy CDN URL"
											>
												{copiedIndex === index ? (
													<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
												) : (
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
														/>
													</svg>
												)}
											</button>
										)}

										{/* Delete Button */}
										<button
											type="button"
											className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
											onClick={() => handleRemoveFile(index)}
											title="Delete file"
										>
											<Icons.CloseIcon className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
				{error && (
					<div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
						<p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">{error}</p>
					</div>
				)}
			</div>
		</div>
	);
});

export default MultiMediaUploadField;
