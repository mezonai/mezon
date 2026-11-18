const OPUS_REQUIRED_PARAMS: ReadonlyArray<readonly [string, string]> = [
	['stereo', '1'],
	['sprop-stereo', '1'],
	['maxaveragebitrate', '128000']
];

function fmtpParam(fmtp: string | undefined, key: string): string | undefined {
	if (!fmtp) return undefined;
	const wantedKey = key.toLowerCase();
	for (const part of fmtp.split(';')) {
		const trimmed = part.trim();
		const eqIdx = trimmed.indexOf('=');
		if (eqIdx < 0) continue;
		const k = trimmed.slice(0, eqIdx).trim().toLowerCase();
		if (k === wantedKey) {
			return trimmed.slice(eqIdx + 1).trim();
		}
	}
	return undefined;
}

function isConstrainedBaseline(codec: RTCRtpCodec): boolean {
	const profileLevelId = fmtpParam(codec.sdpFmtpLine, 'profile-level-id');
	return profileLevelId !== undefined && profileLevelId.toLowerCase() === '42e01f';
}

export function h264Preferences(codecs: RTCRtpCodec[]): RTCRtpCodec[] {
	const baseline: RTCRtpCodec[] = [];
	const others: RTCRtpCodec[] = [];
	for (const codec of codecs) {
		if (codec.mimeType.toLowerCase() !== 'video/h264') continue;
		if (fmtpParam(codec.sdpFmtpLine, 'packetization-mode') !== '1') continue;
		if (isConstrainedBaseline(codec)) {
			baseline.push(codec);
		} else {
			others.push(codec);
		}
	}
	return [...baseline, ...others];
}

function ensureOpusParams(existing: string): { updated: string; changed: boolean } {
	const parts = existing
		.split(';')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
	let changed = false;

	for (const [key, value] of OPUS_REQUIRED_PARAMS) {
		const wanted = `${key}=${value}`;
		const wantedKey = key.toLowerCase();
		const existingIdx = parts.findIndex((part) => {
			const eqIdx = part.indexOf('=');
			if (eqIdx < 0) return false;
			return part.slice(0, eqIdx).trim().toLowerCase() === wantedKey;
		});
		if (existingIdx >= 0) {
			const eqIdx = parts[existingIdx].indexOf('=');
			const currentValue = parts[existingIdx].slice(eqIdx + 1).trim();
			if (currentValue !== value) {
				parts[existingIdx] = wanted;
				changed = true;
			}
		} else {
			parts.push(wanted);
			changed = true;
		}
	}

	return { updated: parts.join(';'), changed };
}

function mungeSection(section: string[]): boolean {
	const opusPts: string[] = [];
	for (const line of section) {
		if (!line.startsWith('a=rtpmap:')) continue;
		const rest = line.slice('a=rtpmap:'.length);
		const spaceIdx = rest.indexOf(' ');
		if (spaceIdx < 0) continue;
		const pt = rest.slice(0, spaceIdx).trim();
		const codec = rest.slice(spaceIdx + 1).trim();
		if (codec.toLowerCase() === 'opus/48000/2' && pt.length > 0) {
			opusPts.push(pt);
		}
	}

	if (opusPts.length === 0) return false;

	let changed = false;
	for (const pt of opusPts) {
		const fmtpPrefix = `a=fmtp:${pt} `;
		const bareFmtp = `a=fmtp:${pt}`;
		const fmtpIdx = section.findIndex((line) => line.startsWith(fmtpPrefix) || line === bareFmtp);
		if (fmtpIdx >= 0) {
			const existing = section[fmtpIdx].startsWith(fmtpPrefix) ? section[fmtpIdx].slice(fmtpPrefix.length).trim() : '';
			const res = ensureOpusParams(existing);
			if (res.changed) {
				section[fmtpIdx] = `${fmtpPrefix}${res.updated}`;
				changed = true;
			}
		} else {
			const rtpmapPrefix = `a=rtpmap:${pt} `;
			const rtpmapIdx = section.findIndex((line) => line.startsWith(rtpmapPrefix));
			if (rtpmapIdx >= 0) {
				const res = ensureOpusParams('');
				section.splice(rtpmapIdx + 1, 0, `${fmtpPrefix}${res.updated}`);
				changed = true;
			}
		}
	}
	return changed;
}

export function mungeOpusStereo(sdp: string): string {
	const session: string[] = [];
	const media: string[][] = [];

	for (const raw of sdp.split('\n')) {
		const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
		if (line.length === 0) continue;
		if (line.startsWith('m=')) {
			media.push([line]);
		} else if (media.length > 0) {
			media[media.length - 1].push(line);
		} else {
			session.push(line);
		}
	}

	let changed = false;
	for (const section of media) {
		if (mungeSection(section)) {
			changed = true;
		}
	}

	if (!changed && sdp.includes('\r\n') && sdp.endsWith('\r\n')) {
		return sdp;
	}

	const allLines = [...session];
	for (const section of media) {
		allLines.push(...section);
	}
	return allLines.length > 0 ? `${allLines.join('\r\n')}\r\n` : '';
}
