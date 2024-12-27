import { ApiPubKey } from 'mezon-js/api.gen';
import { IMessageWithUser } from '../types';
import { KeyStore, KeyStoreError } from './keystore';
import { arrayBufferEqual, concatArrayBuffers, eqSet } from './utils';

const subtle = window?.crypto?.subtle || '';

const CurveName = 'P-256';
const SignAlgo = { name: 'ECDSA', hash: 'SHA-256' };

const PubKeyIDLen = 32;

const AESWrapKeyFormat = 'raw';
const PrivateKeyExportFormat = 'jwk';

export class E2EEError extends Error {}
export class E2EEValidationError extends E2EEError {
	constructor() {
		super('integrity check failed');
	}
}
export class E2EEUnknownRecipient extends E2EEError {
	constructor() {
		super('unknown recipient');
	}
}
export class E2EEInvalidPrivKey extends E2EEError {
	constructor() {
		super('invalid private key metadata');
	}
}
export class E2EEInvalidJSONMessage extends E2EEError {
	constructor() {
		super('invalid message data');
	}
}

type B64Str = string;
type B64OrBuf = B64Str | ArrayBuffer;

interface PublicKeyMaterialJSONImpl<Bin extends B64OrBuf> {
	sign: Bin;
	encr: Bin;
}
export type PublicKeyMaterialJSON = PublicKeyMaterialJSONImpl<B64Str> | PublicKeyMaterialJSONImpl<ArrayBuffer>;

