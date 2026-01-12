/**
 * Upload Service - Upload files to MinIO via backend API
 */

const baseURL = process.env.NX_MEZON_FLOW_URL ?? 'http://localhost:3001/api';

export interface UploadResponse {
	url: string;
	filename: string;
	filetype: string;
	size: number;
	width?: number;
	height?: number;
}

/**
 * Upload file to MinIO via backend
 * Backend endpoint should handle MinIO upload and return public URL
 */
export async function uploadFileToMinIO(file: File): Promise<UploadResponse> {
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await fetch(`${baseURL}/upload`, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Upload failed');
		}

		const result = await response.json();

		return {
			url: result.url, // Public URL from MinIO
			filename: result.filename || file.name,
			filetype: result.filetype || file.type,
			size: result.size || file.size,
			width: result.width,
			height: result.height
		};
	} catch (error) {
		console.error('Upload to MinIO failed:', error);
		throw error;
	}
}

/**
 * Upload image and get dimensions
 */
export async function uploadImageToMinIO(file: File): Promise<UploadResponse> {
	// Get image dimensions before upload
	const dimensions = await getImageDimensions(file);

	const result = await uploadFileToMinIO(file);

	return {
		...result,
		width: dimensions.width,
		height: dimensions.height
	};
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith('image/')) {
			resolve({ width: 0, height: 0 });
			return;
		}

		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ width: img.width, height: img.height });
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load image'));
		};

		img.src = url;
	});
}
