import { E2eKeyType } from './constants';

export function generateE2eId(path: E2eKeyType, identifier = ''): string {
	return [...path.split('.'), identifier].filter(Boolean).join('-');
}