function base64Encode(buf: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64Decode(str: string): ArrayBuffer {
	return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

function arrayBufferString(buf: ArrayBuffer): string {
	const decoder = new TextDecoder();
	return decoder.decode(buf);
}

function fencb64(tob64: boolean) {
	return tob64 ? base64Encode : arrayBufferString;
}

function stringArrayBuffer(str: string): ArrayBuffer {
	const enc = new TextEncoder();
	return enc.encode(str);
}

function fdecb64(fromb64: boolean) {
	return fromb64 ? base64Decode : stringArrayBuffer;
}

export class PublicKeyMaterial {
	readonly ecdh: CryptoKey;
	readonly ecdsa: CryptoKey;
	cachedID: ArrayBuffer | null;

	constructor(ecdh: CryptoKey, ecdsa: CryptoKey) {
		this.ecdh = ecdh;
		this.ecdsa = ecdsa;
		this.cachedID = null;
	}

	async jsonable(tob64 = true): Promise<PublicKeyMaterialJSON> {
		const encData = fencb64(tob64);
		const ecdhData = await subtle.exportKey('raw', this.ecdh);
		const ecdsaData = await subtle.exportKey('raw', this.ecdsa);
		return {
			sign: encData(ecdsaData),
			encr: encData(ecdhData)
		};
	}

	static async fromJsonable(obj: PublicKeyMaterialJSON, fromb64 = true): Promise<PublicKeyMaterial> {
		const decData = fdecb64(fromb64);
		const ecdh = await subtle.importKey('raw', decData(obj.encr as string), { name: 'ECDH', namedCurve: CurveName }, true, []);
		const ecdsa = await subtle.importKey('raw', decData(obj.sign as string), { name: 'ECDSA', namedCurve: CurveName }, true, ['verify']);
		return new PublicKeyMaterial(ecdh, ecdsa);
	}

	async id() {
		if (this.cachedID !== null) {
			return this.cachedID;
		}
		const data_ecdh = subtle.exportKey('raw', this.ecdh);
		const data_ecdsa = subtle.exportKey('raw', this.ecdsa);
		const data = concatArrayBuffers(...(await Promise.all([data_ecdh, data_ecdsa])));
		const ret = await subtle.digest('SHA-256', data);
		this.cachedID = ret;
		return ret;
	}
}

export interface PrivateKeyMaterialJSON {
	version: number;
	sign: JsonWebKey;
	encr: JsonWebKey;
}

export class PrivateKeyMaterial {
	readonly ecdh: CryptoKeyPair;
	readonly ecdsa: CryptoKeyPair;
	readonly pubkeyObj: PublicKeyMaterial;

	static readonly JSON_FORMAT_VERSION = 1;

	constructor(ecdh: CryptoKeyPair, ecdsa: CryptoKeyPair) {
		this.ecdh = ecdh;
		this.ecdsa = ecdsa;

		// We create this object once so that the ID of our private key will
		// be cached.
		this.pubkeyObj = new PublicKeyMaterial(this.ecdh.publicKey, this.ecdsa.publicKey);
	}

	async pubKeyID() {
		return (await this.pubKey()).id();
	}

	static async create(exportable = true): Promise<PrivateKeyMaterial> {
		const ecdh_key = subtle.generateKey(
			{
				name: 'ECDH',
				namedCurve: CurveName
			},
			exportable,
			['deriveBits']
		);
		const ecdsa_key = subtle.generateKey(
			{
				name: 'ECDSA',
				namedCurve: CurveName
			},
			exportable,
			['sign', 'verify']
		);
		const keys = await Promise.all([ecdh_key, ecdsa_key]);

		return new PrivateKeyMaterial(keys[0], keys[1]);
	}

	public async jsonable(tob64: boolean): Promise<PrivateKeyMaterialJSON> {
		const ecdsaExport = await subtle.exportKey(PrivateKeyExportFormat, this.ecdsa.privateKey);
		const ecdhExport = await subtle.exportKey(PrivateKeyExportFormat, this.ecdh.privateKey);
		return {
			sign: ecdsaExport,
			encr: ecdhExport,
			version: PrivateKeyMaterial.JSON_FORMAT_VERSION
		};
	}

	private static checkJWK(jwk: JsonWebKey, usages: Set<string>) {
		if (jwk.kty !== 'EC' || jwk.crv !== CurveName || !eqSet(new Set(jwk.key_ops), usages)) {
			throw new E2EEInvalidPrivKey();
		}
	}
	static async fromJsonable(data: PrivateKeyMaterialJSON, fromb64: boolean, exportable: boolean): Promise<PrivateKeyMaterial> {
		this.checkJWK(data.sign, new Set(['sign']));
		this.checkJWK(data.encr, new Set(['deriveBits']));
		const ecdsaPrivateKey = await subtle.importKey(PrivateKeyExportFormat, data.sign, { name: 'ECDSA', namedCurve: CurveName }, true, ['sign']);
		const ecdhPrivateKey = await subtle.importKey(PrivateKeyExportFormat, data.encr, { name: 'ECDH', namedCurve: CurveName }, true, [
			'deriveBits'
		]);

		const pubSign = Object.assign({}, data.sign);
		delete pubSign.d;
		pubSign.key_ops = ['verify'];
		const ecdsaPublicKey = await subtle.importKey(PrivateKeyExportFormat, pubSign, { name: 'ECDSA', namedCurve: CurveName }, true, ['verify']);

		const pubEncr = Object.assign({}, data.encr);
		delete pubEncr.d;
		pubEncr.key_ops = [];
		const ecdhPublicKey = await subtle.importKey(PrivateKeyExportFormat, pubEncr, { name: 'ECDH', namedCurve: CurveName }, true, []);

		return new PrivateKeyMaterial(
			{
				privateKey: ecdhPrivateKey,
				publicKey: ecdhPublicKey
			},
			{
				privateKey: ecdsaPrivateKey,
				publicKey: ecdsaPublicKey
			}
		);
	}

	public async save(ks: KeyStore, userID: string, erase = false) {
		return Promise.all([ks.saveKey('ecdh_' + userID, this.ecdh, erase), ks.saveKey('ecdsa_' + userID, this.ecdsa, erase)]);
	}

	static async load(ks: KeyStore, userID: string): Promise<PrivateKeyMaterial> {
		const ecdh_key = ks.loadKey('ecdh_' + userID);
		const ecdsa_key = ks.loadKey('ecdsa_' + userID);
		const values = await Promise.all([ecdh_key, ecdsa_key]);
		return new PrivateKeyMaterial(values[0], values[1]);
	}

	privSignKey(): CryptoKey {
		return this.ecdsa.privateKey;
	}

	pubSignKey(): CryptoKey {
		return this.ecdsa.publicKey;
	}

	pubECDHKey(): CryptoKey {
		return this.ecdh.publicKey;
	}

	pubKey(): PublicKeyMaterial {
		return this.pubkeyObj;
	}

	async exportToFile(name: string): Promise<void> {
		const jsonableData = await this.jsonable(true);
		const jsonString = JSON.stringify(jsonableData);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	static async importFromFile(file: File): Promise<PrivateKeyMaterial> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = async (event) => {
				try {
					const jsonString = event.target?.result as string;
					const jsonData = JSON.parse(jsonString);
					const privateKeyMaterial = await PrivateKeyMaterial.fromJsonable(jsonData, true, true);
					resolve(privateKeyMaterial);
				} catch (error) {
					reject(error);
				}
			};
			reader.onerror = (error) => reject(error);
			reader.readAsText(file);
		});
	}

	static async importFromFileAndSave(file: File, userID: string): Promise<void> {
		const privateKeyMaterial = await this.importFromFile(file);
		const keyStore = await KeyStore.open();

		try {
			await keyStore.saveKey('ecdh_' + userID, privateKeyMaterial.ecdh, true);
			await keyStore.saveKey('ecdsa_' + userID, privateKeyMaterial.ecdsa, true);
		} finally {
			await keyStore.close();
		}
	}

	async encryptWithPIN(pin: string): Promise<string> {
		const salt = window.crypto.getRandomValues(new Uint8Array(16));
		const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

		const key = await subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt']
		);

		const iv = window.crypto.getRandomValues(new Uint8Array(12));
		const privateKeyData = await this.jsonable(true);
		const encryptedData = await subtle.encrypt(
			{
				name: 'AES-GCM',
				iv: iv
			},
			key,
			new TextEncoder().encode(JSON.stringify(privateKeyData))
		);

		const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
		encryptedArray.set(salt, 0);
		encryptedArray.set(iv, salt.length);
		encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

		return base64Encode(encryptedArray);
	}

	static async decryptWithPIN(encryptedData: string, pin: string): Promise<PrivateKeyMaterial> {
		const encryptedArray = new Uint8Array(base64Decode(encryptedData));

		const salt = encryptedArray.slice(0, 16);
		const iv = encryptedArray.slice(16, 28);
		const data = encryptedArray.slice(28);

		const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

		const key = await subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['decrypt']
		);

		const decryptedData = await subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: iv
			},
			key,
			data
		);

		const privateKeyData = JSON.parse(new TextDecoder().decode(decryptedData));
		return PrivateKeyMaterial.fromJsonable(privateKeyData, true, true);
	}
}

