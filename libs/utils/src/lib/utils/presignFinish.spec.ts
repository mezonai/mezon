import {
	PRESIGN_INGEST_PENDING_MAX_AGE_SEC,
	PRESIGN_PENDING_MAX_AGE_SEC,
	filterExpiredPresignAttachments,
	getPresignExpiryDelayMs,
	isPresignIngestAttachment,
	mergePresignFinishContent,
	parsePresignIngestKeys,
	shouldHidePresignAttachment,
	withoutPresignMarkers
} from './presignFinish';

jest.mock('mezon-js', () => ({
	safeJSONParse: (value: unknown) => {
		if (typeof value !== 'string') return value ?? { t: value };
		try {
			return JSON.parse(value);
		} catch {
			return { t: value };
		}
	}
}));

const VIDEO = 'https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000002001_clip.mp4?1791900000-c2lnbmF0dXJl';
const PHOTO = 'https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000003001_photo.png';
const CREATED = 1_793_000_000;

it('reads the presign_ingest keys with the key form of presign_finish', () => {
	expect(parsePresignIngestKeys({ presign_finish: [], presign_ingest: ['1846031000000002001_clip'] })).toEqual(['1846031000000002001_clip']);
	expect(parsePresignIngestKeys('{"presign_ingest":["0000000000031031/1846031000000002001_clip.mp4",7]}')).toEqual(['1846031000000002001_clip']);
	expect(parsePresignIngestKeys({ presign_finish: [] })).toEqual([]);
	expect(parsePresignIngestKeys('plain text')).toEqual([]);
	expect(parsePresignIngestKeys(undefined)).toEqual([]);
});

it('matches an attachment to the marker as presign_finish does, whatever its signature', () => {
	const keys = parsePresignIngestKeys({ presign_ingest: ['1846031000000002001_clip'] });
	expect(isPresignIngestAttachment(VIDEO, keys)).toBe(true);
	expect(isPresignIngestAttachment(VIDEO.split('?')[0], keys)).toBe(true);
	expect(isPresignIngestAttachment(PHOTO, keys)).toBe(false);
	expect(isPresignIngestAttachment('blob:https://mezon.ai/0b6f', keys)).toBe(false);
	expect(isPresignIngestAttachment(undefined, keys)).toBe(false);
	expect(isPresignIngestAttachment(VIDEO, [])).toBe(false);
});

it('keeps a pending attachment named in presign_ingest for 24 hours instead of 10 minutes', () => {
	const content = { presign_finish: [], presign_ingest: ['1846031000000002001_clip'] };
	const attachments = [{ url: VIDEO }, { url: PHOTO }];
	const message = { content, create_time_seconds: CREATED };

	const afterTenMinutes = CREATED + PRESIGN_PENDING_MAX_AGE_SEC;
	expect(filterExpiredPresignAttachments(attachments, content, CREATED, afterTenMinutes - 1)).toEqual(attachments);
	expect(filterExpiredPresignAttachments(attachments, content, CREATED, afterTenMinutes)).toEqual([{ url: VIDEO }]);
	expect(shouldHidePresignAttachment(VIDEO, message, afterTenMinutes)).toBe(false);
	expect(shouldHidePresignAttachment(PHOTO, message, afterTenMinutes)).toBe(true);

	const afterADay = CREATED + PRESIGN_INGEST_PENDING_MAX_AGE_SEC;
	expect(PRESIGN_INGEST_PENDING_MAX_AGE_SEC).toBe(24 * 60 * 60);
	expect(filterExpiredPresignAttachments(attachments, content, CREATED, afterADay - 1)).toEqual([{ url: VIDEO }]);
	expect(filterExpiredPresignAttachments(attachments, content, CREATED, afterADay)).toEqual([]);
	expect(shouldHidePresignAttachment(VIDEO, message, afterADay)).toBe(true);

	const finished = { presign_finish: ['1846031000000002001_clip'], presign_ingest: ['1846031000000002001_clip'] };
	expect(shouldHidePresignAttachment(VIDEO, { content: finished, create_time_seconds: CREATED }, afterADay)).toBe(false);
});

