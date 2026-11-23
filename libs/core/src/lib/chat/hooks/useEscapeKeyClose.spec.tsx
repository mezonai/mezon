import { useRef } from 'react';
import { act, create } from 'react-test-renderer';
import { useEscapeKeyClose } from './useEscapeKeyClose';

type KeyDownHandler = (event: { key: string; stopPropagation: jest.Mock }) => void;

type FakeElement = {
	addEventListener: jest.Mock;
	removeEventListener: jest.Mock;
	focus: jest.Mock;
	contains: jest.Mock;
};

const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
let fakeDocument: { activeElement: unknown };

function createFakeElement(): FakeElement {
	const element: FakeElement = {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		focus: jest.fn(() => {
			fakeDocument.activeElement = element;
		}),
		contains: jest.fn(() => false)
	};
	return element;
}

function getKeyDownHandler(element: FakeElement): KeyDownHandler | undefined {
	const call = element.addEventListener.mock.calls.find(([eventName]: [string]) => eventName === 'keydown');
	return call?.[1] as KeyDownHandler | undefined;
}

function HostWithoutFlag({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(ref, onClose);
	return isVisible ? <div ref={ref} tabIndex={-1} /> : null;
}

function HostWithFlag({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(ref, onClose, isOpen);
	return isOpen ? <div ref={ref} tabIndex={-1} /> : null;
}

beforeEach(() => {
	fakeDocument = { activeElement: null };
	Object.defineProperty(global, 'document', {
		value: fakeDocument,
		configurable: true,
		writable: true
	});
});

afterEach(() => {
	if (originalDocumentDescriptor) {
		Object.defineProperty(global, 'document', originalDocumentDescriptor);
	} else {
		delete (global as { document?: unknown }).document;
	}
});

it('attaches the Escape listener at mount when the element is present and no third argument is passed', () => {
	const fakeElement = createFakeElement();
	const onClose = jest.fn();
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<HostWithoutFlag isVisible={true} onClose={onClose} />, {
			createNodeMock: () => fakeElement
		});
	});
	expect(fakeElement.focus).toHaveBeenCalledTimes(1);
	expect(fakeElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
	const handler = getKeyDownHandler(fakeElement);
	const stopPropagation = jest.fn();
	handler?.({ key: 'Escape', stopPropagation });
	expect(stopPropagation).toHaveBeenCalledTimes(1);
	expect(onClose).toHaveBeenCalledTimes(1);
	act(() => {
		renderer.unmount();
	});
});

it('attaches the Escape listener after opening when mounted closed with isOpen', () => {
	const fakeElement = createFakeElement();
	const onClose = jest.fn();
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<HostWithFlag isOpen={false} onClose={onClose} />, {
			createNodeMock: () => fakeElement
		});
	});
	expect(fakeElement.addEventListener).not.toHaveBeenCalled();
	expect(fakeElement.focus).not.toHaveBeenCalled();
	act(() => {
		renderer.update(<HostWithFlag isOpen={true} onClose={onClose} />);
	});
	expect(fakeElement.focus).toHaveBeenCalledTimes(1);
	expect(fakeElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
	const handler = getKeyDownHandler(fakeElement);
	const stopPropagation = jest.fn();
	handler?.({ key: 'Escape', stopPropagation });
	expect(stopPropagation).toHaveBeenCalledTimes(1);
	expect(onClose).toHaveBeenCalledTimes(1);
	act(() => {
		renderer.unmount();
	});
});

it('removes the same keydown handler when closing with isOpen', () => {
	const fakeElement = createFakeElement();
	const onClose = jest.fn();
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<HostWithFlag isOpen={true} onClose={onClose} />, {
			createNodeMock: () => fakeElement
		});
	});
	const handler = getKeyDownHandler(fakeElement);
	expect(handler).toEqual(expect.any(Function));
	expect(fakeElement.removeEventListener).not.toHaveBeenCalled();
	act(() => {
		renderer.update(<HostWithFlag isOpen={false} onClose={onClose} />);
	});
	expect(fakeElement.removeEventListener).toHaveBeenCalledTimes(1);
	expect(fakeElement.removeEventListener).toHaveBeenCalledWith('keydown', handler);
	expect(fakeElement.addEventListener).toHaveBeenCalledTimes(1);
	act(() => {
		renderer.unmount();
	});
});

it('does not attach a listener on open when mounted closed without the third argument', () => {
	const fakeElement = createFakeElement();
	const onClose = jest.fn();
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<HostWithoutFlag isVisible={false} onClose={onClose} />, {
			createNodeMock: () => fakeElement
		});
	});
	act(() => {
		renderer.update(<HostWithoutFlag isVisible={true} onClose={onClose} />);
	});
	expect(fakeElement.addEventListener).not.toHaveBeenCalled();
	expect(fakeElement.focus).not.toHaveBeenCalled();
	act(() => {
		renderer.unmount();
	});
});

it('does not call onClose for non-Escape keys or when focus is outside the element', () => {
	const fakeElement = createFakeElement();
	const onClose = jest.fn();
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<HostWithFlag isOpen={true} onClose={onClose} />, {
			createNodeMock: () => fakeElement
		});
	});
	const handler = getKeyDownHandler(fakeElement);
	expect(handler).toEqual(expect.any(Function));
	const enterStopPropagation = jest.fn();
	handler?.({ key: 'Enter', stopPropagation: enterStopPropagation });
	expect(enterStopPropagation).not.toHaveBeenCalled();
	expect(onClose).not.toHaveBeenCalled();
	fakeDocument.activeElement = {};
	fakeElement.contains.mockReturnValue(false);
	const escapeStopPropagation = jest.fn();
	handler?.({ key: 'Escape', stopPropagation: escapeStopPropagation });
	expect(escapeStopPropagation).not.toHaveBeenCalled();
	expect(onClose).not.toHaveBeenCalled();
	act(() => {
		renderer.unmount();
	});
});
