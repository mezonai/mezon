import { ApiDimensions, ApiPhoto, ApiVideo } from '../types';

export function getPhotoInlineDimensions(photo: Pick<ApiPhoto, 'sizes' | 'thumbnail'>) {
	return photo;
}

export function getVideoDimensions(video: ApiVideo): ApiDimensions | undefined {
	if (video.width && video.height) {
		return video as ApiDimensions;
	}

	return undefined;
}
