type TEncryptedKey = { encryptedData: string; salt: string; iv: string };

type TEncryptedWallet = {
	userId: string;
	address: string;
	encryptedPrivateKey: string;
	encryptedRecoveryPhrase: string;
	privateKey: string;
	createdAt: string;
	timestamp: number;
};

export type TWalletData = {
	address: string;
	privateKey: string;
	recoveryPhrase: string;
};

export class WalletCrypto {
	// Derive key from passcode using PBKDF2
	static async deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passcode), { name: 'PBKDF2' }, false, ['deriveKey']);

		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	// Encrypt private key with passcode
	static async encryptPrivateKey(privateKey: string, passcode: string): Promise<TEncryptedKey> {
		const salt = crypto.getRandomValues(new Uint8Array(16));
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const key = await this.deriveKey(passcode, salt);

		const encoder = new TextEncoder();
		const data = encoder.encode(privateKey);

		const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);

		return {
			encryptedData: Array.from(new Uint8Array(encryptedBuffer), (byte) => byte.toString(16).padStart(2, '0')).join(''),
			salt: Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join(''),
			iv: Array.from(iv, (byte) => byte.toString(16).padStart(2, '0')).join('')
		};
	}

	static async decryptPrivateKey(encryptedData: string, salt: string, iv: string, passcode: string): Promise<string> {
		const saltArray = new Uint8Array(salt.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
		const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
		const encryptedArray = new Uint8Array(encryptedData.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));

		const key = await this.deriveKey(passcode, saltArray);

		const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArray }, key, encryptedArray);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedBuffer);
	}
}

export class WalletStorage {
	private static dbName = 'MezonWallet';
	private static version = 1;
	private static storeName = 'wallets';

	static async openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: 'userId' });
				}
			};
		});
	}

	static async saveEncryptedWallet(userId: string, encryptedWallet: any): Promise<void> {
		const db = await this.openDB();
		const transaction = db.transaction([this.storeName], 'readwrite');
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.put({ userId, ...encryptedWallet, timestamp: Date.now() });
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	static async getEncryptedWallet(userId: string): Promise<TEncryptedWallet | undefined> {
		const db = await this.openDB();
		const transaction = db.transaction([this.storeName], 'readonly');
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.get(userId);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}
}
