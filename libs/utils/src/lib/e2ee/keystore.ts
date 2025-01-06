// Adapted from https://github.com/infotechinc/key-storage-in-browser
// Original readme & copyright:
// Key Storage with Web Cryptography API
//
// Copyright 2014 Info Tech, Inc.
// Provided under the MIT license.
// See LICENSE file for details.

// Saves cryptographic key pairs in IndexedDB.

// The only global name in this library is openKeyStore.
// openKeyStore takes no parameters, and returns a Promise.
// If the key storage database can be opened, the promise
// is fulfilled with the value of a key store object. If
// it cannot be opened, it is rejected with an Error.
//
// The key store object has methods getKey, saveKey, listKeys
// to manage stored keys, and close, to close the key storage
// database, freeing it for other code to use.
//
// The key storage database name is hard coded as KeyStore. It
// uses one object store, called keys.
//

const dbName = 'mm-e2ee';

export class KeyStoreError extends Error {}

export class KeyStore {
	db: IDBDatabase;
	objectStoreName: string;

	constructor(db: IDBDatabase, objectStoreName: string) {
		this.db = db;
		this.objectStoreName = objectStoreName;
	}

	static async open(): Promise<KeyStore> {
		if (navigator.storage && navigator.storage.persist) {
			await navigator.storage.persist();
		}
		return new Promise((fulfill, reject) => {
			if (!window.indexedDB) {
				reject(new Error('IndexedDB is not supported by this browser.'));
			}

			const objectStoreName = 'keys';

			const req = indexedDB.open(dbName, 2);
			req.onsuccess = (evt) => {
				const db = req.result;
				fulfill(new KeyStore(db, objectStoreName));
			};
			req.onerror = (evt) => {
				reject(req.error);
			};
			req.onblocked = () => {
				reject(new Error('Database already open'));
			};

			// If the database is being created or upgraded to a new version,
			// see if the object store and its indexes need to be created.
			req.onupgradeneeded = (evt) => {
				const db = req.result;
				if (!db.objectStoreNames.contains(objectStoreName)) {
					db.createObjectStore(objectStoreName, { keyPath: 'name' });
				}
			};
		});
	}

	public async saveKey(name: string, key: CryptoKeyPair, erase = false) {
		return new Promise((fulfill, reject) => {
			if (!this.db) {
				reject(new Error('KeyStore is not open.'));
			}

			const transaction = this.db.transaction([this.objectStoreName], 'readwrite');
			transaction.onerror = (evt) => {
				reject(transaction.error);
			};
			transaction.onabort = (evt) => {
				reject(transaction.error);
			};
			transaction.oncomplete = (evt) => {
				fulfill(null);
			};

			const obj = { key, name };
			const objectStore = transaction.objectStore(this.objectStoreName);
			if (erase) {
				objectStore.put(obj);
			} else {
				objectStore.add(obj);
			}
		});
	}

	public async loadKey(name: string): Promise<CryptoKeyPair> {
		return new Promise((fulfill, reject) => {
			if (!this.db) {
				reject(new Error('KeyStore is not open.'));
			}

			const transaction = this.db.transaction([this.objectStoreName], 'readonly');
			const objectStore = transaction.objectStore(this.objectStoreName);

			const request = objectStore.get(name);

			request.onsuccess = (evt) => {
				if (typeof request.result === 'undefined') {
					reject(new KeyStoreError('unknown key'));
				} else {
					fulfill(request.result.key);
				}
			};

			request.onerror = (evt) => {
				reject(request.error);
			};
		});
	}

	// close method
	public async close() {
		return new Promise((fulfill, reject) => {
			if (!this.db) {
				reject(new Error('KeyStore is not open.'));
			}

			this.db.close();
			fulfill(null);
		});
	}

	async deleteKey(name: string): Promise<void> {
		return new Promise((fulfill, reject) => {
			const transaction = this.db.transaction([this.objectStoreName], 'readwrite');
			const objectStore = transaction.objectStore(this.objectStoreName);
			const request = objectStore.delete(name);

			request.onsuccess = () => fulfill();
			request.onerror = () => reject(request.error);
		});
	}
}
