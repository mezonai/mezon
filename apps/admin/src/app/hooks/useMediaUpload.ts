import type { CustomFile } from '@mezon/transport';
import { handleUploadFile, isValidUrl, useMezon } from '@mezon/transport';
import { processFile } from '@mezon/utils';
import { useState } from 'react';

export interface MediaUploadResult {
	url: string;
	filename: string;
	filetype: string;
	size: number;
	width?: number;
	height?: number;
}

export const useMediaUpload = () => {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const { sessionRef, clientRef } = useMezon();

	const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => {
				resolve({ width: 0, height: 0 });
			};
			img.src = url;
		});
	};

	const uploadFile = async (file: File): Promise<MediaUploadResult> => {
		try {
			const client = clientRef.current;
			const session = sessionRef.current;

			if (!client || !session) {
				throw new Error('Mezon client or session is not initialized');
			}

			setUploading(true);
			setProgress(0);

			setProgress(20);
			const customFile = file as CustomFile;
			const extraAttributes = await processFile<CustomFile>(customFile);
			customFile.width = extraAttributes.width;
			customFile.height = extraAttributes.height;

			setProgress(50);
			const result = await handleUploadFile(client, session, file.name, customFile);
			setProgress(100);

			if (!result?.url) {
				throw new Error('Upload failed: No URL returned');
			}

			return {
				url: result.url,
				filename: result.filename || file.name,
				filetype: result.filetype || file.type,
				size: result.size || file.size,
				width: result.width,
				height: result.height
			};
		} catch (error) {
			console.error('Upload failed:', error);
			throw new Error(`Upload failed: ${error}`);
		} finally {
			setUploading(false);
		}
	};

	const containsTemplateVariables = (url: string): boolean => {
		return /\{\{[^}]+}}|\$\{[^}]+}/.test(url);
	};

	const extractTemplateKey = (url: string): string => {
		const match = url.match(/\{\{([^}]+)}}|\$\{([^}]+)}/);
		if (match) {
			return match[1] || match[2] || url;
		}
		return url;
	};

	const processUrl = async (url: string): Promise<MediaUploadResult> => {
		if (url.length >= 512) {
			throw new Error('The URL is too long. Please enter a URL shorter than 512 characters.');
		}

		if (containsTemplateVariables(url)) {
			const key = extractTemplateKey(url);
			return {
				url: key,
				filename: key,
				filetype: 'template/variable',
				size: 0,
				width: 0,
				height: 0
			};
		}

		if (!isValidUrl(url)) {
			return {
				url,
				filename: url,
				filetype: 'template/variable',
				size: 0,
				width: 0,
				height: 0
			};
		}

		let width = 0;
		let height = 0;

		try {
			const dimensions = await getImageDimensions(url);
			width = dimensions.width;
			height = dimensions.height;
		} catch (e) {
			console.warn('Cannot get image dimensions:', e);
		}

		return {
			url,
			filename: url.split('/').pop() || 'unknown',
			filetype: 'image/unknown',
			size: 0,
			width,
			height
		};
	};

	return {
		uploadFile,
		processUrl,
		uploading,
		progress,
		containsTemplateVariables,
		extractTemplateKey
	};
};
