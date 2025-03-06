import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

export const useCustomNavigate = () => {
	const navigation = useContext(UNSAFE_NavigationContext);

	const navigate = useCallback(
		(to: any) => {
			navigation.navigator.push(to);
		},
		[navigation]
	);

	return navigate;
};