it('keeps the 10 minute rule for a message without the marker', () => {
	const content = { presign_finish: [] };
	expect(filterExpiredPresignAttachments([{ url: VIDEO }], content, CREATED, CREATED + PRESIGN_PENDING_MAX_AGE_SEC)).toEqual([]);
	expect(shouldHidePresignAttachment(VIDEO, { content, create_time_seconds: CREATED }, CREATED + PRESIGN_PENDING_MAX_AGE_SEC)).toBe(true);
});

it('counts the expiry delay from the given age', () => {
	expect(getPresignExpiryDelayMs(CREATED, CREATED * 1000)).toBe(PRESIGN_PENDING_MAX_AGE_SEC * 1000);
	expect(getPresignExpiryDelayMs(CREATED, CREATED * 1000, PRESIGN_INGEST_PENDING_MAX_AGE_SEC)).toBe(PRESIGN_INGEST_PENDING_MAX_AGE_SEC * 1000);
	expect(getPresignExpiryDelayMs(CREATED, (CREATED + PRESIGN_INGEST_PENDING_MAX_AGE_SEC) * 1000, PRESIGN_INGEST_PENDING_MAX_AGE_SEC)).toBe(0);
	expect(getPresignExpiryDelayMs(undefined, 0, PRESIGN_INGEST_PENDING_MAX_AGE_SEC)).toBeNull();
});

describe('merging an edit', () => {
	const existing = { t: 'look', presign_finish: [], presign_ingest: ['1846031000000002001_clip'] };

	it('carries the marker and the finished keys over an edit that has neither', () => {
		expect(mergePresignFinishContent(existing, { t: 'look again' })).toEqual({
			t: 'look again',
			presign_finish: [],
			presign_ingest: ['1846031000000002001_clip']
		});
		expect(JSON.parse(mergePresignFinishContent(JSON.stringify(existing), '{"t":"again"}') as string)).toEqual({
			t: 'again',
			presign_finish: [],
			presign_ingest: ['1846031000000002001_clip']
		});
	});

	it('merges the keys of the presign_finish edit with the marker it carries', () => {
		expect(
			mergePresignFinishContent(existing, {
				t: 'look',
				presign_finish: ['1846031000000002001_clip'],
				presign_ingest: ['1846031000000002001_clip']
			})
		).toEqual({ t: 'look', presign_finish: ['1846031000000002001_clip'], presign_ingest: ['1846031000000002001_clip'] });
		expect(mergePresignFinishContent(existing, { presign_finish: ['1846031000000002001_clip'] })).toEqual({
			presign_finish: ['1846031000000002001_clip'],
			presign_ingest: ['1846031000000002001_clip']
		});
		expect(mergePresignFinishContent(existing, { presign_ingest: ['1846031000000004001_other'] })).toEqual({
			presign_finish: [],
			presign_ingest: ['1846031000000002001_clip', '1846031000000004001_other']
		});
	});

	it('leaves an edit alone when neither side has keys', () => {
		const incoming = { t: 'plain' };
		expect(mergePresignFinishContent({ t: 'old' }, incoming)).toBe(incoming);
		expect(mergePresignFinishContent({ t: 'old' }, 'not json')).toBe('not json');
	});
});

it('drops both markers from forwarded content and keeps the rest', () => {
	const content = { t: 'look', mk: [{ s: 0, e: 4 }], presign_finish: ['1846031000000002001_clip'], presign_ingest: ['1846031000000002001_clip'] };
	expect(withoutPresignMarkers(content)).toEqual({ t: 'look', mk: [{ s: 0, e: 4 }] });
	expect(content.presign_ingest).toEqual(['1846031000000002001_clip']);
});
