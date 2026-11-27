import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupportedLanguage } from '@mezon/translations';
import type i18next from 'i18next';

let i18n: typeof i18next;
let supportedLanguages: readonly SupportedLanguage[];

beforeAll(async () => {
	const store = new Map<string, string>();
	if (typeof globalThis.localStorage === 'undefined') {
		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => {
					store.set(key, value);
				},
				removeItem: (key: string) => {
					store.delete(key);
				}
			},
			configurable: true
		});
	}
	const mod = await import('@mezon/translations');
	i18n = mod.default;
	supportedLanguages = mod.SUPPORTED_LANGUAGES;
	if (!i18n.isInitialized) {
		await new Promise<void>((resolve) => {
			i18n.on('initialized', () => resolve());
		});
	}
	await i18n.changeLanguage('en');
});

afterAll(async () => {
	await i18n.changeLanguage('en');
});

describe('i18next v4 pluralization and compatibility', () => {
	it('uses compatibilityJSON v4 with no leftover _plural keys across all 16 languages', () => {
		expect(i18n.options.compatibilityJSON).toBe('v4');
		expect(supportedLanguages).toHaveLength(16);

		const leftoverPluralKeys: string[] = [];
		const scan = (obj: unknown, path: string) => {
			if (!obj || typeof obj !== 'object') return;
			for (const [key, value] of Object.entries(obj)) {
				const nextPath = `${path}.${key}`;
				if (key.endsWith('_plural')) {
					leftoverPluralKeys.push(nextPath);
				}
				scan(value, nextPath);
			}
		};

		for (const lng of supportedLanguages) {
			scan(i18n.getResourceBundle(lng, 'common'), `${lng}.common`);
			scan(i18n.getResourceBundle(lng, 'invitation'), `${lng}.invitation`);
			scan(i18n.getResourceBundle(lng, 'linkMessageInvite'), `${lng}.linkMessageInvite`);
		}

		expect(leftoverPluralKeys).toEqual([]);
	});

	it('resolves singular (count=1) and plural (count=5) for migrated keys across languages', () => {
		expect(i18n.t('common:invite.member', { lng: 'en', count: 1 })).toBe('Member');
		expect(i18n.t('common:invite.member', { lng: 'en', count: 5 })).toBe('Members');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'en', count: 1 })).toBe('1 Member');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'en', count: 5 })).toBe('5 Members');
		expect(i18n.t('linkMessageInvite:memberCount', { lng: 'en', count: 1 })).toBe('1 Member');
		expect(i18n.t('linkMessageInvite:memberCount', { lng: 'en', count: 5 })).toBe('5 Members');

		expect(i18n.t('common:invite.member', { lng: 'ru', count: 1 })).toBe('Участник');
		expect(i18n.t('common:invite.member', { lng: 'ru', count: 5 })).toBe('Участники');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'ru', count: 1 })).toBe('1 участник');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'ru', count: 5 })).toBe('5 участников');
		expect(i18n.t('linkMessageInvite:memberCount', { lng: 'ru', count: 1 })).toBe('1 участник');
		expect(i18n.t('linkMessageInvite:memberCount', { lng: 'ru', count: 5 })).toBe('5 участников');

		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'pl', count: 1 })).toBe('1 Członek');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'pl', count: 5 })).toBe('5 Członków');

		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'fr', count: 1 })).toBe('1 Membre');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'fr', count: 5 })).toBe('5 Membres');

		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'vi', count: 1 })).toBe('1 Thành viên');
		expect(i18n.t('invitation:acceptModal.memberCount', { lng: 'vi', count: 5 })).toBe('5 Thành viên');

		for (const lng of supportedLanguages) {
			for (const count of [1, 5]) {
				const inviteMember = i18n.t('common:invite.member', { lng, count });
				const acceptCount = i18n.t('invitation:acceptModal.memberCount', { lng, count });
				const linkCount = i18n.t('linkMessageInvite:memberCount', { lng, count });
				expect(inviteMember).not.toContain('invite.member');
				expect(acceptCount).toContain(String(count));
				expect(linkCount).toContain(String(count));
				if (lng !== 'en') {
					expect(acceptCount).not.toBe(`${count} Members`);
					expect(linkCount).not.toBe(`${count} Members`);
				}
			}
		}
	});

	it('resolves existing v4 keys and numeric gRPC error keys cleanly', () => {
		expect(i18n.t('discover:memberCount', { lng: 'en', count: 1 })).toBe('1 member');
		expect(i18n.t('discover:memberCount', { lng: 'en', count: 5 })).toBe('5 members');
		expect(i18n.t('errors:error_0', { lng: 'en' })).toBe('OK');
		expect(i18n.t('errors:error_1', { lng: 'en' })).not.toBe('error_1');
	});
});
