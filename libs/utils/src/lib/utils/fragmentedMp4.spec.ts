import { describe, expect, it } from '@jest/globals';
import { FragmentedMp4Indexer, finalizedMp4Blob, fragmentedMp4Playlist } from './fragmentedMp4';

function concat(...parts: Uint8Array[]): Uint8Array {
	let total = 0;
	for (const part of parts) total += part.length;
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

function u32(value: number): Uint8Array {
	const out = new Uint8Array(4);
	new DataView(out.buffer).setUint32(0, value, false);
	return out;
}

function u64(value: bigint): Uint8Array {
	const out = new Uint8Array(8);
	new DataView(out.buffer).setBigUint64(0, value, false);
	return out;
}

function ascii(text: string): Uint8Array {
	const out = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i += 1) {
		out[i] = text.charCodeAt(i);
	}
	return out;
}

function box(type: string, ...payloads: Uint8Array[]): Uint8Array {
	const body = concat(...payloads);
	return concat(u32(8 + body.length), ascii(type), body);
}

function fullBox(type: string, version: number, flags: number, ...payloads: Uint8Array[]): Uint8Array {
	const vf = ((version & 0xff) << 24) | (flags & 0xffffff);
	return box(type, u32(vf >>> 0), ...payloads);
}

function buildMvhd(timescale: number, duration = 0, version = 0): Uint8Array {
	if (version === 0) {
		return fullBox('mvhd', 0, 0, u32(0), u32(0), u32(timescale), u32(duration), new Uint8Array(80));
	}
	return fullBox('mvhd', 1, 0, u64(0n), u64(0n), u32(timescale), u64(BigInt(duration)), new Uint8Array(80));
}

function buildTkhd(trackId: number, duration = 0, version = 0): Uint8Array {
	if (version === 0) {
		return fullBox('tkhd', 0, 3, u32(0), u32(0), u32(trackId), u32(0), u32(duration), new Uint8Array(60));
	}
	return fullBox('tkhd', 1, 3, u64(0n), u64(0n), u32(trackId), u32(0), u64(BigInt(duration)), new Uint8Array(60));
}

function buildMdhd(timescale: number, duration = 0, version = 0): Uint8Array {
	if (version === 0) {
		return fullBox('mdhd', 0, 0, u32(0), u32(0), u32(timescale), u32(duration), u32(0));
	}
	return fullBox('mdhd', 1, 0, u64(0n), u64(0n), u32(timescale), u64(BigInt(duration)), u32(0));
}

function buildTrak(trackId: number, mediaTimescale: number, version = 0, handler?: string): Uint8Array {
	const hdlr = handler ? fullBox('hdlr', 0, 0, u32(0), ascii(handler), new Uint8Array(13)) : new Uint8Array(0);
	const mdia = box('mdia', buildMdhd(mediaTimescale, 0, version), hdlr, box('minf', box('stbl')));
	return box('trak', buildTkhd(trackId, 0, version), mdia);
}

function buildTrex(trackId: number, defaultSampleDuration: number): Uint8Array {
	return fullBox('trex', 0, 0, u32(trackId), u32(1), u32(defaultSampleDuration), u32(0), u32(0));
}

function buildAudioTraf(trackId: number, baseTime: number, sampleCount: number): Uint8Array {
	const tfhd = fullBox('tfhd', 0, 0x020000, u32(trackId));
	const tfdt = fullBox('tfdt', 0, 0, u32(baseTime));
	const sampleSizes = new Uint8Array(sampleCount * 4);
	const view = new DataView(sampleSizes.buffer);
	for (let i = 0; i < sampleCount; i += 1) {
		view.setUint32(i * 4, 16, false);
	}
	const trun = fullBox('trun', 0, 0x000201, u32(sampleCount), u32(0), sampleSizes);
	return box('traf', tfhd, tfdt, trun);
}

