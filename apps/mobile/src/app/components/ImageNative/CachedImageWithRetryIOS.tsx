import React, { memo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

interface ICachedImageWithRetryIOSProps {
	source: { uri: string };
	urlOriginal?: string;
	retryCount?: number;
	style?: any;
	[key: string]: any;
}

const extractOriginalUrl = (url: string): string | null => {
	if (url?.includes?.(process.env.NX_IMGPROXY_BASE_URL) && (url?.includes?.('https://cdn.mezon.ai') || url?.includes?.('https://cdn.mezon.vn'))) {
		const parts = url?.split?.('/plain/');
		if (parts?.length > 1 && (parts?.[1]?.startsWith('https://cdn.mezon.ai') || parts?.[1]?.startsWith('https://cdn.mezon.vn'))) {
			return parts?.[1]?.split?.('@')?.[0];
		}
	}
	return null;
};

const CachedImageWithRetryIOS = memo(
	({ source, urlOriginal, retryCount = 1, style, ...props }: ICachedImageWithRetryIOSProps) => {
		const [key, setKey] = useState(Date.now());
		const [loading, setLoading] = useState<boolean>(false);
		const [isError, setIsError] = useState<boolean>(false);
		const [fallbackUrl, setFallbackUrl] = useState<string>(urlOriginal);

		const handleExhaustedRetries = () => {
			if (urlOriginal) {
				setIsError(true);
			} else {
				const getOriginalUrl = urlOriginal ? urlOriginal : extractOriginalUrl(source?.uri);
				if (getOriginalUrl) {
					setKey(Date.now());
					setFallbackUrl(getOriginalUrl);
					setIsError(true);
				}
			}
		};

		const handleLoadStart = () => {
			setLoading(true);
		};

		const handleLoadEnd = () => {
			setLoading(false);
		};

		return (
			<View style={[styles.container, style]}>
				{loading && <ActivityIndicator style={styles.loader} size="small" color="#333333" />}
				<FastImage
					key={`${key}_${source?.uri}`}
					source={{
						uri: isError && fallbackUrl ? fallbackUrl : source?.uri,
						priority: FastImage.priority.high,
						cache: FastImage.cacheControl.immutable
					}}
					onLoadStart={handleLoadStart}
					onError={handleExhaustedRetries}
					onLoadEnd={handleLoadEnd}
					style={StyleSheet.absoluteFill}
					{...props}
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.source?.uri === nextProps.source?.uri;
	}
);

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	loader: {
		position: 'absolute',
		zIndex: 1
	}
});

export default CachedImageWithRetryIOS;
