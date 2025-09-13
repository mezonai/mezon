import * as bip39 from 'bip39';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

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

	static rawEd25519ToPkcs8Hex(raw: Buffer): string {
		// Helpers: DER building
		const concat = (...parts: Uint8Array[]): Uint8Array => {
			const total = parts.reduce((s, p) => s + p.length, 0);
			const out = new Uint8Array(total);
			let offset = 0;
			for (const p of parts) {
				out.set(p, offset);
				offset += p.length;
			}
			return out;
		};

		const derLen = (n: number): Uint8Array => {
			if (n < 0x80) return Uint8Array.of(n);
			// support up to 4 bytes length which is plenty here
			const bytes: number[] = [];
			let x = n;
			while (x > 0) {
				bytes.unshift(x & 0xff);
				x >>= 8;
			}
			return Uint8Array.of(0x80 | bytes.length, ...bytes);
		};

		const derIntegerZero = Uint8Array.of(0x02, 0x01, 0x00); // INTEGER 0

		// AlgorithmIdentifier = SEQUENCE { OID 1.3.101.112 (ed25519), parameters ABSENT }
		const oidEd25519 = Uint8Array.of(0x06, 0x03, 0x2b, 0x65, 0x70);
		const algId = concat(Uint8Array.of(0x30), derLen(oidEd25519.length), oidEd25519);

		// privateKey = OCTET STRING of inner OCTET STRING (RFC8410 commonly seen form)
		const innerOctet = concat(Uint8Array.of(0x04, 0x20), new Uint8Array(raw)); // 0x04, len=0x20, 32 bytes
		const privateKeyField = concat(Uint8Array.of(0x04), derLen(innerOctet.length), innerOctet);

		// PrivateKeyInfo = SEQUENCE { version, algId, privateKey }
		const body = concat(derIntegerZero, algId, privateKeyField);
		const pkcs8 = concat(Uint8Array.of(0x30), derLen(body.length), body);

		return Buffer.from(pkcs8).toString('hex');
	}

	static generateWallet(): TWalletData {
		const mnemonic = bip39.generateMnemonic(128);

		if (!bip39.validateMnemonic(mnemonic)) {
			throw new Error('Generated mnemonic failed validation');
		}

		const recoveryPhrase = mnemonic;
		const seed = bip39.mnemonicToSeedSync(mnemonic);
		const privateKey = seed.slice(0, 32);

		const kp = nacl.sign.keyPair.fromSeed(privateKey);
		const publicKeyBytes = kp.publicKey;

		const publicKeyBase58 = bs58.encode(publicKeyBytes);
		const privateKeyHex = WalletCrypto.rawEd25519ToPkcs8Hex(privateKey);

		return {
			address: publicKeyBase58,
			privateKey: privateKeyHex,
			recoveryPhrase
		};
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