function buildVideoTraf(trackId: number, baseTime: bigint, durations: number[]): Uint8Array {
	const tfhd = fullBox('tfhd', 0, 0x020002, u32(trackId), u32(1));
	const tfdt = fullBox('tfdt', 1, 0, u64(baseTime));
	const entries = new Uint8Array(durations.length * 8);
	const view = new DataView(entries.buffer);
	for (let i = 0; i < durations.length; i += 1) {
		view.setUint32(i * 8, durations[i], false);
		view.setUint32(i * 8 + 4, 100, false);
	}
	const trun = fullBox('trun', 0, 0x000305, u32(durations.length), u32(0), u32(0x02000000), entries);
	return box('traf', tfhd, tfdt, trun);
}

function buildSyntheticFmp4() {
	const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'), ascii('iso6'), ascii('mp41'));
	const moov = box('moov', buildMvhd(1000, 0), buildTrak(1, 48000), buildTrak(2, 30000), box('mvex', buildTrex(1, 960), buildTrex(2, 0)));

	const audioBases = [0, 4800, 9600];
	const videoBases = [0n, 3000n, 6000n];
	const videoDurations = [
		[1000, 1000, 1000],
		[1000, 1000, 1000],
		[1000, 1000, 1500]
	];

	const fragments: Uint8Array[] = [];
	const moofOffsets: number[] = [];
	let cursor = ftyp.length + moov.length;
	let lastMoofOffset = 0;
	let lastMoofSize = 0;

	for (let i = 0; i < 3; i += 1) {
		const moof = box(
			'moof',
			fullBox('mfhd', 0, 0, u32(i + 1)),
			buildAudioTraf(1, audioBases[i], 5),
			buildVideoTraf(2, videoBases[i], videoDurations[i])
		);
		const mdat = box('mdat', new Uint8Array([i + 1, 2, 3, 4, 5]));
		moofOffsets.push(cursor);
		lastMoofOffset = cursor;
		lastMoofSize = moof.length;
		fragments.push(moof, mdat);
		cursor += moof.length + mdat.length;
	}

	const bytes = concat(ftyp, moov, ...fragments);
	return { bytes, ftyp, moov, moofOffsets, audioBases, videoBases, lastMoofOffset, lastMoofSize };
}

interface ParsedDurations {
	mvhdDuration: number;
	tracks: Map<number, { tkhdDuration: number; mdhdDuration: number }>;
}

function readMoovDurations(moovBytes: Uint8Array): ParsedDurations {
	const view = new DataView(moovBytes.buffer, moovBytes.byteOffset, moovBytes.byteLength);
	let mvhdDuration = -1;
	const tracks = new Map<number, { tkhdDuration: number; mdhdDuration: number }>();

	const walk = (start: number, end: number, currentTrack?: { id?: number; tkhdDuration?: number; mdhdDuration?: number }) => {
		let off = start;
		while (off < end) {
			const size = view.getUint32(off, false);
			const type = String.fromCharCode(moovBytes[off + 4], moovBytes[off + 5], moovBytes[off + 6], moovBytes[off + 7]);
			const body = off + 8;
			if (type === 'mvhd') {
				const v = moovBytes[body];
				mvhdDuration = v === 0 ? view.getUint32(body + 16, false) : Number(view.getBigUint64(body + 24, false));
			} else if (type === 'trak') {
				const trackState: { id?: number; tkhdDuration?: number; mdhdDuration?: number } = {};
				walk(body, off + size, trackState);
				tracks.set(trackState.id!, {
					tkhdDuration: trackState.tkhdDuration!,
					mdhdDuration: trackState.mdhdDuration!
				});
			} else if (type === 'tkhd' && currentTrack) {
				const v = moovBytes[body];
				currentTrack.id = view.getUint32(body + (v === 0 ? 12 : 20), false);
				currentTrack.tkhdDuration = v === 0 ? view.getUint32(body + 20, false) : Number(view.getBigUint64(body + 28, false));
			} else if (type === 'mdia' && currentTrack) {
				walk(body, off + size, currentTrack);
			} else if (type === 'mdhd' && currentTrack) {
				const v = moovBytes[body];
				currentTrack.mdhdDuration = v === 0 ? view.getUint32(body + 16, false) : Number(view.getBigUint64(body + 24, false));
			}
			off += size;
		}
	};

	walk(8, moovBytes.length);
	return { mvhdDuration, tracks };
}