export async function getECPubkeyID(pubkey: CryptoKey): Promise<ArrayBuffer> {
	const data = await subtle.exportKey('raw', pubkey);
	return subtle.digest('SHA-256', data);
}

export async function pubkeyEqual(A: PublicKeyMaterial, B: PublicKeyMaterial): Promise<boolean> {
	const idA = await A.id();
	const idB = await B.id();
	return arrayBufferEqual(idA, idB);
}

type EncryptedKeyWithIDTy = [ArrayBuffer, ArrayBuffer];
type EncryptedKeyTy = EncryptedKeyWithIDTy[];

interface EncryptedP2PMessageJSONImpl<Bin extends B64OrBuf> {
	version: number;
	signature: Bin;
	iv: Bin;
	pubECDHE: Bin;
	encryptedKey: [Bin, Bin][];
	encryptedData: Bin;
}
export type EncryptedP2PMessageJSON = EncryptedP2PMessageJSONImpl<B64Str> | EncryptedP2PMessageJSONImpl<ArrayBuffer>;

export function isEncryptedP2PMessageJSON(obj: any, hasb64 = true): obj is EncryptedP2PMessageJSON {
	if (typeof obj !== 'object') {
		return false;
	}
	const strOrArray = hasb64 ? (v: any) => typeof v === 'string' : (v: any) => v instanceof ArrayBuffer;
	try {
		if (!Array.isArray(obj.encryptedKey)) {
			return false;
		}
		for (const [kid, key] of obj.encryptedKey) {
			if (!strOrArray(kid) || !strOrArray(key)) {
				return false;
			}
		}
		return (
			typeof obj.version === 'number' &&
			strOrArray(obj.signature) &&
			strOrArray(obj.iv) &&
			strOrArray(obj.pubECDHE) &&
			strOrArray(obj.encryptedData)
		);
	} catch (e) {
		return false;
	}
}

export class EncryptedP2PMessage {
	signature!: ArrayBuffer;
	iv!: Uint8Array;
	pubECDHE!: CryptoKey;

	// Map public key ID to encrypted AES key
	encryptedKey!: EncryptedKeyTy;
	encryptedData!: ArrayBuffer;

	static readonly JSON_FORMAT_VERSION = 1;

	private static async deriveSharedKey(pubkey: CryptoKey, privkey: CryptoKey, usage: 'wrapKey' | 'unwrapKey'): Promise<CryptoKey> {
		// 32*8 because it seems to gives us the raw output of the ECDH algorithm
		// on P-256, with only one coordinate (see
		// https://www.w3.org/TR/WebCryptoAPI/#ecdh-operations)
		const sharedECDH = await subtle.deriveBits({ name: 'ECDH', public: pubkey }, privkey, 32 * 8);
		const sharedHash = await subtle.digest('SHA-256', sharedECDH);
		return subtle.importKey('raw', new DataView(sharedHash, 0, 16), { name: 'AES-KW' }, false, [usage]);
	}

