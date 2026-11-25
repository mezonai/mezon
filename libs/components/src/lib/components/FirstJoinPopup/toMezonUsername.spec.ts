import { describe, expect, it, jest } from '@jest/globals';
import { toMezonUsername } from './FirstSetupUsername';

jest.mock('@mezon/store', () => ({}), { virtual: true });

describe('toMezonUsername', () => {
	it('strips Vietnamese diacritics and spaces', () => {
		expect(toMezonUsername('Chú bé loắt choắt')).toBe('chubeloatchoat');
	});

	it('transliterates đ and Đ to d', () => {
		expect(toMezonUsername('Đặng Văn Đức')).toBe('dangvanduc');
	});

	it('preserves allowed punctuation and lowercases ASCII letters', () => {
		expect(toMezonUsername('Huy.Le_Xuan-1+2')).toBe('huy.le_xuan-1+2');
	});

	it('returns empty string for emoji and symbols only', () => {
		expect(toMezonUsername('😀 !@#')).toBe('');
	});

	it('caps output at 32 characters', () => {
		expect(toMezonUsername('a'.repeat(40))).toBe('a'.repeat(32));
	});

	it('returns empty string for whitespace only', () => {
		expect(toMezonUsername('  ')).toBe('');
	});

	it('always matches /^[a-z0-9._\\-+]{0,32}$/', () => {
		const inputs = [
			'',
			'  ',
			'Chú bé loắt choắt',
			'Đặng Văn Đức',
			'Huy.Le_Xuan-1+2',
			'😀 !@#',
			'a'.repeat(40),
			'Hủy4.Dev.1',
			'   Nguyễn_Văn-A+1.2!@# 😀',
			'ÄÖÜß',
			'Z'.repeat(50)
		];

		for (const input of inputs) {
			expect(toMezonUsername(input)).toMatch(/^[a-z0-9._\-+]{0,32}$/);
		}
	});
});
