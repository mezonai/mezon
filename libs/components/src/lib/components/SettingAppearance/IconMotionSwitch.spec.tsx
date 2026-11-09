import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import IconMotionSwitch from './IconMotionSwitch';

type Input = { props: { checked: boolean; onChange: (e: { target: { checked: boolean } }) => void } };
const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => { root: { findByType: (t: string) => Input }; unmount: () => void };
}>('react-test-renderer');

let mockStored = true;
const mockSetIconMotion = jest.fn();
jest.mock('@mezon/ui', () => ({ getIconMotion: () => mockStored, setIconMotion: (on: boolean) => mockSetIconMotion(on) }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }), { virtual: true });
jest.mock('@mezon/utils', () => ({ generateE2eId: (id: string) => id }), { virtual: true });

describe('IconMotionSwitch', () => {
	beforeEach(() => {
		mockSetIconMotion.mockClear();
	});

	it('shows the stored state', () => {
		mockStored = false;
		const r = create(<IconMotionSwitch />);
		expect(r.root.findByType('input').props.checked).toBe(false);
		r.unmount();
	});

	it('turning it off calls setIconMotion(false)', () => {
		mockStored = true;
		const r = create(<IconMotionSwitch />);
		const input = r.root.findByType('input');
		expect(input.props.checked).toBe(true);
		act(() => input.props.onChange({ target: { checked: false } }));
		expect(mockSetIconMotion).toHaveBeenCalledWith(false);
		expect(r.root.findByType('input').props.checked).toBe(false);
		r.unmount();
	});
});
