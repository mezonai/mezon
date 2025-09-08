import { useCallback, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Dimensions } from 'react-native';

type UseFitContentSnapPointsParams = {
	snapPoints: string[];
	maxHeightPercent?: string;
	snapPointsWithFitContent?: boolean;
};

type UseFitContentSnapPointsReturn = {
	percentSnapPoints: string[];
	onContentLayout: (e: LayoutChangeEvent) => void;
	contentHeight: number | null;
};

export function useFitContentSnapPoints(params: UseFitContentSnapPointsParams): UseFitContentSnapPointsReturn {
	const windowHeight = useRef(Dimensions.get('window').height);
	const { snapPoints, maxHeightPercent, snapPointsWithFitContent } = params;
	const [contentHeight, setContentHeight] = useState<number>(0);

	const maxHeightValue = useMemo<number | null>(() => {
		if (!maxHeightPercent) return 0;
		return Number(maxHeightPercent.trim().replace('%', '')) || 0;
	}, [maxHeightPercent]);

	const percentSnapPoints = useMemo(() => {
		if (!snapPointsWithFitContent) return snapPoints.map((p) => (p.includes('%') ? p : `${p}%`));
		const snapPointsNumber = convertPercentToNumber(snapPoints);

		const allSnapPoints = [contentHeight, maxHeightValue]
			.filter((value) => value !== 0)
			.concat(snapPointsNumber)
			.sort((a, b) => a - b);

		let filteredSnapPoints = [];
		if (contentHeight >= maxHeightValue) {
			const maxHeightPosition = allSnapPoints.indexOf(maxHeightValue);
			if (maxHeightPosition === -1) filteredSnapPoints = allSnapPoints;
			else filteredSnapPoints = allSnapPoints.slice(0, maxHeightPosition + 1);
		} else {
			const contentHeightPosition = allSnapPoints.indexOf(contentHeight);
			if (contentHeightPosition === -1) filteredSnapPoints = allSnapPoints;
			else filteredSnapPoints = allSnapPoints.slice(0, contentHeightPosition + 1);
		}

		// Apply filter to ensure minimum distance of 20%
		const filteredWithMinDistance = filterArrayWithMinDistance(filteredSnapPoints, 20);

		return filteredWithMinDistance.map((p) => `${p}%`);
	}, [contentHeight, maxHeightValue, snapPoints]);

	const onContentLayout = useCallback((e: LayoutChangeEvent) => {
		const measuredPx = e?.nativeEvent?.layout?.height;
		let padding = 48;
		if (typeof measuredPx === 'number' && measuredPx >= 0) {
			const percentOfWindow = windowHeight.current > 0 ? Math.floor(((measuredPx + padding) / windowHeight.current) * 100) : 0;
			setContentHeight(percentOfWindow || 0);
		}
	}, []);

	return {
		percentSnapPoints,
		contentHeight,
		onContentLayout
	};
}

const convertPercentToNumber = (snapPoints: string[]) => {
	return snapPoints.map((p) => Number(p.trim().replace('%', ''))) || [];
};

const filterArrayWithMinDistance = (arr: number[], minDistance: number): number[] => {
	if (arr.length === 0) return [];

	const result: number[] = [arr[0]];
	let lastIsFirst: boolean = true;

	for (let i = 1; i < arr.length; i++) {
		const current = arr[i];
		const last = result[result.length - 1];

		if (current - last < minDistance) {
			if (lastIsFirst) {
				continue;
			} else {
				if (current > last) {
					result[result.length - 1] = current;
				}
			}
		} else {
			result.push(current);
			lastIsFirst = false;
		}
	}

	return result;
};

export default useFitContentSnapPoints;
