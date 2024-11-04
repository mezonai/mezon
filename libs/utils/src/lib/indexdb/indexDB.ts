import { openDB } from 'idb';

const DB_NAME = 'logDB';
const STORE_NAME = 'logs';

interface LogEntry {
	message?: string;
	level?: 'info' | 'warning' | 'error';
	[key: string]: unknown;
}

export async function initDB() {
	return openDB(DB_NAME, 4, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
			}
		}
	});
}

export async function addLog(log: LogEntry) {
	try {
		const db = await initDB();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		await tx.store.add(log);
		await tx.done;
	} catch (err) {
		console.error(err);
	}
}

export async function clearLogsIfNewDay() {
	try {
		const db = await initDB();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const key = (await tx.store.getAllKeys())?.[0];
		const log = await tx.store.get(key);
		if (log) {
			const logDate = new Date(log.timestamp).toDateString();
			const currentDate = new Date().toDateString();
			if (logDate !== currentDate) {
				tx.store.clear();
			}
		}

		await tx.done;
	} catch (err) {
		console.error(err);
	}
}

export async function clearLogMessage(targetId: string, targetChannelId: string) {
	try {
		const db = await initDB();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.store;

		const keys = await store.getAllKeys();
		for (const key of keys) {
			const log = await store.get(key);
			if (log && log.data) {
				const { id, channel_id } = log.data;
				if (id === targetId && channel_id === targetChannelId) {
					await store.delete(key);
				}
			}
		}
		await tx.done;
	} catch (err) {
		console.error('Error clearing logs:', err);
	}
}

export enum LogType {
	PushNotification = 'push_notification',
	DisconnectSocket = 'disconnect_socket',
	ReconnectSocket = 'reconnect_socket',
	NewMessage = 'new_message'
}

clearLogsIfNewDay();

// use in devtool: get log by key
// async function getDataByKey(key) {
// 	try {
// 		const dbOpenRequest = await new Promise((resolve, reject) => {
// 			const request = window.indexedDB.open('logDB', 4);
// 			request.onsuccess = () => resolve(request.result);
// 			request.onerror = () => reject(request.error);
// 		});

// 		const transaction = dbOpenRequest.transaction(['logs'], 'readonly');
// 		const objectStore = transaction.objectStore('logs');
// 		const myRecord = await new Promise((resolve, reject) => {
// 			const objectStoreRequest = objectStore.get(key);
// 			objectStoreRequest.onsuccess = () => resolve(objectStoreRequest.result);
// 			objectStoreRequest.onerror = () => reject(objectStoreRequest.error);
// 		});
// 		// console.log(myRecord);
// 	} catch (error) {
// 		console.error('Error accessing the database:', error);
// 	}
// }

// Example usage
// getDataByKey(102);
