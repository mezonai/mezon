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
}

export function useFitContentSnapPoints(
    params: UseFitContentSnapPointsParams
): UseFitContentSnapPointsReturn {
    const windowHeight = useRef(Dimensions.get('window').height);
    const { snapPoints, maxHeightPercent, snapPointsWithFitContent } = params;
    const [contentHeight, setContentHeight] = useState<number>(0);

    const maxHeightValue = useMemo<number | null>(() => {
        if (!maxHeightPercent) return 0;
        return Number(maxHeightPercent.trim().replace('%', '')) || 0;
    }, [maxHeightPercent]);

    const percentSnapPoints = useMemo(() => {
        if (!snapPointsWithFitContent)  return snapPoints.map((p) => p.includes('%') ? p : `${p}%`);
        let finalSnapPoints = [];
        const snapPointsNumber = convertPercentToNumber(snapPoints);

        const allSnapPoints = [contentHeight, maxHeightValue]
            .filter(value => value !== 0)
            .concat(snapPointsNumber)
            .sort((a, b) => a - b);

        if (contentHeight >= maxHeightValue) {
            const maxHeightPosition = allSnapPoints.indexOf(maxHeightValue);
            if (maxHeightPosition === -1) return allSnapPoints.map((p) => `${p}%`);
            return finalSnapPoints = allSnapPoints.slice(0, maxHeightPosition + 1).map((p) => `${p}%`);
        }

        const contentHeightPosition = allSnapPoints.indexOf(contentHeight);
        if (contentHeightPosition === -1) return allSnapPoints.map((p) => `${p}%`);
        return allSnapPoints.slice(0, contentHeightPosition + 1).map((p) => `${p}%`);

    }, [contentHeight, maxHeightValue, snapPoints]);

    const onContentLayout = useCallback((e: LayoutChangeEvent) => {
        const measuredPx = e?.nativeEvent?.layout?.height;
        let padding = 32;
        if (typeof measuredPx === 'number' && measuredPx >= 0) {
            const percentOfWindow = windowHeight.current > 0 ? Math.floor(((measuredPx + padding) / windowHeight.current) * 100) : 0;
            setContentHeight(percentOfWindow || 0);
        }
    }, []);

    return {
        percentSnapPoints,
        contentHeight,
        onContentLayout,
    };
}

const convertPercentToNumber = (snapPoints: string[]) => {
    return snapPoints.map((p) => Number(p.trim().replace('%', ''))) || [];
}

export default useFitContentSnapPoints;


