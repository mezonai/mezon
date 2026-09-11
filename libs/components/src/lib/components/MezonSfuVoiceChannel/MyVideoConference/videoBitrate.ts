export const mungeVideoSectionBitrate = (section: string, minKbps: number, startKbps: number, maxKbps: number) => {
	const pts = new Set<string>();
	for (const m of section.matchAll(/^a=rtpmap:(\d+) (?:VP8|VP9)\//gim)) {
		pts.add(m[1]);
	}
	let out = section;
	for (const pt of pts) {
		const fmtpRe = new RegExp(`^a=fmtp:${pt} (.*)$`, 'm');
		const extras = `x-google-min-bitrate=${minKbps};x-google-start-bitrate=${startKbps};x-google-max-bitrate=${maxKbps}`;
		if (fmtpRe.test(out)) {
			out = out.replace(fmtpRe, (_line, rest) => {
				const cleaned = rest.replace(/;?\s*x-google-(?:min|start|max)-bitrate=\d+/gi, '').replace(/^;|;$/g, '');
				return `a=fmtp:${pt} ${cleaned ? `${cleaned};` : ''}${extras}`;
			});
		} else {
			const rtpmapRe = new RegExp(`^(a=rtpmap:${pt} .*)$`, 'm');
			out = out.replace(rtpmapRe, `$1\r\na=fmtp:${pt} ${extras}`);
		}
	}
	return out;
};
