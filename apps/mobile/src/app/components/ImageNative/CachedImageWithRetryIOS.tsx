import * as Sentry from '@sentry/react-native';
import React, { useEffect, useState } from 'react';
import FastImage from 'react-native-fast-image';

const CachedImageWithRetryIOS = ({ source, retryCount = 3, ...props }) => {
	const [currentSource, setCurrentSource] = useState(source);
	const [retriesLeft, setRetriesLeft] = useState(retryCount);
	const [key, setKey] = useState(Date.now());

	useEffect(() => {
		setCurrentSource(source);
		setRetriesLeft(retryCount);
		setKey(Date.now());
	}, [source]);

	const handleError = (err) => {
		console.error('log  => err', err);
		try {
			if (retriesLeft > 0) {
				setTimeout(() => {
					setRetriesLeft(retriesLeft - 1);
					setKey(Date.now()); // Force re-render to retry
				}, 500); // Wait 500ms before retry
			}
			Sentry.captureException(err);
		} catch (error) {
			console.error('log  => error', error);
		}
	};

	return (
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
			{...props}
		/>
	);
};

export default CachedImageWithRetryIOS;
