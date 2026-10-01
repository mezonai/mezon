import { parseRecordingParams, recordingParams, withRecordingUser } from './recordingSignal';

describe('recording signal', () => {
	it('reads the params the desktop client sends', () => {
		expect(recordingParams(true)).toBe('{"isRecording":true}');
		expect(parseRecordingParams(recordingParams(false))).toBe(false);
		expect(parseRecordingParams('')).toBeUndefined();
		expect(parseRecordingParams('userId=8')).toBeUndefined();
		expect(parseRecordingParams('{"isRecording":"yes"}')).toBeUndefined();
	});

	it('shows each recorder once until they stop', () => {
		const shown = withRecordingUser([], '8', true);
		expect(shown).toEqual(['8']);
		expect(withRecordingUser(['8'], '8', true)).toBeNull();
		expect(withRecordingUser(['8', '9'], '8', false)).toEqual(['9']);
		expect(withRecordingUser(['9'], '8', false)).toBeNull();
	});
});
