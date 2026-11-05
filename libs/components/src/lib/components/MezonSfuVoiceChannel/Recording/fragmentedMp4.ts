export interface Mp4Finalization {
	headOffset: number;
	head: Uint8Array;
	tail: Uint8Array;
}

const MAX_BUFFERED_BOX_BYTES = 16 * 1024 * 1024;
const MAX_U32 = 0xffffffffn;
const MAX_U64 = 0xffffffffffffffffn;

interface MvhdInfo {
	version: number;
	timescale: number;
	durationOffset: number;
}

interface FragmentEntry {
	time: bigint;
	moofOffset: number;
	trafIndex: number;
}

interface TrackState {
	id: number;
	timescale: number;
	end: bigint;
	fragments: FragmentEntry[];
}

function readU32(buf: Uint8Array, offset: number): number {
	return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function readU64(buf: Uint8Array, offset: number): bigint {
	const hi = BigInt(readU32(buf, offset));
	const lo = BigInt(readU32(buf, offset + 4));
	return (hi << 32n) | lo;
}

function readFourCC(buf: Uint8Array, offset: number): string {
	return String.fromCharCode(buf[offset], buf[offset + 1], buf[offset + 2], buf[offset + 3]);
}

function writeFourCC(buf: Uint8Array, offset: number, fourcc: string): void {
	buf[offset] = fourcc.charCodeAt(0);
	buf[offset + 1] = fourcc.charCodeAt(1);
	buf[offset + 2] = fourcc.charCodeAt(2);
	buf[offset + 3] = fourcc.charCodeAt(3);
}

function writeDuration(view: DataView, offset: number, version: number, value: bigint): boolean {
	if (value < 0n) return false;
	if (version === 0) {
		if (value > MAX_U32) return false;
		view.setUint32(offset, Number(value), false);
		return true;
	}
	if (version === 1) {
		if (value > MAX_U64) return false;
		view.setBigUint64(offset, value, false);
		return true;
	}
	return false;
}

function walkChildBoxes(buf: Uint8Array, start: number, end: number, visit: (type: string, bodyStart: number, boxEnd: number) => boolean): boolean {
	let off = start;
	while (off < end) {
		if (off + 8 > end) return false;
		let size = readU32(buf, off);
		const type = readFourCC(buf, off + 4);
		let hdr = 8;
		if (size === 1) {
			if (off + 16 > end) return false;
			const size64 = readU64(buf, off + 8);
			if (size64 < 16n || size64 > BigInt(end - off)) return false;
			size = Number(size64);
			hdr = 16;
		} else if (size === 0) {
			size = end - off;
		} else if (size < 8 || off + size > end) {
			return false;
		}
		if (!visit(type, off + hdr, off + size)) return false;
		off += size;
	}
	return off === end;
}

function scaleRounded(value: bigint, movieTimescale: number, mediaTimescale: number): bigint {
	const num = value * BigInt(movieTimescale);
	const den = BigInt(mediaTimescale);
	return (2n * num + den) / (2n * den);
}

export class FragmentedMp4Indexer {
	private disabled = false;
	private sawFtyp = false;
	private state: 'header' | 'buffer' | 'skip' = 'header';
	private fileOffset = 0;
	private boxOffset = 0;
	private boxType = '';
	private boxHeaderSize = 8;
	private headerBuf = new Uint8Array(16);
	private headerHave = 0;
	private headerNeed = 8;
	private payloadBuf: Uint8Array | null = null;
	private payloadHave = 0;
	private remaining = 0;
	private moovOffset = 0;
	private moovBytes: Uint8Array | null = null;
	private mvhd: MvhdInfo | null = null;
	private tracks: TrackState[] = [];
	private trackById = new Map<number, TrackState>();
	private trexDefaults = new Map<number, number>();

	push(bytes: Uint8Array): void {
		if (this.disabled || bytes.length === 0) return;
		let pos = 0;
		while (pos < bytes.length && !this.disabled) {
			if (this.state === 'header') {
				if (this.headerHave === 0) {
					this.boxOffset = this.fileOffset;
				}
				const take = Math.min(this.headerNeed - this.headerHave, bytes.length - pos);
				this.headerBuf.set(bytes.subarray(pos, pos + take), this.headerHave);
				this.headerHave += take;
				pos += take;
				this.fileOffset += take;
				if (this.headerHave < this.headerNeed) {
					return;
				}
				let boxSize: number;
				if (this.headerNeed === 8) {
					const size32 = readU32(this.headerBuf, 0);
					const type = readFourCC(this.headerBuf, 4);
					if (!this.sawFtyp && type !== 'ftyp') {
						this.disable();
						return;
					}
					this.boxType = type;
					if (size32 === 1) {
						this.headerNeed = 16;
						continue;
					}
					if (size32 === 0 || size32 < 8) {
						this.disable();
						return;
					}
					this.boxHeaderSize = 8;
					boxSize = size32;
				} else {
					const size64 = readU64(this.headerBuf, 8);
					if (size64 < 16n || size64 > BigInt(Number.MAX_SAFE_INTEGER)) {
						this.disable();
						return;
					}
					this.boxHeaderSize = 16;
					boxSize = Number(size64);
				}
				this.sawFtyp = true;
				const bodyBytes = boxSize - this.boxHeaderSize;
				if (this.boxType === 'moov' || this.boxType === 'moof') {
					if (boxSize > MAX_BUFFERED_BOX_BYTES) {
						this.disable();
						return;
					}
					const buf = new Uint8Array(boxSize);
					buf.set(this.headerBuf.subarray(0, this.boxHeaderSize), 0);
					this.payloadBuf = buf;
					this.payloadHave = this.boxHeaderSize;
					this.remaining = bodyBytes;
					this.headerHave = 0;
					this.headerNeed = 8;
					if (bodyBytes === 0) {
						this.completeBufferedBox();
					} else {
						this.state = 'buffer';
					}
				} else {
					this.headerHave = 0;
					this.headerNeed = 8;
					if (bodyBytes > 0) {
						this.remaining = bodyBytes;
						this.state = 'skip';
					}
				}
			} else if (this.state === 'buffer') {
				const take = Math.min(this.remaining, bytes.length - pos);
				this.payloadBuf!.set(bytes.subarray(pos, pos + take), this.payloadHave);
				this.payloadHave += take;
				this.remaining -= take;
				pos += take;
				this.fileOffset += take;
				if (this.remaining === 0) {
					this.state = 'header';
					this.completeBufferedBox();
				}
			} else if (this.state === 'skip') {
				const take = Math.min(this.remaining, bytes.length - pos);
				this.remaining -= take;
				pos += take;
				this.fileOffset += take;
				if (this.remaining === 0) {
					this.state = 'header';
				}
			}
		}
	}

	finish(): Mp4Finalization | null {
		if (this.disabled || !this.sawFtyp || !this.moovBytes || !this.mvhd) return null;
		if (this.state === 'buffer' || this.state === 'skip' || this.headerHave !== 0) return null;
		if (this.tracks.length === 0) return null;
		for (const track of this.tracks) {
			if (track.fragments.length === 0) return null;
		}

		const head = new Uint8Array(this.moovBytes);
		const headView = new DataView(head.buffer, head.byteOffset, head.byteLength);
		const movieTimescale = this.mvhd.timescale;
		let movieDuration = 0n;

		for (const track of this.tracks) {
			const trackMovieDuration = scaleRounded(track.end, movieTimescale, track.timescale);
			if (trackMovieDuration > movieDuration) {
				movieDuration = trackMovieDuration;
			}
		}

		if (!writeDuration(headView, this.mvhd.durationOffset - this.moovOffset, this.mvhd.version, movieDuration)) {
			return null;
		}

		let tfrasSize = 0;
		for (const track of this.tracks) {
			if (BigInt(track.fragments.length) > MAX_U32) return null;
			tfrasSize += 24 + track.fragments.length * 19;
		}
		const mfraSize = 8 + tfrasSize + 16;
		if (BigInt(mfraSize) > MAX_U32) return null;

		const tail = new Uint8Array(mfraSize);
		const tailView = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
		let out = 0;

		tailView.setUint32(out, mfraSize, false);
		writeFourCC(tail, out + 4, 'mfra');
		out += 8;

		for (const track of this.tracks) {
			const tfraSize = 24 + track.fragments.length * 19;
			tailView.setUint32(out, tfraSize, false);
			writeFourCC(tail, out + 4, 'tfra');
			tailView.setUint32(out + 8, 0x01000000, false);
			tailView.setUint32(out + 12, track.id, false);
			tailView.setUint32(out + 16, 0, false);
			tailView.setUint32(out + 20, track.fragments.length, false);
			out += 24;
			for (const frag of track.fragments) {
				tailView.setBigUint64(out, frag.time, false);
				tailView.setBigUint64(out + 8, BigInt(frag.moofOffset), false);
				tail[out + 16] = frag.trafIndex;
				tail[out + 17] = 1;
				tail[out + 18] = 1;
				out += 19;
			}
		}

		tailView.setUint32(out, 16, false);
		writeFourCC(tail, out + 4, 'mfro');
		tailView.setUint32(out + 8, 0, false);
		tailView.setUint32(out + 12, mfraSize, false);

		return { headOffset: this.moovOffset, head, tail };
	}

	private disable(): void {
		this.disabled = true;
		this.payloadBuf = null;
		this.moovBytes = null;
		this.tracks = [];
		this.trackById.clear();
	}

	private completeBufferedBox(): void {
		const buf = this.payloadBuf!;
		this.payloadBuf = null;
		if (this.boxType === 'moov') {
			if (!this.parseMoov(buf, this.boxHeaderSize)) {
				this.disable();
			}
		} else if (this.boxType === 'moof') {
			if (!this.parseMoof(buf, this.boxHeaderSize)) {
				this.disable();
			}
		}
	}

	private parseMoov(buf: Uint8Array, headerSize: number): boolean {
		if (this.moovBytes !== null) return false;
		const moovOffset = this.boxOffset;
		let mvhd: MvhdInfo | null = null;
		const tracks: TrackState[] = [];
		const trackById = new Map<number, TrackState>();

		const ok = walkChildBoxes(buf, headerSize, buf.length, (type, body, end) => {
			if (type === 'mvhd') {
				if (body + 4 > end) return false;
				const version = buf[body];
				if (version !== 0 && version !== 1) return false;
				const minBody = version === 0 ? 20 : 32;
				if (body + minBody > end) return false;
				const timescale = readU32(buf, body + (version === 0 ? 12 : 20));
				if (timescale === 0) return false;
				mvhd = {
					version,
					timescale,
					durationOffset: moovOffset + body + (version === 0 ? 16 : 24)
				};
				return true;
			}
			if (type === 'trak') {
				let tkhd: { id: number } | null = null;
				let mdhd: { timescale: number } | null = null;
				const trakOk = walkChildBoxes(buf, body, end, (childType, childBody, childEnd) => {
					if (childType === 'tkhd') {
						if (childBody + 4 > childEnd) return false;
						const version = buf[childBody];
						if (version !== 0 && version !== 1) return false;
						const minBody = version === 0 ? 24 : 36;
						if (childBody + minBody > childEnd) return false;
						tkhd = { id: readU32(buf, childBody + (version === 0 ? 12 : 20)) };
						return true;
					}
					if (childType === 'mdia') {
						return walkChildBoxes(buf, childBody, childEnd, (mdiaType, mdiaBody, mdiaEnd) => {
							if (mdiaType !== 'mdhd') return true;
							if (mdiaBody + 4 > mdiaEnd) return false;
							const version = buf[mdiaBody];
							if (version !== 0 && version !== 1) return false;
							const minBody = version === 0 ? 20 : 32;
							if (mdiaBody + minBody > mdiaEnd) return false;
							const timescale = readU32(buf, mdiaBody + (version === 0 ? 12 : 20));
							if (timescale === 0) return false;
							mdhd = { timescale };
							return true;
						});
					}
					return true;
				});
				if (!trakOk || !tkhd || !mdhd) return false;
				const foundTkhd = tkhd as { id: number };
				const foundMdhd = mdhd as { timescale: number };
				if (trackById.has(foundTkhd.id)) return false;
				const track: TrackState = {
					id: foundTkhd.id,
					timescale: foundMdhd.timescale,
					end: 0n,
					fragments: []
				};
				tracks.push(track);
				trackById.set(track.id, track);
				return true;
			}
			if (type === 'mvex') {
				return walkChildBoxes(buf, body, end, (mvexType, mvexBody, mvexEnd) => {
					if (mvexType !== 'trex') return true;
					if (mvexBody + 16 > mvexEnd) return false;
					const trackId = readU32(buf, mvexBody + 4);
					const defaultDuration = readU32(buf, mvexBody + 12);
					this.trexDefaults.set(trackId, defaultDuration);
					return true;
				});
			}
			return true;
		});

		if (!ok || !mvhd || tracks.length === 0) return false;
		this.moovOffset = moovOffset;
		this.moovBytes = buf;
		this.mvhd = mvhd;
		this.tracks = tracks;
		this.trackById = trackById;
		return true;
	}

	private parseMoof(buf: Uint8Array, headerSize: number): boolean {
		if (!this.moovBytes) return false;
		const moofOffset = this.boxOffset;
		let trafIndex = 0;

		return walkChildBoxes(buf, headerSize, buf.length, (type, body, end) => {
			if (type !== 'traf') return true;
			trafIndex += 1;
			if (trafIndex > 255) return false;

			let trackId: number | null = null;
			let defaultDuration: number | null = null;
			let base: bigint | null = null;
			let explicitTotal = 0n;
			let defaultSampleCount = 0n;

			const trafOk = walkChildBoxes(buf, body, end, (childType, childBody, childEnd) => {
				if (childType === 'tfhd') {
					if (childBody + 8 > childEnd) return false;
					const flags = readU32(buf, childBody) & 0xffffff;
					trackId = readU32(buf, childBody + 4);
					let p = childBody + 8;
					if (flags & 0x1) p += 8;
					if (flags & 0x2) p += 4;
					if (flags & 0x8) {
						if (p + 4 > childEnd) return false;
						defaultDuration = readU32(buf, p);
						p += 4;
					}
					return p <= childEnd;
				}
				if (childType === 'tfdt') {
					if (childBody + 4 > childEnd) return false;
					const version = buf[childBody];
					if (version === 0) {
						if (childBody + 8 > childEnd) return false;
						base = BigInt(readU32(buf, childBody + 4));
						return true;
					}
					if (version === 1) {
						if (childBody + 12 > childEnd) return false;
						base = readU64(buf, childBody + 4);
						return true;
					}
					return false;
				}
				if (childType === 'trun') {
					if (childBody + 8 > childEnd) return false;
					const flags = readU32(buf, childBody) & 0xffffff;
					const count = readU32(buf, childBody + 4);
					let p = childBody + 8;
					if (flags & 0x1) p += 4;
					if (flags & 0x4) p += 4;
					let perSample = 0;
					if (flags & 0x100) perSample += 4;
					if (flags & 0x200) perSample += 4;
					if (flags & 0x400) perSample += 4;
					if (flags & 0x800) perSample += 4;
					if (p + count * perSample > childEnd) return false;
					if (flags & 0x100) {
						for (let i = 0; i < count; i += 1) {
							explicitTotal += BigInt(readU32(buf, p));
							p += perSample;
						}
					} else {
						defaultSampleCount += BigInt(count);
					}
					return true;
				}
				return true;
			});

			if (!trafOk || trackId === null || base === null) return false;
			const track = this.trackById.get(trackId);
			if (track) {
				const resolvedBase = base as bigint;
				const fallback = BigInt(defaultDuration ?? this.trexDefaults.get(trackId) ?? 0);
				const endMedia = resolvedBase + explicitTotal + defaultSampleCount * fallback;
				track.fragments.push({ time: resolvedBase, moofOffset, trafIndex });
				if (endMedia > track.end) {
					track.end = endMedia;
				}
			}
			return true;
		});
	}
}

export function finalizedMp4Blob(blob: Blob, fin: Mp4Finalization, type: string): Blob {
	return new Blob([blob.slice(0, fin.headOffset), fin.head, blob.slice(fin.headOffset + fin.head.length), fin.tail], { type });
}