	static async encrypt(data: ArrayBuffer, sign: PrivateKeyMaterial, pubkeys: Array<PublicKeyMaterial>): Promise<EncryptedP2PMessage> {
		//assert(signkey.type == "private")
		const ret = new EncryptedP2PMessage();
		ret.iv = new Uint8Array(16);
		window.crypto.getRandomValues(ret.iv);
		const msgKey = await subtle.generateKey({ name: 'AES-CTR', length: 128 }, true, ['encrypt']);
		const ecdheKey = await subtle.generateKey(
			{
				name: 'ECDH',
				namedCurve: CurveName
			},
			false,
			['deriveBits']
		);
		ret.pubECDHE = ecdheKey.publicKey;

		// For each public key, generate a shared secret, and use the result to
		// encrypt msgAesKey.
		// We create one promise per key to exploit parallelism if possible.
		const keysProm: Promise<EncryptedKeyWithIDTy>[] = [];
		for (const pubkey of pubkeys) {
			const gen = async (): Promise<EncryptedKeyWithIDTy> => {
				const pubkeyID = pubkey.id();
				const sharedKey = await EncryptedP2PMessage.deriveSharedKey(pubkey.ecdh, ecdheKey.privateKey, 'wrapKey');
				const encrMsgKey = await subtle.wrapKey(AESWrapKeyFormat, msgKey, sharedKey, 'AES-KW');
				return [await pubkeyID, encrMsgKey];
			};
			keysProm.push(gen());
		}

		// Encrypt data
		ret.encryptedData = await subtle.encrypt({ name: 'AES-CTR', counter: ret.iv, length: 64 }, msgKey, data);

		// Sign data
		ret.encryptedKey = await Promise.all(keysProm);
		ret.signature = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, sign.ecdsa.privateKey, await ret.signData());
		return ret;
	}

	private async signData() {
		const pubid = getECPubkeyID(this.pubECDHE);
		const nkeys = this.encryptedKey.length;
		const encrKeysLen = 4 + nkeys * PubKeyIDLen;
		const encrKeys = new Uint8Array(encrKeysLen);
		new DataView(encrKeys.buffer).setUint32(0, nkeys, true /* littleEndian */);
		for (let i = 0; i < nkeys; ++i) {
			const [id, _] = this.encryptedKey[i];
			encrKeys.set(new Uint8Array(id), 4 + i * PubKeyIDLen);
		}
		const encrMsgLen = new DataView(this.encryptedData).byteLength;
		const encrMsgLenBuf = new ArrayBuffer(4);
		new DataView(encrMsgLenBuf).setUint32(0, encrMsgLen, true /* littleEndian */);
		return concatArrayBuffers(this.iv, await pubid, encrKeys, encrMsgLenBuf, this.encryptedData);
	}

	// Throws E2EEValidationError if verification fails
	public async verifyAndDecrypt(senderkey: PublicKeyMaterial, privkey: PrivateKeyMaterial): Promise<ArrayBuffer> {
		// if ((await this.verify(senderkey)) === false) {
		// 	throw new E2EEValidationError();
		// }
		return this.decrypt(privkey);
	}

	public async verify(senderkey: PublicKeyMaterial): Promise<boolean> {
		return subtle.verify(SignAlgo, senderkey.ecdsa, this.signature, await this.signData());
	}

	public async decrypt(privkey: PrivateKeyMaterial): Promise<ArrayBuffer> {
		const ecdhKey = privkey.ecdh;
		const pubkeyID = await privkey.pubKeyID();
		const encrMsgKeyData = this.encryptedKey.find(([pkid, _]) => arrayBufferEqual(pkid, pubkeyID));
		if (typeof encrMsgKeyData === 'undefined') {
			throw new E2EEUnknownRecipient();
		}
		const encrMsgKey = encrMsgKeyData[1];

		// Compute shared key
		const sharedKey = await EncryptedP2PMessage.deriveSharedKey(this.pubECDHE, ecdhKey.privateKey, 'unwrapKey');

		// Decrypt key & data
		const aesCTRInfos = { name: 'AES-CTR', counter: this.iv, length: 64 };
		let msgKey: CryptoKey;
		try {
			msgKey = await subtle.unwrapKey(AESWrapKeyFormat, encrMsgKey, sharedKey, 'AES-KW', aesCTRInfos, false, ['decrypt']);
		} catch (e) {
			if (e instanceof DOMException && e.name === 'OperationError') {
				// thrown if an integrity issue is found.
				throw new E2EEValidationError();
			}
			throw e;
		}
		return subtle.decrypt(aesCTRInfos, msgKey, this.encryptedData);
	}

	public async jsonable(tob64 = true): Promise<EncryptedP2PMessageJSON> {
		const encData = fencb64(tob64);
		const pubECDHEData = await subtle.exportKey('raw', this.pubECDHE);
		const encryptedKeyData: [B64Str, B64Str][] & [ArrayBuffer, ArrayBuffer][] = [];
		for (const [pubkeyID, encrKey] of this.encryptedKey) {
			encryptedKeyData.push([encData(pubkeyID), encData(encrKey)]);
		}
		return {
			signature: encData(this.signature),
			iv: encData(this.iv),
			pubECDHE: encData(pubECDHEData),
			encryptedKey: encryptedKeyData,
			encryptedData: encData(this.encryptedData),
			version: EncryptedP2PMessage.JSON_FORMAT_VERSION
		};
	}

	static async fromJsonable(data: any, fromb64 = true): Promise<EncryptedP2PMessage> {
		if (!isEncryptedP2PMessageJSON(data, fromb64)) {
			throw new E2EEInvalidJSONMessage();
		}
		const decData = fdecb64(fromb64);
		const ret = new EncryptedP2PMessage();
		ret.signature = decData(data.signature as string);
		ret.iv = new Uint8Array(decData(data.iv as string));
		ret.encryptedData = decData(data.encryptedData as string);
		ret.encryptedKey = [];
		for (const [pubkeyID, encrKey] of data.encryptedKey) {
			ret.encryptedKey.push([decData(pubkeyID as string), decData(encrKey as string)]);
		}
		const pubECDHEData = decData(data.pubECDHE as string);
		ret.pubECDHE = await subtle.importKey('raw', pubECDHEData, { name: 'ECDH', namedCurve: CurveName }, true, []);
		return ret;
	}
}

