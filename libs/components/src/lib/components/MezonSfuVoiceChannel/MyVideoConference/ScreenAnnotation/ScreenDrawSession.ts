import type { CanvasSize } from './screenDrawState';
import { ScreenDrawState } from './screenDrawState';

export class ScreenDrawSession {
	readonly state = new ScreenDrawState();
	canvas: CanvasSize = [0, 0];
	private version = 0;
	private readonly listeners = new Set<() => void>();

	constructor(
		readonly tileId: string,
		readonly broadcast: boolean
	) {
		this.state.setActive(true);
	}

	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	getVersion = () => this.version;

	edit<R>(update: (state: ScreenDrawState) => R): R {
		const result = update(this.state);
		if (result !== false) {
			this.version++;
			this.listeners.forEach((listener) => listener());
		}
		return result;
	}

	setCanvas(width: number, height: number) {
		if (this.canvas[0] === width && this.canvas[1] === height) return;
		this.edit(() => {
			this.canvas = [width, height];
		});
	}
}
