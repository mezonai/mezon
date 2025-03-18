import { useRef } from 'react';
import generateUniqueId from '../utils/generateUniqueId';

export default function useUniqueId() {
	const idRef = useRef<string>();

	if (!idRef.current) {
		idRef.current = generateUniqueId();
	}

	return idRef.current;
}
