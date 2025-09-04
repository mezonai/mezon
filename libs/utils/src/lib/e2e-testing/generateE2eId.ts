import { E2eKeyType } from './constants';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function generateE2eId(path: E2eKeyType | '' = '', identifier = ''): string | undefined {
	if (IS_PRODUCTION) return undefined;
	return [...path.split('.'), identifier].filter(Boolean).join('-');
}
