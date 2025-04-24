import { Dimensions, Platform } from 'react-native';

export const { width, height } = Dimensions.get('window');

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const CONTAINER_FLUID_SPACING = 16;
const CONTAINER_SPACING = 24;

const widthConvert = width;
const heightConvert = height;
const horizontalScale = (size: number) => (widthConvert / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (heightConvert / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (horizontalScale(size) - size) * factor;

// Used via Metrics.baseMargin
const Metrics = {
	zero: 0,
	baseMargin: 10,
	doubleBaseMargin: 20,
	smallMargin: 5,
	textFieldRadius: 6,
	borderLineWidth: 1,
	screenWidth: width < height ? width : height,
	screenHeight: width < height ? height : width,
	navBarHeight: Platform.OS === 'ios' ? verticalScale(64) : verticalScale(54),
	buttonRadius: 4,
	icons: {
		tiny: 16,
		small: 20,
		medium: 30,
		large: 45,
		xl: 50
	},
	images: {
		small: 20,
		medium: 40,
		large: 60,
		logo: 200
	},
	headerShadow: {
		shadowColor: 'grey',
		shadowOffset: { width: 1, height: 2.5 },
		shadowOpacity: 0.2,
		shadowRadius: 1,
		elevation: 2
	},
	size: {
		xs: 3,
		s: 5,
		m: 10,
		l: 15,
		xl: 20,
		xxl: 25,
		xxxl: 30
	}
};

const propsToStyle = <T = Record<string, number | string>>(arrStyle: Array<T>) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return arrStyle
		.filter(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			(x) => x !== undefined && !Object.values(x).some((v) => v === undefined)
		)
		.reduce(
			(prev: Record<string, number | string>, curr) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const firstKey = Object.keys(curr)[0] as keyof T;
				const firstValue = curr[firstKey];

				if (!['opacity', 'zIndex', 'flex'].includes(firstKey as string) && typeof firstValue === 'number') {
					(curr[firstKey] as unknown as number) = verticalScale(firstValue);
				}
				return { ...prev, ...curr };
			},
			{} as Record<string, number | string>
		);
};

export { CONTAINER_FLUID_SPACING, CONTAINER_SPACING, Metrics, horizontalScale, moderateScale, propsToStyle, verticalScale };
