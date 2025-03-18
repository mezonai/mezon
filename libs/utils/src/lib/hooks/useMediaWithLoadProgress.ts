import { useEffect, useMemo, useRef, useState } from 'react';

import * as mediaLoader from '../helper/mediaLoader';
import { ApiMediaFormat } from '../types';
import { throttle } from '../utils';
import { IS_PROGRESSIVE_SUPPORTED } from '../utils/windowEnvironment';
import useForceUpdate from './useForceUpdate';
import useUniqueId from './useUniqueId';

const STREAMING_PROGRESS = 0.75;
const STREAMING_TIMEOUT = 1500;
const PROGRESS_THROTTLE = 500;

export default function useMediaWithLoadProgress(
	mediaHash: string | undefined,
	noLoad = false,
	mediaFormat = ApiMediaFormat.BlobUrl,
	delay?: number | false,
	isHtmlAllowed = false
) {
	console.log(mediaHash, 'mediaHash');

	const mediaData = mediaHash ? mediaLoader.getFromMemory(mediaHash) : undefined;
	const isStreaming = IS_PROGRESSIVE_SUPPORTED && mediaFormat === ApiMediaFormat.Progressive;
	const forceUpdate = useForceUpdate();
	const isSynced = true;
	const id = useUniqueId();
	const [loadProgress, setLoadProgress] = useState(mediaData && !isStreaming ? 1 : 0);
	const startedAtRef = useRef<number>();

	const handleProgress = useMemo(() => {
		return throttle(
			(progress: number) => {
				if (startedAtRef.current && (!delay || Date.now() - startedAtRef.current > delay)) {
					setLoadProgress(progress);
				}
			},
			PROGRESS_THROTTLE,
			true
		);
	}, [delay]);

	useEffect(() => {
		console.log({ noLoad, mediaData, mediaHash });

		if (!noLoad && mediaHash) {
			if (!mediaData) {
				setLoadProgress(0);

				if (startedAtRef.current) {
					mediaLoader.cancelProgress(handleProgress);
				}

				startedAtRef.current = Date.now();

				console.log('RUNNN');

				mediaLoader.fetch(mediaHash, mediaFormat, isHtmlAllowed, handleProgress, id).then(() => {
					const spentTime = Date.now() - startedAtRef.current!;
					startedAtRef.current = undefined;

					if (!delay || spentTime >= delay) {
						forceUpdate();
					} else {
						setTimeout(forceUpdate, delay - spentTime);
					}
				});
			} else if (isStreaming) {
				setTimeout(() => {
					setLoadProgress(STREAMING_PROGRESS);
				}, STREAMING_TIMEOUT);
			}
		}
	}, [noLoad, mediaHash, mediaData, mediaFormat, isStreaming, delay, handleProgress, isHtmlAllowed, id, isSynced]);

	useEffect(() => {
		if (noLoad && startedAtRef.current) {
			mediaLoader.cancelProgress(handleProgress);
			setLoadProgress(0);
			startedAtRef.current = undefined;
		}
	}, [handleProgress, noLoad]);

	useEffect(() => {
		return () => {
			if (mediaHash) {
				mediaLoader.removeCallback(mediaHash, id);
			}
		};
	}, [id, mediaHash]);

	console.log({ mediaData, loadProgress }, '{ mediaData, loadProgress }');

	return { mediaData, loadProgress };
}
