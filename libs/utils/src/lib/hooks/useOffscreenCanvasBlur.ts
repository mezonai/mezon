import { useLayoutEffect, useMemo, useRef } from 'react';
import { requestMutation } from '../fasterdom';
import { preloadImage } from '../helper/files';
import cycleRestrict from '../utils/cycleRestrict';
import { MAX_WORKERS, requestMediaWorker } from '../utils/launchMediaWorkers';
import useLastCallback from './useLastCallback';

const RADIUS_RATIO = 0.1; // Use 10% of the smallest dimension as the blur radius

let lastWorkerIndex = -1;

export default function useOffscreenCanvasBlur(
	thumbData?: string, // data URI or blob URL
	isDisabled = false
) {
	// eslint-disable-next-line no-null/no-null
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const workerIndex = useMemo(() => cycleRestrict(MAX_WORKERS, ++lastWorkerIndex), []);
	const offscreenRef = useRef<OffscreenCanvas>();

	const blurThumb = useLastCallback(async (canvas: HTMLCanvasElement, uri: string) => {
		console.log(uri, 'blurThumb');

		const image = await preloadImage(uri);
		if (!image) {
			return;
		}

		requestMutation(() => {
			canvas.width = image.width;
			canvas.height = image.height;

			offscreenRef.current = canvas.transferControlToOffscreen();

			const radius = Math.ceil(Math.min(image.width, image.height) * RADIUS_RATIO);

			requestMediaWorker(
				{
					name: 'offscreen-canvas:blurThumb',
					args: [offscreenRef.current, uri, radius],
					transferables: [offscreenRef.current]
				},
				workerIndex
			);
		});
	});

	useLayoutEffect(() => {
		console.log({ thumbData, canvasRef }, 'thumbData11');

		if (!thumbData) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		blurThumb(canvas, thumbData);
	}, [blurThumb, isDisabled, thumbData]);

	return canvasRef;
}
