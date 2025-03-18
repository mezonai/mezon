import { useCallback, useState } from 'react';
import { NoneToVoidFunction } from '../types';

export const useFlag = (initial = false): [boolean, NoneToVoidFunction, NoneToVoidFunction] => {
	const [value, setValue] = useState(initial);

	const setTrue = useCallback(() => {
		setValue(true);
	}, []);

	const setFalse = useCallback(() => {
		setValue(false);
	}, []);

	return [value, setTrue, setFalse];
};
