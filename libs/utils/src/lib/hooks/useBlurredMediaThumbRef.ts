import { getMediaThumbUri, MediaWithThumbs } from '../helper/messageMedia';
import useOffscreenCanvasBlur from './useOffscreenCanvasBlur';

type CanvasBlurReturnType = ReturnType<typeof useOffscreenCanvasBlur>;

export default function useBlurredMediaThumbRef(forcedUri: string | undefined, isDisabled: boolean): CanvasBlurReturnType;
export default function useBlurredMediaThumbRef(media: MediaWithThumbs, isDisabled?: boolean): CanvasBlurReturnType;
export default function useBlurredMediaThumbRef(media: MediaWithThumbs | string | undefined, isDisabled?: boolean) {
	const dataUri = media ? (typeof media === 'string' ? media : getMediaThumbUri(media)) : undefined;
	return useOffscreenCanvasBlur(dataUri, false);
}
