import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiGetOverrideEveryoneChannelResponse, ApiSetOverrideEveryoneChannelRequest } from 'mezon-js';
import { EveryoneChannelExcludeType } from 'mezon-js';
import { Reader } from 'protobufjs/minimal';
import { ensureSession, getMezonCtx } from '../helpers';

type ChannelTarget = { clanId: string; channelId: string };
export type EveryoneExcludeKind = 'users' | 'roles';
type SetEveryoneArgs = ChannelTarget & {
	override: boolean;
	userIds?: string[];
	roleIds?: string[];
	excludeType?: EveryoneExcludeKind;
};
type PermissionError = { message: string; code?: string | number; status?: number; serverCode?: number; payloadBytes?: number };

const readStatus = (bytes: Uint8Array): { message: string; code?: number } | undefined => {
	const reader = Reader.create(bytes);
	let code: number | undefined;
	let message = '';
	while (reader.pos < reader.len) {
		const tag = reader.uint32();
		if (tag === 8) code = reader.int32();
		else if (tag === 18) message = reader.string();
		else reader.skipType(tag & 7);
	}
	return message.trim() ? { code, message } : undefined;
};

const tryDecode = <T>(run: () => T): T | undefined => {
	try {
		return run();
	} catch {
		return undefined;
	}
};

const decodeErrorBody = (bytes: Uint8Array): { message: string; code?: number } | undefined => {
	const fromEnvelope = tryDecode(() => {
		const reader = Reader.create(bytes);
		while (reader.pos < reader.len) {
			const tag = reader.uint32();
			if (tag === 98) {
				const status = readStatus(reader.bytes());
				if (status) return status;
			} else reader.skipType(tag & 7);
		}
		return undefined;
	});
	if (fromEnvelope) return fromEnvelope;

	const fromStatus = tryDecode(() => readStatus(bytes));
	if (fromStatus) return fromStatus;

	return tryDecode(() => {
		const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
		if (text && !Array.from(text).some((character) => character.charCodeAt(0) < 32 && ![9, 10, 13].includes(character.charCodeAt(0)))) {
			try {
				const body = JSON.parse(text);
				if (typeof body.message === 'string' && body.message.trim()) return { message: body.message };
			} catch {
				return { message: text };
			}
		}
		return undefined;
	});
};

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {});

const asBytes = (value: unknown): Uint8Array | undefined => {
	if (value instanceof Uint8Array) return value;
	if (Array.isArray(value) && value.every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 255)) return Uint8Array.from(value);
	return undefined;
};

const permissionError = (error: unknown): PermissionError => {
	const outer = asRecord(error);
	const inner = asRecord(outer.error);
	const payload = asBytes(outer.message) ?? asBytes(inner.message);
	const decoded = payload ? decodeErrorBody(payload) : undefined;
	const message =
		[inner.message, outer.message, decoded?.message, outer.error, error, outer.statusText].find(
			(value): value is string => typeof value === 'string' && value.trim().length > 0
		) ?? 'Public channel permission request failed.';
	const code = inner.code ?? outer.code;
	return {
		message,
		code: typeof code === 'string' || typeof code === 'number' ? code : undefined,
		status: typeof outer.status === 'number' ? outer.status : undefined,
		serverCode: decoded?.code,
		payloadBytes: payload?.byteLength
	};
};

export const fetchOverrideEveryoneChannel = createAsyncThunk<ApiGetOverrideEveryoneChannelResponse, ChannelTarget, { rejectValue: PermissionError }>(
	'channelPermissions/fetchOverrideEveryoneChannel',
	async ({ clanId, channelId }, thunkAPI) => {
		const request = { clan_id: clanId, channel_id: channelId };
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			return await mezon.client.getOverrideEveryoneChannel(mezon.session, request);
		} catch (error) {
			return thunkAPI.rejectWithValue(permissionError(error));
		}
	}
);

export const setOverrideEveryoneChannel = createAsyncThunk<ChannelTarget & { override: boolean }, SetEveryoneArgs, { rejectValue: PermissionError }>(
	'channelPermissions/setOverrideEveryoneChannel',
	async ({ clanId, channelId, override, userIds = [], roleIds = [], excludeType }, thunkAPI) => {
		const users = userIds.filter((id) => id && id !== '0');
		const roles = roleIds.filter((id) => id && id !== '0');
		const useRoles = override && (excludeType === 'roles' || (excludeType === undefined && users.length === 0 && roles.length > 0));
		const request: ApiSetOverrideEveryoneChannelRequest = {
			clan_id: clanId,
			channel_id: channelId,
			override,
			exclude_type: useRoles
				? EveryoneChannelExcludeType.EVERYONE_CHANNEL_EXCLUDE_TYPE_ROLE
				: EveryoneChannelExcludeType.EVERYONE_CHANNEL_EXCLUDE_TYPE_USER,
			exclude_ids: override ? (useRoles ? roles : users) : []
		};
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.setOverrideEveryoneChannel(mezon.session, request);
			return { clanId, channelId, override };
		} catch (error) {
			return thunkAPI.rejectWithValue(permissionError(error));
		}
	}
);