function parseMfra(tail: Uint8Array) {
	const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
	const mfraSize = view.getUint32(0, false);
	const mfraType = String.fromCharCode(tail[4], tail[5], tail[6], tail[7]);
	const tfras: Array<{
		trackId: number;
		version: number;
		flags: number;
		lengths: number;
		entries: Array<{ time: bigint; moofOffset: bigint; trafNumber: number; trunNumber: number; sampleNumber: number }>;
	}> = [];
	let mfro: { size: number; versionFlags: number; parentSize: number } | null = null;

	let off = 8;
	while (off < tail.length) {
		const size = view.getUint32(off, false);
		const type = String.fromCharCode(tail[off + 4], tail[off + 5], tail[off + 6], tail[off + 7]);
		if (type === 'tfra') {
			const vf = view.getUint32(off + 8, false);
			const version = vf >>> 24;
			const flags = vf & 0xffffff;
			const trackId = view.getUint32(off + 12, false);
			const lengths = view.getUint32(off + 16, false);
			const count = view.getUint32(off + 20, false);
			const entries: Array<{ time: bigint; moofOffset: bigint; trafNumber: number; trunNumber: number; sampleNumber: number }> = [];
			let p = off + 24;
			for (let i = 0; i < count; i += 1) {
				entries.push({
					time: view.getBigUint64(p, false),
					moofOffset: view.getBigUint64(p + 8, false),
					trafNumber: tail[p + 16],
					trunNumber: tail[p + 17],
					sampleNumber: tail[p + 18]
				});
				p += 19;
			}
			tfras.push({ trackId, version, flags, lengths, entries });
		} else if (type === 'mfro') {
			mfro = {
				size,
				versionFlags: view.getUint32(off + 8, false),
				parentSize: view.getUint32(off + 12, false)
			};
		}
		off += size;
	}

	return { mfraSize, mfraType, tfras, mfro };
}

