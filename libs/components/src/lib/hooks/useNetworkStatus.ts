import { isOnline, isOnline$ } from '@mezon/transport';
import { useEffect, useState } from 'react';

export const useNetworkStatus = () => {
	const [online, setOnline] = useState(isOnline());

	useEffect(() => {
		const sub = isOnline$().subscribe(setOnline);
		return () => sub.unsubscribe();
	}, []);

	return { isOnline: online, isOffline: !online };
};
