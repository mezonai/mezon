import * as Sentry from '@sentry/react-native';
import React, { memo, useEffect, useState } from 'react';
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
	if (url.includes(process.env.NX_IMGPROXY_BASE_URL) && url.includes(process.env.NX_BASE_IMG_URL)) {
		const parts = url.split('/plain/');
		if (parts.length > 1 && parts[1].startsWith(process.env.NX_BASE_IMG_URL)) {
			return parts[1].split('@')[0];
		}
	}
	return null;
};

const CachedImageWithRetryIOS = memo(({ source, urlOriginal, retryCount = 3, style, ...props }: ICachedImageWithRetryIOSProps) => {
	const [currentSource, setCurrentSource] = useState(source);
	const [retriesLeft, setRetriesLeft] = useState(retryCount);
	const [key, setKey] = useState(Date.now());
	const [loading, setLoading] = useState<boolean>(true);
	const [isError, setIsError] = useState<boolean>(false);
	const [fallbackUrl, setFallbackUrl] = useState<string>(urlOriginal);

	useEffect(() => {
		setCurrentSource(source);
		setRetriesLeft(retryCount);
		setKey(Date.now());
		setLoading(true);
	}, [source]);

	const handleError = (err) => {
		if (retriesLeft > 0) {
			retryLoadingImage();
		} else {
			handleExhaustedRetries();
		}

		Sentry.captureException(err);
	};

	const retryLoadingImage = () => {
		setTimeout(() => {
			setRetriesLeft((prevRetries) => prevRetries - 1);
			setKey(Date.now());
		}, 1000);
	};

	const handleExhaustedRetries = () => {
		if (urlOriginal) {
			setIsError(true);
		} else {
			const getOriginalUrl = urlOriginal ? urlOriginal : extractOriginalUrl(source?.uri);
			if (getOriginalUrl) {
				setLoading(true);
				setFallbackUrl(getOriginalUrl);
				setIsError(true);
			}
		}
	};

	const handleLoadEnd = () => {
		setLoading(false);
	};

	return (
		<View style={[styles.container, style]}>
			{loading && <ActivityIndicator style={styles.loader} size="small" color="#333333" />}
			<FastImage
				key={`${key}_${retriesLeft}_${source?.uri}`}
				source={{
					uri: isError && fallbackUrl ? fallbackUrl : currentSource?.uri,
					priority: FastImage.priority.high,
					cache: FastImage.cacheControl.immutable
				}}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				onError={handleError}
				onLoadEnd={handleLoadEnd}
				style={StyleSheet.absoluteFill}
				{...props}
			/>
		</View>
	);
});

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
