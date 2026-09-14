/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderRecordingFrame } from './renderRecordingFrame';

export function compositorWorkerMain(helpers: { render: (...args: any[]) => void }): void {
	const scope: any = globalThis as any;
	const sources: Record<string, any> = {};
	let avatars: Record<string, any> = {};

	let canvas: any = null;
	let ctx: any = null;
	let writer: any = null;
	let tiles: any[] = [];
	let running = false;
	let frameInterval = 1000 / 30;
	let frameDuration = Math.round(1000000 / 30);
	let startedAt = 0;
	let timer: any = null;
	let framesWritten = 0;
	let framesDropped = 0;
	let lastReportAt = 0;

	function noop(): void {
		/* intentionally empty */
	}

	function now(): number {
		return scope.performance.now();
	}

	function post(message: any): void {
		scope.postMessage(message);
	}

	function pump(key: string, readable: any): void {
		const reader = readable.getReader();
		const entry = sources[key];
		if (!entry) {
			reader.cancel().catch(noop);
			return;
		}
		entry.reader = reader;

		function step(): void {
			reader.read().then(function (result: any) {
				const current = sources[key];
				if (!current || current.reader !== reader) {
					if (result.value) {
						result.value.close();
					}
					reader.cancel().catch(noop);
					return;
				}
				if (result.done) {
					return;
				}
				const frame = result.value;
				if (current.frame) {
					current.frame.close();
				}
				current.frame = frame;
				current.width = frame.displayWidth || frame.codedWidth || 0;
				current.height = frame.displayHeight || frame.codedHeight || 0;
				step();
			}, noop);
		}

		step();
	}

	function removeSource(key: string): void {
		const entry = sources[key];
		if (!entry) {
			return;
		}
		delete sources[key];
		if (entry.frame) {
			entry.frame.close();
		}
		if (entry.reader) {
			entry.reader.cancel().catch(noop);
		}
	}

	function buildItems(): any[] {
		const items: any[] = [];
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const source = tile.videoKey ? sources[tile.videoKey] : null;
			items.push({
				image: source && source.frame ? source.frame : null,
				imageWidth: source ? source.width : 0,
				imageHeight: source ? source.height : 0,
				avatar: tile.avatarKey ? avatars[tile.avatarKey] || null : null,
				label: tile.label,
				initial: tile.initial,
				accent: tile.accent,
				focused: tile.focused,
				contain: tile.contain,
				speaking: tile.speaking
			});
		}
		return items;
	}

	function renderOnce(): void {
		if (!running || !ctx || !writer) {
			return;
		}
		if (writer.desiredSize !== null && writer.desiredSize <= 0) {
			framesDropped++;
			return;
		}

		helpers.render(ctx, canvas.width, canvas.height, buildItems());

		let frame;
		try {
			frame = new scope.VideoFrame(canvas, {
				timestamp: Math.round((now() - startedAt) * 1000),
				duration: frameDuration
			});
		} catch (error) {
			framesDropped++;
			return;
		}

		writer.write(frame).catch(function () {
			framesDropped++;
		});
		framesWritten++;
	}

	function tick(): void {
		if (!running) {
			return;
		}
		renderOnce();

		const current = now();
		if (current - lastReportAt > 2000) {
			lastReportAt = current;
			post({ type: 'stats', framesWritten, framesDropped });
		}

		const elapsed = current - startedAt;
		timer = scope.setTimeout(tick, frameInterval - (elapsed % frameInterval));
	}

	function shutdown(): void {
		if (!running && !writer) {
			post({ type: 'stopped' });
			return;
		}
		running = false;
		if (timer) {
			scope.clearTimeout(timer);
			timer = null;
		}

		const sourceKeys = Object.keys(sources);
		for (let i = 0; i < sourceKeys.length; i++) {
			removeSource(sourceKeys[i]);
		}

		const avatarKeys = Object.keys(avatars);
		for (let i = 0; i < avatarKeys.length; i++) {
			const bitmap = avatars[avatarKeys[i]];
			if (bitmap && bitmap.close) {
				bitmap.close();
			}
		}
		avatars = {};

		if (writer) {
			const pending = writer;
			writer = null;
			pending.close().then(
				function () {
					post({ type: 'stopped' });
				},
				function () {
					post({ type: 'stopped' });
				}
			);
		} else {
			post({ type: 'stopped' });
		}
	}

	scope.onmessage = function (event: any) {
		const data = event.data;
		if (!data) {
			return;
		}

		if (data.type === 'init') {
			canvas = new scope.OffscreenCanvas(data.width, data.height);
			ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
			frameInterval = 1000 / data.fps;
			frameDuration = Math.round(1000000 / data.fps);
			writer = data.writable.getWriter();
			startedAt = now();
			lastReportAt = startedAt;
			running = true;
			tick();
			return;
		}

		if (data.type === 'addSource') {
			removeSource(data.key);
			sources[data.key] = { frame: null, width: 0, height: 0, reader: null };
			pump(data.key, data.readable);
			return;
		}

		if (data.type === 'removeSource') {
			removeSource(data.key);
			return;
		}

		if (data.type === 'scene') {
			tiles = data.tiles;
			return;
		}

		if (data.type === 'avatar') {
			const previous = avatars[data.key];
			if (previous && previous.close) {
				previous.close();
			}
			avatars[data.key] = data.bitmap;
			return;
		}

		if (data.type === 'stop') {
			shutdown();
		}
	};
}

export function buildCompositorWorkerSource(): string {
	return `var __mezonRecordingHelpers = { render: ${renderRecordingFrame.toString()} };\n(${compositorWorkerMain.toString()})(__mezonRecordingHelpers);\n`;
}
