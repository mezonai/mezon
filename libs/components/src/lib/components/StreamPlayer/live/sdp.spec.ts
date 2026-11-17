import { describe, expect, it } from '@jest/globals';
import { h264Preferences, mungeOpusStereo } from './sdp';

const codec = (mimeType: string, sdpFmtpLine?: string): RTCRtpCodec => ({
	mimeType,
	clockRate: 90000,
	...(sdpFmtpLine !== undefined ? { sdpFmtpLine } : {})
});

describe('h264Preferences', () => {
	it('keeps only H264 packetization-mode=1 with 42e01f prioritized and preserves relative order', () => {
		const chromeCapabilities: RTCRtpCodec[] = [
			codec('video/VP8'),
			codec('video/rtx', 'apt=96'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f'),
			codec('video/rtx', 'apt=102'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f'),
			codec('video/h264', 'packetization-mode=1;profile-level-id=42E01F'),
			codec('video/VP9', 'profile-id=0'),
			codec('video/AV1'),
			codec('video/red'),
			codec('video/ulpfec')
		];

		const selected = h264Preferences(chromeCapabilities);

		expect(selected.map((item) => item.sdpFmtpLine)).toEqual([
			'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
			'packetization-mode=1;profile-level-id=42E01F',
			'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f',
			'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f',
			'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f'
		]);
	});

	it('returns empty when no packetization-mode=1 H264 codec is present', () => {
		const capabilities: RTCRtpCodec[] = [
			codec('video/VP8'),
			codec('video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'),
			codec('video/H264'),
			codec('video/rtx', 'apt=96')
		];

		expect(h264Preferences(capabilities)).toEqual([]);
	});
});

describe('mungeOpusStereo', () => {
	it('appends stereo parameters to an existing opus fmtp line and is idempotent with CRLF endings', () => {
		const offer = [
			'v=0',
			'm=audio 9 UDP/TLS/RTP/SAVPF 111 63',
			'a=rtpmap:111 opus/48000/2',
			'a=fmtp:111 minptime=10;useinbandfec=1',
			'a=rtpmap:63 red/48000/2',
			'a=fmtp:63 111/111',
			'm=video 9 UDP/TLS/RTP/SAVPF 96',
			'a=rtpmap:96 H264/90000',
			'a=fmtp:96 packetization-mode=1;profile-level-id=42e01f',
			''
		].join('\r\n');

		const once = mungeOpusStereo(offer);

		expect(once).toContain('a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1;maxaveragebitrate=128000\r\n');
		expect(once).toContain('a=fmtp:63 111/111\r\n');
		expect(once).toContain('a=fmtp:96 packetization-mode=1;profile-level-id=42e01f\r\n');
		expect(once.endsWith('\r\n')).toBe(true);
		expect(
			once
				.split('\n')
				.slice(0, -1)
				.every((line) => line.endsWith('\r'))
		).toBe(true);

		const twice = mungeOpusStereo(once);
		expect(twice).toBe(once);
	});

	it('inserts an fmtp line right after opus rtpmap when none exists', () => {
		const offer = ['v=0', 'm=audio 9 UDP/TLS/RTP/SAVPF 111 0', 'a=rtpmap:111 opus/48000/2', 'a=rtpmap:0 PCMU/8000', 'a=sendonly', ''].join(
			'\r\n'
		);

		const munged = mungeOpusStereo(offer);

		expect(munged).toBe(
			[
				'v=0',
				'm=audio 9 UDP/TLS/RTP/SAVPF 111 0',
				'a=rtpmap:111 opus/48000/2',
				'a=fmtp:111 stereo=1;sprop-stereo=1;maxaveragebitrate=128000',
				'a=rtpmap:0 PCMU/8000',
				'a=sendonly',
				''
			].join('\r\n')
		);
		expect(mungeOpusStereo(munged)).toBe(munged);
	});

	it('leaves non-opus sections untouched', () => {
		const offer = [
			'v=0',
			'm=audio 9 UDP/TLS/RTP/SAVPF 0',
			'a=rtpmap:0 PCMU/8000',
			'm=video 9 UDP/TLS/RTP/SAVPF 96',
			'a=rtpmap:96 H264/90000',
			''
		].join('\r\n');

		expect(mungeOpusStereo(offer)).toBe(offer);
	});
});
