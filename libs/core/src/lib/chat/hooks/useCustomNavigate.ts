import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

export const useCustomNavigate = () => {
	const { navigator } = useContext(UNSAFE_NavigationContext);

	return useCallback(
		(to: any) => {
			navigator.push(to);
		},
		[navigator]
	);
};
