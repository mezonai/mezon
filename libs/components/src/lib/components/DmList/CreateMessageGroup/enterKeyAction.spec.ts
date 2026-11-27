import { describe, expect, it } from '@jest/globals';
import { resolveEnterKeyAction } from './enterKeyAction';

describe('resolveEnterKeyAction', () => {
	it('returns toggleHighlighted for text input with 1 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'INPUT', type: 'text' }, 1)).toBe('toggleHighlighted');
	});

	it('returns toggleHighlighted for text input with 0 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'INPUT', type: 'text' }, 0)).toBe('toggleHighlighted');
	});

	it('returns submit for checkbox input with 1 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'INPUT', type: 'checkbox' }, 1)).toBe('submit');
	});

	it('returns submit for button with 2 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'BUTTON' }, 2)).toBe('submit');
	});

	it('returns submit for body with 1 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'BODY' }, 1)).toBe('submit');
	});

	it('returns submit for null target with 1 selected', () => {
		expect(resolveEnterKeyAction(null, 1)).toBe('submit');
	});

	it('returns toggleHighlighted for checkbox input with 0 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'INPUT', type: 'checkbox' }, 0)).toBe('toggleHighlighted');
	});

	it('returns toggleHighlighted for lowercase text input tagName with 1 selected', () => {
		expect(resolveEnterKeyAction({ tagName: 'input', type: 'text' }, 1)).toBe('toggleHighlighted');
	});
});