export async function getPublicKeys(keys: ApiPubKey[]): Promise<PublicKeyMaterial[]> {
	const publicKeyMaterials: PublicKeyMaterial[] = [];
	for (const key of keys) {
		const publicKeyMaterial = await PublicKeyMaterial.fromJsonable(key as any, true);
		publicKeyMaterials.push(publicKeyMaterial);
	}
	return publicKeyMaterials;
}

export class MessageCrypt {
	static async checkExistingKeys(userID: string): Promise<boolean> {
		const keyStore = await KeyStore.open();
		try {
			await keyStore.loadKey('ecdh_' + userID);
			await keyStore.loadKey('ecdsa_' + userID);
			return true;
		} catch (error) {
			if (error instanceof KeyStoreError) {
				return false;
			}
			throw error;
		} finally {
			await keyStore.close();
		}
	}

	static async initializeKeys(userID: string) {
		const keyStore = await KeyStore.open();
		let pubKeyMaterial;

		try {
			await keyStore.loadKey('ecdh_' + userID);
		} catch (error) {
			if (error instanceof KeyStoreError) {
				const privateKeyMaterial = await PrivateKeyMaterial.create(true);
				// await privateKeyMaterial.exportToFile(`mezon_private_key_${userID}.key`);
				await keyStore.saveKey('ecdh_' + userID, privateKeyMaterial.ecdh, true);
				await keyStore.saveKey('ecdsa_' + userID, privateKeyMaterial.ecdsa, true);
				pubKeyMaterial = privateKeyMaterial.pubKey().jsonable(true);
			} else {
				throw error;
			}
		} finally {
			await keyStore.close();
		}

		return pubKeyMaterial;
	}

	static async encryptPrivateKeyWithPIN(userID: string, pin: string): Promise<string> {
		const keyStore = await KeyStore.open();
		try {
			const ecdhKey = await keyStore.loadKey('ecdh_' + userID);
			const ecdsaKey = await keyStore.loadKey('ecdsa_' + userID);
			const privateKeyMaterial = new PrivateKeyMaterial(ecdhKey, ecdsaKey);
			return privateKeyMaterial.encryptWithPIN(pin);
		} finally {
			await keyStore.close();
		}
	}

