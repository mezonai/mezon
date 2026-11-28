import { TypeMessage } from '../types';
import { buildLocationMapPreview, parseLocationFromMessage } from './location';

jest.mock('mezon-js', () => ({
	NotificationType: {}
}));

describe('parseLocationFromMessage', () => {
	it('parses code 17 location message with desktop payload link', () => {
		const text = 'https://www.google.com/maps?q=18.6734,105.6923&z=14&t=m&mapclient=embed';
		expect(parseLocationFromMessage(TypeMessage.Location, text)).toEqual({
			latitude: 18.6734,
			longitude: 105.6923,
			mapsUrl: 'https://www.google.com/maps?q=18.6734,105.6923&z=14&t=m&mapclient=embed'
		});
	});

	it('parses code 17 location message with extra params and rebuilds mapsUrl', () => {
		const text = 'https://www.google.com/maps?hl=vi&q=21.0285,105.8542&foo=bar&evil=1';
		expect(parseLocationFromMessage(TypeMessage.Location, text)).toEqual({
			latitude: 21.0285,
			longitude: 105.8542,
			mapsUrl: 'https://www.google.com/maps?q=21.0285,105.8542&z=14&t=m&mapclient=embed'
		});
	});

	it('parses code 0 standalone Google Maps link across allowed hosts', () => {
		expect(parseLocationFromMessage(TypeMessage.Chat, '  https://www.google.com/maps?q=21.0285,105.8542&z=14  ')).toEqual({
			latitude: 21.0285,
			longitude: 105.8542,
			mapsUrl: 'https://www.google.com/maps?q=21.0285,105.8542&z=14&t=m&mapclient=embed'
		});
		expect(parseLocationFromMessage(TypeMessage.Chat, 'https://google.com/maps?q=-33.8688,151.2093')).toEqual({
			latitude: -33.8688,
			longitude: 151.2093,
			mapsUrl: 'https://www.google.com/maps?q=-33.8688,151.2093&z=14&t=m&mapclient=embed'
		});
		expect(parseLocationFromMessage(TypeMessage.Chat, 'https://maps.google.com/?q=10.7769,106.7009')).toEqual({
			latitude: 10.7769,
			longitude: 106.7009,
			mapsUrl: 'https://www.google.com/maps?q=10.7769,106.7009&z=14&t=m&mapclient=embed'
		});
	});

	it('returns null for code 0 Google Maps link inside surrounding text', () => {
		expect(parseLocationFromMessage(TypeMessage.Chat, 'Meet me here https://www.google.com/maps?q=21.0285,105.8542')).toBeNull();
	});

	it('returns null for disallowed hosts and non-https schemes on non-location codes', () => {
		expect(parseLocationFromMessage(TypeMessage.Chat, 'https://evil.com/maps?q=1,2')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Chat, 'http://www.google.com/maps?q=1,2')).toBeNull();
	});

	it('returns null for out-of-range or non-finite coordinates', () => {
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=91,105')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=-91,105')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=18,181')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=18,-181')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=NaN,105')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=18,Infinity')).toBeNull();
		expect(parseLocationFromMessage(TypeMessage.Location, 'https://www.google.com/maps?q=abc,105')).toBeNull();
	});
});

describe('buildLocationMapPreview', () => {
	it('builds a 3x3 grid centered on the zoom 15 tile with offsets inside [0, 768)', () => {
		const preview = buildLocationMapPreview(18.6734, 105.6923);
		expect(preview.tiles).toHaveLength(9);
		expect(preview.tiles[0]).toEqual({
			url: 'https://tile.openstreetmap.org/15/26003/14652.png',
			left: 0,
			top: 0
		});
		expect(preview.tiles[4]).toEqual({
			url: 'https://tile.openstreetmap.org/15/26004/14653.png',
			left: 256,
			top: 256
		});
		expect(preview.tiles[8]).toEqual({
			url: 'https://tile.openstreetmap.org/15/26005/14654.png',
			left: 512,
			top: 512
		});
		expect(preview.offsetX).toBeGreaterThanOrEqual(0);
		expect(preview.offsetX).toBeLessThan(768);
		expect(preview.offsetY).toBeGreaterThanOrEqual(0);
		expect(preview.offsetY).toBeLessThan(768);
	});
});
