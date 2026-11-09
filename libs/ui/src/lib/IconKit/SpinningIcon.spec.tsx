import { describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { mzSpinner } from '../mezon-icons/24';
import { SpinningIcon } from './SpinningIcon';

type Node = { type: string; props: { className?: string } };
const { create } = jest.requireActual<{
	create: (element: ReactElement) => { root: { findByType: (t: string) => Node }; unmount: () => void };
}>('react-test-renderer');

describe('SpinningIcon', () => {
	it('the wrapper spins and the icon inside is held still by !animate-none', () => {
		const r = create(<SpinningIcon icon={mzSpinner} />);
		const span = r.root.findByType('span');
		const svg = r.root.findByType('svg');
		expect(span.props.className).toContain('animate-spin');
		expect(svg.props.className).toBe('mz-icon mz-anim-spin mz-i-spinner !animate-none');
		r.unmount();
	});
});
