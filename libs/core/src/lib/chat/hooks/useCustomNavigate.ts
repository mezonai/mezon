import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

export const useCustomNavigate = () => {
	const { navigator } = useContext(UNSAFE_NavigationContext);

	return useCallback(
		(to: any, replace?: boolean) => {
			if (replace) {
				navigator.replace(to);
			} else {
				navigator.push(to);
			}
		},
		[navigator]
	);
};
