import { describe, expect, it } from '@jest/globals';
import { mungeVideoSectionBitrate } from './videoBitrate';

const hints = 'x-google-min-bitrate=400;x-google-start-bitrate=1000;x-google-max-bitrate=3500';

describe('screen share SDP bitrate hints', () => {
	it('configures VP9 while retaining its profile and RTX association', () => {
		const sdp =
			'm=video 9 UDP/TLS/RTP/SAVPF 98 99\r\na=mid:2\r\na=rtpmap:98 VP9/90000\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\n';
		const result = mungeVideoSectionBitrate(sdp, 400, 1000, 3500);
		expect(result).toContain(`a=fmtp:98 profile-id=0;${hints}\r\n`);
		expect(result).toContain('a=fmtp:99 apt=98\r\n');
		expect(result).toContain('a=mid:2\r\n');
		expect(result.match(/x-google-start-bitrate/g)).toHaveLength(1);
	});

	it('adds an fmtp line when VP9 has none, preserving SDP line endings', () => {
		const sdp = 'a=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 nack\r\n';
		expect(mungeVideoSectionBitrate(sdp, 400, 1000, 3500)).toBe(`a=rtpmap:98 VP9/90000\r\na=fmtp:98 ${hints}\r\na=rtcp-fb:98 nack\r\n`);
	});

	it('updates hints without duplication when a codec is negotiated again', () => {
		const sdp =
			'a=rtpmap:98 VP9/90000\r\na=fmtp:98 profile-id=0;x-google-min-bitrate=100;x-google-start-bitrate=300;x-google-max-bitrate=1000\r\n';
		const result = mungeVideoSectionBitrate(sdp, 400, 1000, 3500);
		expect(result).toContain(`a=fmtp:98 profile-id=0;${hints}\r\n`);
		expect(mungeVideoSectionBitrate(result, 400, 1000, 3500)).toBe(result);
	});

	it('retains VP8 support without adding video hints to audio or repair codecs', () => {
		const sdp =
			'a=rtpmap:96 VP8/90000\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 useinbandfec=1\r\n';
		const result = mungeVideoSectionBitrate(sdp, 250, 500, 1000);
		expect(result).toContain('a=fmtp:96 x-google-min-bitrate=250;x-google-start-bitrate=500;x-google-max-bitrate=1000\r\n');
		expect(result).toContain('a=fmtp:97 apt=96\r\n');
		expect(result).toContain('a=fmtp:111 useinbandfec=1\r\n');
		expect(result.match(/x-google-start-bitrate/g)).toHaveLength(1);
	});
});
