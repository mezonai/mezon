import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

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
	if (url?.includes?.(process.env.NX_IMGPROXY_BASE_URL) && url?.includes?.(process.env.NX_PROFILE_IMG_URL)) {
		const parts = url?.split?.('/plain/');
		if (parts?.length > 1 && (parts?.[1]?.startsWith(process.env.NX_PROFILE_IMG_URL) || parts?.[1]?.startsWith(NX_BASE_IMG_URL_OLD))) {
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

		const handleError = useCallback(() => {
			if (!mountedRef.current || hasError) return;
			const fallbackUrl = urlOriginal || extractOriginalUrl(source?.uri);

			if (fallbackUrl && fallbackUrl !== currentUri) {
				setHasError(true);
				setCurrentUri(fallbackUrl);
			} else {
				/* empty */
			}
		}, [source?.uri, urlOriginal, hasError, currentUri]);

		return (
			<View style={[styles.container, style]}>
				<FastImage
					source={{
						uri: currentUri,
						priority: FastImage.priority.normal,
						cache: FastImage.cacheControl.web
					}}
					onError={handleError}
					resizeMode={resizeMode}
					style={StyleSheet.absoluteFill}
					{...props}
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.source?.uri === nextProps.source?.uri && prevProps?.style === nextProps?.style;
	}
);

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden'
	},
	loader: {
		position: 'absolute',
		zIndex: 1
	},
	placeholder: {
		width: '100%',
		height: '100%'
	}
});

export default CachedImageWithRetryIOS;
