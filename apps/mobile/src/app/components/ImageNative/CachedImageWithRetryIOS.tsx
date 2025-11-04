import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FastNativeImage } from './FastNativeImage';

interface ICachedImageWithRetryIOSProps {
	source: { uri: string };
	urlOriginal?: string;
	style?: any;
	resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}

const NX_BASE_IMG_URL_OLD = 'https://cdn.mezon.vn';

const extractOriginalUrl = (url: string): string | null => {
	if (url?.includes?.(process.env.NX_IMGPROXY_BASE_URL) && (url?.includes?.(process.env.NX_BASE_IMG_URL) || url?.includes?.(NX_BASE_IMG_URL_OLD))) {
		const parts = url?.split?.('/plain/');
		if (parts?.length > 1 && (parts?.[1]?.startsWith(process.env.NX_BASE_IMG_URL) || parts?.[1]?.startsWith(NX_BASE_IMG_URL_OLD))) {
			return parts?.[1]?.split?.('@')?.[0];
		}
	}
	return null;
};

const CachedImageWithRetryIOS = memo(
	({ source, urlOriginal, style, resizeMode = 'cover', ...props }: ICachedImageWithRetryIOSProps) => {
		const [hasError, setHasError] = useState<boolean>(false);
		const [currentUri, setCurrentUri] = useState<string>(source?.uri);
		const mountedRef = useRef<boolean>(true);

		useEffect(() => {
			mountedRef.current = true;
			setHasError(false);
			setCurrentUri(source?.uri);

			return () => {
				mountedRef.current = false;
			};
		}, [source?.uri]);

		const handleError = useCallback(
			(e: any) => {
				if (!mountedRef.current || hasError) return;
				const fallbackUrl = urlOriginal || extractOriginalUrl(source?.uri);

				if (fallbackUrl && fallbackUrl !== currentUri) {
					setHasError(true);
					setCurrentUri(fallbackUrl);
				} else {
					/* empty */
				}
			},
			[source?.uri, urlOriginal, hasError, currentUri]
		);

		return (
			<View style={[styles.container, style]}>
				<FastNativeImage
					source={{
						uri: currentUri,
						priority: 'normal'
					}}
					style={StyleSheet.absoluteFill}
					resizeMode={resizeMode}
					onError={handleError}
					{...props}
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.source?.uri === nextProps.source?.uri &&
			prevProps?.style === nextProps?.style &&
			prevProps?.resizeMode === nextProps?.resizeMode
		);
	}
);

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden'
	}
});

export default CachedImageWithRetryIOS;
