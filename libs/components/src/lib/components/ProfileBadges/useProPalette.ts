import { selectTheme } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { ProPalette } from './proPalette';
import { getProPalette } from './proPalette';

export const useProPalette = (): ProPalette => {
	const theme = useSelector(selectTheme);
	return useMemo(() => getProPalette(theme), [theme]);
};