describe('FragmentedMp4Indexer', () => {
	it('patches only the mvhd duration in the moov head without changing size', () => {
		const sample = buildSyntheticFmp4();
		const indexer = new FragmentedMp4Indexer();
		indexer.push(sample.bytes);
		const fin = indexer.finish();

		expect(fin).not.toBeNull();
		expect(fin!.headOffset).toBe(sample.ftyp.length);
		expect(fin!.head.length).toBe(sample.moov.length);

		const durations = readMoovDurations(fin!.head);
		expect(durations.mvhdDuration).toBe(317);
		expect(durations.tracks.get(1)).toEqual({ tkhdDuration: 0, mdhdDuration: 0 });
		expect(durations.tracks.get(2)).toEqual({ tkhdDuration: 0, mdhdDuration: 0 });
	});

	it('produces identical output when fed byte by byte vs as a single buffer', () => {
		const sample = buildSyntheticFmp4();

		const single = new FragmentedMp4Indexer();
		single.push(sample.bytes);
		const singleFin = single.finish();

		const streamed = new FragmentedMp4Indexer();
		for (let i = 0; i < sample.bytes.length; i += 1) {
			streamed.push(sample.bytes.subarray(i, i + 1));
		}
		const streamedFin = streamed.finish();

		expect(streamedFin).not.toBeNull();
		expect(streamedFin!.headOffset).toBe(singleFin!.headOffset);
		expect(Array.from(streamedFin!.head)).toEqual(Array.from(singleFin!.head));
		expect(Array.from(streamedFin!.tail)).toEqual(Array.from(singleFin!.tail));
	});

	it('appends a valid mfra box with matching tfra entries and mfro size', () => {
		const sample = buildSyntheticFmp4();
		const indexer = new FragmentedMp4Indexer();
		indexer.push(sample.bytes);
		const fin = indexer.finish()!;

		const parsed = parseMfra(fin.tail);
		expect(parsed.mfraType).toBe('mfra');
		expect(parsed.mfraSize).toBe(fin.tail.length);
		expect(parsed.mfro).toEqual({ size: 16, versionFlags: 0, parentSize: fin.tail.length });
		expect(parsed.tfras).toHaveLength(2);

		expect(parsed.tfras[0].trackId).toBe(1);
		expect(parsed.tfras[0].version).toBe(1);
		expect(parsed.tfras[0].flags).toBe(0);
		expect(parsed.tfras[0].lengths).toBe(0);
		expect(parsed.tfras[0].entries).toEqual(
			sample.audioBases.map((time, idx) => ({
				time: BigInt(time),
				moofOffset: BigInt(sample.moofOffsets[idx]),
				trafNumber: 1,
				trunNumber: 1,
				sampleNumber: 1
			}))
		);

		expect(parsed.tfras[1].trackId).toBe(2);
		expect(parsed.tfras[1].version).toBe(1);
		expect(parsed.tfras[1].flags).toBe(0);
		expect(parsed.tfras[1].lengths).toBe(0);
		expect(parsed.tfras[1].entries).toEqual(
			sample.videoBases.map((time, idx) => ({
				time,
				moofOffset: BigInt(sample.moofOffsets[idx]),
				trafNumber: 2,
				trunNumber: 1,
				sampleNumber: 1
			}))
		);
	});

	it('returns null for webm-like input whose first box is not ftyp', () => {
		const webmHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01]);
		const indexer = new FragmentedMp4Indexer();
		indexer.push(webmHeader);
		expect(indexer.finish()).toBeNull();
	});

	it('returns null when input is truncated in the middle of the last moof', () => {
		const sample = buildSyntheticFmp4();
		const cutPoint = sample.lastMoofOffset + Math.floor(sample.lastMoofSize / 2);
		const indexer = new FragmentedMp4Indexer();
		indexer.push(sample.bytes.subarray(0, cutPoint));
		expect(indexer.finish()).toBeNull();
	});

	it('returns null when the last box runs to the end of the file', () => {
		const sample = buildSyntheticFmp4();
		const openEnded = concat(u32(0), ascii('mdat'), new Uint8Array([9, 9, 9]));
		const indexer = new FragmentedMp4Indexer();
		indexer.push(concat(sample.bytes, openEnded));
		expect(indexer.finish()).toBeNull();
	});

	it('replaces head at headOffset and appends tail in finalizedMp4Blob', async () => {
		const sample = buildSyntheticFmp4();
		const indexer = new FragmentedMp4Indexer();
		indexer.push(sample.bytes);
		const fin = indexer.finish()!;

		const origBlob = new Blob([sample.bytes], { type: 'video/mp4' });
		const outBlob = finalizedMp4Blob(origBlob, fin, 'video/mp4');

		expect(outBlob.type).toBe('video/mp4');
		expect(outBlob.size).toBe(sample.bytes.length + fin.tail.length);

		const outBytes = new Uint8Array(await outBlob.arrayBuffer());
		expect(Array.from(outBytes.subarray(0, fin.headOffset))).toEqual(Array.from(sample.bytes.subarray(0, fin.headOffset)));
		expect(Array.from(outBytes.subarray(fin.headOffset, fin.headOffset + fin.head.length))).toEqual(Array.from(fin.head));
		expect(Array.from(outBytes.subarray(fin.headOffset + fin.head.length, sample.bytes.length))).toEqual(
			Array.from(sample.bytes.subarray(fin.headOffset + fin.head.length))
		);
		expect(Array.from(outBytes.subarray(sample.bytes.length))).toEqual(Array.from(fin.tail));
	});

	it('returns null when a traf has no tfdt or a v0 duration overflows u32', () => {
		const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'));
		const moov = box('moov', buildMvhd(1000, 0), buildTrak(1, 48000), box('mvex', buildTrex(1, 960)));

		const trafNoTfdt = box('traf', fullBox('tfhd', 0, 0x020000, u32(1)), fullBox('trun', 0, 0, u32(5)));
		const noTfdtBytes = concat(ftyp, moov, box('moof', fullBox('mfhd', 0, 0, u32(1)), trafNoTfdt), box('mdat', u32(0)));
		const noTfdtIndexer = new FragmentedMp4Indexer();
		noTfdtIndexer.push(noTfdtBytes);
		expect(noTfdtIndexer.finish()).toBeNull();

		const hugeBaseTraf = box(
			'traf',
			fullBox('tfhd', 0, 0x020000, u32(1)),
			fullBox('tfdt', 1, 0, u64(0x30_0000_0000n)),
			fullBox('trun', 0, 0, u32(1))
		);
		const overflowBytes = concat(ftyp, moov, box('moof', fullBox('mfhd', 0, 0, u32(1)), hugeBaseTraf), box('mdat', u32(0)));
		const overflowIndexer = new FragmentedMp4Indexer();
		overflowIndexer.push(overflowBytes);
		expect(overflowIndexer.finish()).toBeNull();
	});

	it('supports version 1 headers, 64-bit box sizes, and tfhd default sample duration', () => {
		const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'));
		const moovBody = concat(buildMvhd(1000, 0, 1), buildTrak(1, 1000, 1), box('mvex', buildTrex(1, 0)));
		const moovLarge = concat(u32(1), ascii('moov'), u64(BigInt(16 + moovBody.length)), moovBody);
		const traf = box(
			'traf',
			fullBox('tfhd', 0, 0x020008, u32(1), u32(500)),
			fullBox('tfdt', 1, 0, u64(5_000_000_000n)),
			fullBox('trun', 0, 0, u32(4))
		);
		const moof = box('moof', fullBox('mfhd', 0, 0, u32(1)), traf);
		const mdat = concat(u32(1), ascii('mdat'), u64(20n), u32(0xdeadbeef));
		const stream = concat(ftyp, moovLarge, moof, mdat);

		const indexer = new FragmentedMp4Indexer();
		indexer.push(stream);
		const fin = indexer.finish();

		expect(fin).not.toBeNull();
		expect(fin!.head.length).toBe(moovLarge.length);
		const view = new DataView(fin!.head.buffer, fin!.head.byteOffset, fin!.head.byteLength);
		expect(view.getBigUint64(16 + 8 + 24, false)).toBe(5_000_002_000n);
	});
});

