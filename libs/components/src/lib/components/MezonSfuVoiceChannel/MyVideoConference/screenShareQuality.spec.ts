import { describe, expect, it, jest } from '@jest/globals';
import { getScreenShareConstraints, updateScreenShareQuality } from './screenShareQuality';

const createMedia = () => {
	let constraints = getScreenShareConstraints('text');
	let parameters = {
		transactionId: 'negotiated-transaction',
		codecs: [{ mimeType: 'video/VP9' }],
		encodings: [{ rid: 'screen', active: true, maxFramerate: 5 }]
	};
	const track = {
		readyState: 'live',
		contentHint: 'detail',
		getConstraints: () => constraints,
		applyConstraints: jest.fn(async (next: MediaTrackConstraints) => {
			constraints = next;
		}),
		stop: jest.fn()
	};
	const sender = {
		getParameters: () => JSON.parse(JSON.stringify(parameters)),
		setParameters: jest.fn(async (next: typeof parameters) => {
			parameters = next;
		}),
		replaceTrack: jest.fn()
	};
	const changeMode = (mode: 'text' | 'video') =>
		updateScreenShareQuality(track as unknown as MediaStreamTrack, sender as unknown as RTCRtpSender, mode);
	return { track, sender, changeMode };
};

describe('screen share quality changes', () => {
	it('switches a live share to video and back without replacing or stopping its track', async () => {
		const { track, sender, changeMode } = createMedia();
		await changeMode('video');
		expect(track.getConstraints().frameRate).toEqual({ ideal: 30, max: 30 });
		expect(track.contentHint).toBe('motion');
		expect(sender.getParameters()).toMatchObject({
			transactionId: 'negotiated-transaction',
			codecs: [{ mimeType: 'video/VP9' }],
			degradationPreference: 'maintain-framerate',
			encodings: [{ rid: 'screen', active: true, maxFramerate: 30, maxBitrate: 3_500_000 }]
		});
		await changeMode('text');
		expect(track.getConstraints().frameRate).toEqual({ ideal: 5, max: 5 });
		expect(track.contentHint).toBe('detail');
		expect(sender.getParameters()).toMatchObject({
			degradationPreference: 'maintain-resolution',
			encodings: [{ maxFramerate: 5 }]
		});
		expect(track.stop).not.toHaveBeenCalled();
		expect(sender.replaceTrack).not.toHaveBeenCalled();
	});

	it('leaves the encoder and content hint unchanged if capture rejects the mode', async () => {
		const { track, sender, changeMode } = createMedia();
		track.applyConstraints.mockRejectedValueOnce(new Error('Capture rejected'));
		await expect(changeMode('video')).rejects.toThrow('Capture rejected');
		expect(sender.setParameters).not.toHaveBeenCalled();
		expect(track.contentHint).toBe('detail');
		expect(track.getConstraints().frameRate).toEqual({ ideal: 5, max: 5 });
	});

	it('restores the previous capture constraints when encoder reconfiguration fails', async () => {
		const { track, sender, changeMode } = createMedia();
		sender.setParameters.mockRejectedValueOnce(new Error('Encoder rejected'));
		await expect(changeMode('video')).rejects.toThrow('Encoder rejected');
		expect(track.getConstraints()).toEqual(getScreenShareConstraints('text'));
		expect(track.contentHint).toBe('detail');
		expect(track.stop).not.toHaveBeenCalled();
		await changeMode('video');
		expect(track.contentHint).toBe('motion');
	});

	it('does not try to restore capture when the user stops sharing during a mode change', async () => {
		const { track, sender, changeMode } = createMedia();
		sender.setParameters.mockImplementationOnce(async () => {
			track.readyState = 'ended';
			throw new Error('Share ended');
		});
		await expect(changeMode('video')).rejects.toThrow('Share ended');
		expect(track.applyConstraints).toHaveBeenCalledTimes(1);
		expect(track.stop).not.toHaveBeenCalled();
	});
});
