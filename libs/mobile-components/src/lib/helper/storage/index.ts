import { safeJSONParse } from 'mezon-js';
import { MMKV } from 'react-native-mmkv';

const appName = 'Mezon';
const AppKey = '7268428d-d814-4eca-8829-176553sad3';

export const AppStorage = new MMKV({
	id: `user-${appName}-storage`,
	encryptionKey: AppKey
});

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export function loadString(key: string) {
	try {
		return AppStorage.getString(key);
	} catch {
		// not sure why this would fail... even reading the RN docs I'm unclear
		return null;
	}
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function saveString(key: string, value: string) {
	try {
		AppStorage.set(key, value);
		return true;
	} catch {
		return false;
	}
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export function load(key: string) {
	try {
		const almostThere = AppStorage.getString(key);
		return typeof almostThere === 'string' ? safeJSONParse(almostThere) : null;
	} catch {
		return null;
	}
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function save(key: string, value: any) {
	try {
		AppStorage.set(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export async function remove(key: string) {
	try {
		AppStorage.delete(key);
	} catch {
		/* empty */
	}
}

/**
 * Removes removeAll from storage.
 */
export async function clearAll() {
	try {
		AppStorage.clearAll();
	} catch {
		/* empty */
	}
}

interface Storage {
	getItem(key: string, ...args: Array<any>): any;
	setItem(key: string, value: any, ...args: Array<any>): any;
	removeItem(key: string, ...args: Array<any>): any;
}
export const reduxPersistStorage: Storage = {
	setItem: (key, value) => {
		AppStorage.set(key, value);
		return Promise.resolve(true);
	},
	getItem: (key) => {
		const value = AppStorage.getString(key);
		return Promise.resolve(value);
	},
	removeItem: (key) => {
		AppStorage.delete(key);
		return Promise.resolve();
	}
};