describe('fragmentedMp4Playlist', () => {
	const SIGNED_URL = 'https://cdn.mezon.ai/1cf93b197d401000/recording.mp4?1791900000-c2lnbmF0dXJl';

	function finalizeStream(raw: Uint8Array) {
		const indexer = new FragmentedMp4Indexer();
		indexer.push(raw);
		const fin = indexer.finish()!;
		const full = concat(raw.subarray(0, fin.headOffset), fin.head, raw.subarray(fin.headOffset + fin.head.length), fin.tail);
		return { full, fin };
	}

	it('builds an exact VOD byte-range playlist from a finalized fragmented mp4', () => {
		const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'), ascii('iso6'), ascii('mp41'));
		const moov = box(
			'moov',
			buildMvhd(1000, 0),
			buildTrak(1, 48000, 0, 'soun'),
			buildTrak(2, 30000, 0, 'vide'),
			box('mvex', buildTrex(1, 960), buildTrex(2, 0))
		);
		const audioBases = [0, 4800, 9600];
		const videoBases = [0n, 3600n, 7500n];
		const videoDurations = [
			[1200, 1200, 1200],
			[1300, 1300, 1300],
			[1500, 1500, 1500]
		];
		const fragments: Uint8Array[] = [];
		const offsets: number[] = [];
		let cursor = ftyp.length + moov.length;
		for (let i = 0; i < 3; i += 1) {
			const moof = box(
				'moof',
				fullBox('mfhd', 0, 0, u32(i + 1)),
				buildAudioTraf(1, audioBases[i], 5),
				buildVideoTraf(2, videoBases[i], videoDurations[i])
			);
			const mdat = box('mdat', new Uint8Array(20 + i * 7));
			offsets.push(cursor);
			fragments.push(moof, mdat);
			cursor += moof.length + mdat.length;
		}
		const raw = concat(ftyp, moov, ...fragments);
		const { full, fin } = finalizeStream(raw);
		const head = full.subarray(0, offsets[0] + 16);

		expect(fragmentedMp4Playlist(SIGNED_URL, head, full.length, fin.tail)).toBe(
			[
				'#EXTM3U',
				'#EXT-X-VERSION:7',
				'#EXT-X-TARGETDURATION:1',
				'#EXT-X-PLAYLIST-TYPE:VOD',
				`#EXT-X-MAP:URI="${SIGNED_URL}",BYTERANGE="${offsets[0]}@0"`,
				'#EXTINF:0.120,',
				`#EXT-X-BYTERANGE:${offsets[1] - offsets[0]}@${offsets[0]}`,
				SIGNED_URL,
				'#EXTINF:0.130,',
				`#EXT-X-BYTERANGE:${offsets[2] - offsets[1]}@${offsets[1]}`,
				SIGNED_URL,
				'#EXTINF:0.150,',
				`#EXT-X-BYTERANGE:${raw.length - offsets[2]}@${offsets[2]}`,
				SIGNED_URL,
				'#EXT-X-ENDLIST',
				''
			].join('\n')
		);
	});

	it('chooses the video track when audio comes first, and falls back to the first track when no video track exists', () => {
		const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'));
		const makeStream = (secondHandler: string) => {
			const moov = box(
				'moov',
				buildMvhd(1000, 0),
				buildTrak(1, 1000, 0, 'soun'),
				buildTrak(2, 1000, 0, secondHandler),
				box('mvex', buildTrex(1, 2000), buildTrex(2, 0))
			);
			const frag1 = concat(
				box('moof', fullBox('mfhd', 0, 0, u32(1)), buildAudioTraf(1, 0, 1), buildVideoTraf(2, 0n, [3500])),
				box('mdat', u32(1))
			);
			const frag2 = concat(
				box('moof', fullBox('mfhd', 0, 0, u32(2)), buildAudioTraf(1, 2000, 1), buildVideoTraf(2, 3500n, [1500])),
				box('mdat', u32(2))
			);
			return finalizeStream(concat(ftyp, moov, frag1, frag2));
		};

		const withVideo = makeStream('vide');
		const videoPlaylist = fragmentedMp4Playlist(SIGNED_URL, withVideo.full.subarray(0, 16384), withVideo.full.length, withVideo.fin.tail);
		expect(videoPlaylist).toContain('#EXT-X-TARGETDURATION:4\n');
		expect(videoPlaylist).toContain('#EXTINF:3.500,\n');
		expect(videoPlaylist).toContain('#EXTINF:1.500,\n');

		const audioOnly = makeStream('meta');
		const audioPlaylist = fragmentedMp4Playlist(SIGNED_URL, audioOnly.full.subarray(0, 16384), audioOnly.full.length, audioOnly.fin.tail);
		expect(audioPlaylist).toContain('#EXT-X-TARGETDURATION:3\n');
		expect(audioPlaylist).toContain('#EXTINF:2.000,\n');
		expect(audioPlaylist).toContain('#EXTINF:3.000,\n');
	});

	it('returns undefined when moov has no mvex', () => {
		const sample = buildSyntheticFmp4();
		const { full, fin } = finalizeStream(sample.bytes);
		const normalMoov = box('moov', buildMvhd(1000, 317), buildTrak(1, 48000, 0, 'soun'), buildTrak(2, 30000, 0, 'vide'));
		const normalHead = concat(sample.ftyp, normalMoov, box('mdat', new Uint8Array(32)));

		expect(fragmentedMp4Playlist(SIGNED_URL, normalHead, full.length, fin.tail)).toBeUndefined();
	});

	it('returns undefined when moof is beyond head or moov is truncated in head', () => {
		const sample = buildSyntheticFmp4();
		const { full, fin } = finalizeStream(sample.bytes);
		const initEnd = sample.moofOffsets[0];

		expect(fragmentedMp4Playlist(SIGNED_URL, full.subarray(0, initEnd), full.length, fin.tail)).toBeUndefined();
		expect(fragmentedMp4Playlist(SIGNED_URL, full.subarray(0, initEnd + 4), full.length, fin.tail)).toBeUndefined();
		expect(fragmentedMp4Playlist(SIGNED_URL, full.subarray(0, sample.ftyp.length + 16), full.length, fin.tail)).toBeUndefined();
	});

	it('returns undefined when mfra offsets do not start at initEnd, are not strictly increasing, or exceed the mfra start', () => {
		const sample = buildSyntheticFmp4();
		const { full, fin } = finalizeStream(sample.bytes);
		const initEnd = sample.moofOffsets[0];
		const dataEnd = full.length - fin.tail.length;

		const makeCustomMfra = (offsets: number[]) => {
			const entries = concat(...offsets.map((off, idx) => concat(u32(idx * 1000), u32(off), new Uint8Array([1, 1, 1]))));
			const tfra = fullBox('tfra', 0, 0, u32(1), u32(0), u32(offsets.length), entries);
			const totalSize = 8 + tfra.length + 16;
			const mfro = fullBox('mfro', 0, 0, u32(totalSize));
			return box('mfra', tfra, mfro);
		};

		const badStart = makeCustomMfra([initEnd + 8, sample.moofOffsets[1]]);
		expect(fragmentedMp4Playlist(SIGNED_URL, full, dataEnd + badStart.length, badStart)).toBeUndefined();

		const nonIncreasing = makeCustomMfra([initEnd, initEnd]);
		expect(fragmentedMp4Playlist(SIGNED_URL, full, dataEnd + nonIncreasing.length, nonIncreasing)).toBeUndefined();

		const outOfRange = makeCustomMfra([initEnd, dataEnd]);
		expect(fragmentedMp4Playlist(SIGNED_URL, full, dataEnd + outOfRange.length, outOfRange)).toBeUndefined();

		const emptyTfra = makeCustomMfra([]);
		expect(fragmentedMp4Playlist(SIGNED_URL, full, dataEnd + emptyTfra.length, emptyTfra)).toBeUndefined();
	});

	it('parses v1 tfra boxes with 64-bit times, variable length sizes, and falls back when mvhd duration is zero', () => {
		const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'));
		const moov = box('moov', buildMvhd(1000, 0, 1), buildTrak(1, 1_000_000, 1, 'vide'), box('mvex', buildTrex(1, 0)));
		const frag1 = concat(box('moof', fullBox('mfhd', 0, 0, u32(1))), box('mdat', new Uint8Array(24)));
		const frag2 = concat(box('moof', fullBox('mfhd', 0, 0, u32(2))), box('mdat', new Uint8Array(32)));
		const initEnd = ftyp.length + moov.length;
		const secondOffset = initEnd + frag1.length;
		const dataEnd = secondOffset + frag2.length;

		const entries = concat(
			u64(5_000_000_000n),
			u64(BigInt(initEnd)),
			u32(1),
			u32(1),
			u32(1),
			u64(5_004_250_000n),
			u64(BigInt(secondOffset)),
			u32(1),
			u32(1),
			u32(1)
		);
		const tfra = fullBox('tfra', 1, 0, u32(1), u32(0x3f), u32(2), entries);
		const mfraSize = 8 + tfra.length + 16;
		const mfra = box('mfra', tfra, fullBox('mfro', 0, 0, u32(mfraSize)));
		const full = concat(ftyp, moov, frag1, frag2, mfra);

		expect(fragmentedMp4Playlist(SIGNED_URL, full.subarray(0, secondOffset), full.length, mfra)).toBe(
			[
				'#EXTM3U',
				'#EXT-X-VERSION:7',
				'#EXT-X-TARGETDURATION:5',
				'#EXT-X-PLAYLIST-TYPE:VOD',
				`#EXT-X-MAP:URI="${SIGNED_URL}",BYTERANGE="${initEnd}@0"`,
				'#EXTINF:4.250,',
				`#EXT-X-BYTERANGE:${frag1.length}@${initEnd}`,
				SIGNED_URL,
				'#EXTINF:4.250,',
				`#EXT-X-BYTERANGE:${dataEnd - secondOffset}@${secondOffset}`,
				SIGNED_URL,
				'#EXT-X-ENDLIST',
				''
			].join('\n')
		);

		const singleEntry = concat(u64(0n), u64(BigInt(initEnd)), new Uint8Array([1, 1, 1]));
		const singleTfra = fullBox('tfra', 1, 0, u32(1), u32(0), u32(1), singleEntry);
		const singleMfra = box('mfra', singleTfra, fullBox('mfro', 0, 0, u32(8 + singleTfra.length + 16)));
		const singleFull = concat(ftyp, moov, frag1, singleMfra);
		expect(fragmentedMp4Playlist(SIGNED_URL, singleFull.subarray(0, initEnd + 8), singleFull.length, singleMfra)).toContain('#EXTINF:1.000,\n');
	});
});
