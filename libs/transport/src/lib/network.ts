import type { Observable } from 'rxjs';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

const online$ = new BehaviorSubject<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => online$.next(true));
	window.addEventListener('offline', () => online$.next(false));
}

export function isOnline(): boolean {
	return online$.getValue();
}

export function isOnline$(): Observable<boolean> {
	return online$.asObservable();
}

export function waitForOnline$(): Observable<boolean> {
	return online$.pipe(
		filter((v) => v),
		take(1)
	);
}

export function waitForOnline(): Promise<boolean> {
	return firstValueFrom(waitForOnline$());
}
