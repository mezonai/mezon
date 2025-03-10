// import { Side, driver } from 'driver.js';
// import { useCallback, useMemo } from 'react';

// export type DriverProps = {
// 	element?: string | Element;
// 	popover: {
// 		side?: Side;
// 		description?: string;
// 		title?: string;
// 	};
// };

// export enum EElementHightLight {
// 	MAIN_INPUT = '#editorReactMention'
// }

// export const useDriver = () => {
// 	const driverHightLight = driver();

// 	const openHighLight = useCallback(
// 		(ref?: string | Element | EElementHightLight, side?: Side, description?: string) => {
// 			driverHightLight.highlight({
// 				element: ref,
// 				popover: {
// 					side: side ?? 'top',
// 					description: description
// 				}
// 			});
// 		},
// 		[driverHightLight]
// 	);

// 	const closeHighLight = useCallback(() => {
// 		driverHightLight.destroy();
// 	}, [driverHightLight]);

// 	const driverTour = useCallback((steps: DriverProps[]) => {
// 		const tour = driver({
// 			showProgress: true,
// 			steps: [...steps]
// 		});
// 		tour.drive();
// 	}, []);

// 	return useMemo(
// 		() => ({
// 			closeHighLight,
// 			openHighLight,
// 			driverTour
// 		}),
// 		[closeHighLight, openHighLight, driverTour]
// 	);
// };
