import * as Sentry from '@sentry/react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

const CachedImageWithRetryIOS = ({ source, retryCount = 5, style, ...props }) => {
	const [currentSource, setCurrentSource] = useState(source);
	const [retriesLeft, setRetriesLeft] = useState(retryCount);
	const [key, setKey] = useState(Date.now());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setCurrentSource(source);
		setRetriesLeft(retryCount);
		setKey(Date.now());
		setLoading(true);
	}, [source]);

	const handleError = (err) => {
		console.error('log  => err', err);
		try {
			if (retriesLeft > 0) {
				setTimeout(() => {
					setRetriesLeft(retriesLeft - 1);
					setKey(Date.now());
				}, 1000);
			} else {
				setLoading(false);
			}
			Sentry.captureException(err);
		} catch (error) {
			console.error('log  => error', error);
		}
	};

	const handleLoadEnd = () => {
		setLoading(false);
	};

	return (
		<View style={[styles.container, style]}>
			{loading && <ActivityIndicator style={styles.loader} size="small" color="#333333" />}
			<FastImage
				key={`${key}_${retriesLeft}_${source?.url}`} // Unique key to force re-render
				source={{
					...currentSource,
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
};

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
