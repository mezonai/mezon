import { TypeMessage } from '../types';

const LOCATION_MAP_PREVIEW_ZOOM = 15;
const LOCATION_MAP_TILE_ROOT = 'https://tile.openstreetmap.org';
const MAP_TILE_PX = 256;
const MAX_MERCATOR_LATITUDE = 85.05112878;
const NUMERIC_COORD_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export interface ParsedLocation {
	latitude: number;
	longitude: number;
	mapsUrl: string;
}

export interface LocationMapTile {
	url: string;
	left: number;
	top: number;
}

export interface LocationMapPreview {
	tiles: LocationMapTile[];
	offsetX: number;
	offsetY: number;
}

function buildLocationMapsUrl(latitude: number, longitude: number): string {
	return `https://www.google.com/maps?q=${latitude},${longitude}&z=14&t=m&mapclient=embed`;
}

function isGoogleMapsUrl(text: string): boolean {
	if (!text.startsWith('https://')) {
		return false;
	}
	const rest = text.slice('https://'.length);
	const boundaryMatch = /[/?#]/.exec(rest);
	const hostEnd = boundaryMatch ? boundaryMatch.index : rest.length;
	const authority = rest.slice(0, hostEnd);
	const atIndex = authority.lastIndexOf('@');
	const hostWithPort = atIndex >= 0 ? authority.slice(atIndex + 1) : authority;
	const colonIndex = hostWithPort.indexOf(':');
	const host = (colonIndex >= 0 ? hostWithPort.slice(0, colonIndex) : hostWithPort).toLowerCase();
	const path = rest.slice(hostEnd);
	if (host === 'maps.google.com') {
		return true;
	}
	return (host === 'www.google.com' || host === 'google.com') && path.startsWith('/maps');
}

function parseGoogleMapsCoordinates(text: string): [number, number] | null {
	const qIdx = text.indexOf('q=');
	if (qIdx === -1) {
		return null;
	}
	const rest = text.slice(qIdx + 2);
	const endMatch = /[&\s]/.exec(rest);
	const coords = endMatch ? rest.slice(0, endMatch.index) : rest;
	const parts = coords.split(',');
	if (parts.length !== 2) {
		return null;
	}
	const [latStr, lonStr] = parts;
	if (!NUMERIC_COORD_PATTERN.test(latStr) || !NUMERIC_COORD_PATTERN.test(lonStr)) {
		return null;
	}
	const latitude = Number(latStr);
	const longitude = Number(lonStr);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}
	if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
		return null;
	}
	return [latitude, longitude];
}

export function parseLocationFromMessage(code: number | undefined, text: string | undefined): ParsedLocation | null {
	if (!text) {
		return null;
	}
	const trimmed = text.trim();
	if (!trimmed) {
		return null;
	}
	if (code !== TypeMessage.Location) {
		if (!trimmed.startsWith('https://') || /\s/.test(trimmed) || !isGoogleMapsUrl(trimmed)) {
			return null;
		}
	}
	const coords = parseGoogleMapsCoordinates(trimmed);
	if (!coords) {
		return null;
	}
	const [latitude, longitude] = coords;
	return {
		latitude,
		longitude,
		mapsUrl: buildLocationMapsUrl(latitude, longitude)
	};
}

export function buildLocationMapPreview(latitude: number, longitude: number): LocationMapPreview {
	const clampedLat = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
	const scale = 2 ** LOCATION_MAP_PREVIEW_ZOOM;
	const xTileFloat = ((longitude + 180) / 360) * scale;
	const latRad = (clampedLat * Math.PI) / 180;
	const yTileFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
	const worldX = xTileFloat * MAP_TILE_PX;
	const worldY = yTileFloat * MAP_TILE_PX;
	const centerX = Math.floor(xTileFloat);
	const centerY = Math.floor(yTileFloat);
	const originX = Math.max(0, centerX - 1);
	const originY = Math.max(0, centerY - 1);
	const tiles: LocationMapTile[] = [];
	for (let row = 0; row < 3; row += 1) {
		for (let col = 0; col < 3; col += 1) {
			tiles.push({
				url: `${LOCATION_MAP_TILE_ROOT}/${LOCATION_MAP_PREVIEW_ZOOM}/${originX + col}/${originY + row}.png`,
				left: col * MAP_TILE_PX,
				top: row * MAP_TILE_PX
			});
		}
	}
	return {
		tiles,
		offsetX: worldX - originX * MAP_TILE_PX,
		offsetY: worldY - originY * MAP_TILE_PX
	};
}