	static async decryptPrivateKeyWithPIN(encryptedKey: string, pin: string, userID: string): Promise<void> {
		const privateKeyMaterial = await PrivateKeyMaterial.decryptWithPIN(encryptedKey, pin);
		const keyStore = await KeyStore.open();
		try {
			await keyStore.saveKey('ecdh_' + userID, privateKeyMaterial.ecdh, true);
			await keyStore.saveKey('ecdsa_' + userID, privateKeyMaterial.ecdsa, true);
		} finally {
			await keyStore.close();
		}
	}

	static async encryptMessage(message: string, recipients: PublicKeyMaterial[], userID: string) {
		const keyStore = await KeyStore.open();

		try {
			const ecdhKey = await keyStore.loadKey('ecdh_' + userID);
			const ecdsaKey = await keyStore.loadKey('ecdsa_' + userID);
			const privateKeyMaterial = new PrivateKeyMaterial(ecdhKey, ecdsaKey);

			const messageBuffer = new TextEncoder().encode(message);
			recipients = [...recipients, privateKeyMaterial.pubKey()];
			const encryptedMessage = await EncryptedP2PMessage.encrypt(messageBuffer, privateKeyMaterial, recipients);
			const encryptedJson = await encryptedMessage.jsonable();
			return btoa(JSON.stringify(encryptedJson));
		} finally {
			await keyStore.close();
		}
	}

	static async decryptMessage(encryptedString: string, userID: string): Promise<string> {
		const keyStore = await KeyStore.open();
		try {
			const ecdhKey = await keyStore.loadKey('ecdh_' + userID);
			const ecdsaKey = await keyStore.loadKey('ecdsa_' + userID);
			const privateKeyMaterial = new PrivateKeyMaterial(ecdhKey, ecdsaKey);
			const publicKeyMaterial = privateKeyMaterial.pubKey();
			const encryptedJson = JSON.parse(atob(encryptedString));
			const encryptedMessage = await EncryptedP2PMessage.fromJsonable(encryptedJson);
			const decryptedBuffer = await encryptedMessage.verifyAndDecrypt(publicKeyMaterial, privateKeyMaterial);
			return new TextDecoder().decode(decryptedBuffer);
		} finally {
			await keyStore.close();
		}
	}

	static async mapE2EEcontent(t: string | null, userId: string, lock = false): Promise<string> {
		let content = '';
		if (t) {
			try {
				content = await MessageCrypt.decryptMessage(t, userId);
			} catch {
				content = lock ? '🔒' : t;
			}
		}
		return content;
	}

	static async decryptMessageWithKeyStore(encryptedString: string, userID: string, keyStore: KeyStore): Promise<string> {
		let content = '';
		try {
			const ecdhKey = await keyStore.loadKey('ecdh_' + userID);
			const ecdsaKey = await keyStore.loadKey('ecdsa_' + userID);
			const privateKeyMaterial = new PrivateKeyMaterial(ecdhKey, ecdsaKey);
			const publicKeyMaterial = privateKeyMaterial.pubKey();
			const encryptedJson = JSON.parse(atob(encryptedString));
			const encryptedMessage = await EncryptedP2PMessage.fromJsonable(encryptedJson);
			const decryptedBuffer = await encryptedMessage.verifyAndDecrypt(publicKeyMaterial, privateKeyMaterial);
			content = new TextDecoder().decode(decryptedBuffer);
		} catch {
			content = '🔒';
		}
		return content;
	}

	static async processBatch(messages: IMessageWithUser[], userId: string, keyStore: KeyStore): Promise<IMessageWithUser[]> {
		return Promise.all(
			messages.map(async (item) => {
				if (item.content?.e2ee && item.content?.t) {
					const decryptedContent = await MessageCrypt.decryptMessageWithKeyStore(item.content.t, userId, keyStore);
					return {
						...item,
						content: {
							...(item.content as object),
							t: decryptedContent
						}
					} as IMessageWithUser;
				}
				return item;
			})
		);
	}

	static async decryptMessages(messages: IMessageWithUser[], userId: string): Promise<IMessageWithUser[]> {
		const keyStore = await KeyStore.open();
		try {
			const batchSize = 10;
			const results: IMessageWithUser[] = [];
			for (let i = 0; i < messages.length; i += batchSize) {
				const batch = messages.slice(i, i + batchSize);
				const processedBatch = await MessageCrypt.processBatch(batch, userId, keyStore);
				results.push(...processedBatch);
			}
			return results;
		} finally {
			await keyStore.close();
		}
	}
}
