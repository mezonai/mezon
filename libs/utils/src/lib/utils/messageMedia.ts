import { ApiDimensions, ApiPhoto, ApiVideo } from '../types';

export function getPhotoInlineDimensions(photo: Pick<ApiPhoto, 'sizes' | 'thumbnail'>) {
	return photo;
	// return (
	// 	photo.sizes.find((size) => size.type === 'x') ||
	// 	photo.sizes.find((size) => size.type === 'm') ||
	// 	photo.sizes.find((size) => size.type === 's') ||
	// 	photo.thumbnail
	// );
}

export function getVideoDimensions(video: ApiVideo): ApiDimensions | undefined {
	if (video.width && video.height) {
		return video as ApiDimensions;
	}

	return undefined;
}
