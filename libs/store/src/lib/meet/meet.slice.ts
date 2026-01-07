import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { HandleParticipantMeetStateEvent } from 'mezon-js';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, getMezonCtx, type MezonMessage } from '../helpers';

type generateMeetTokenPayload = {
	channelId: string;
	roomName: string;
};

const generateMeetTokenCached = async (mezon: MezonValueContext, channelId: string, roomName: string) => {
	const body: MezonMessage<'mezon.api.GenerateMeetTokenRequest', { channelId: string; roomName: string }> = {
		$typeName: 'mezon.api.GenerateMeetTokenRequest' as const,
		channelId,
		roomName
	};
	return await mezon.client.generateMeetToken(mezon.session, body);
};

export const generateMeetToken = createAsyncThunk('meet/generateMeetToken', async ({ channelId, roomName }: generateMeetTokenPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await generateMeetTokenCached(mezon, channelId, roomName);
		if (!response) {
			return;
		}
		return response.token;
	} catch (error) {
		captureSentryError(error, 'meet/generateMeetToken');
		return thunkAPI.rejectWithValue(error);
	}
});

export const handleParticipantVoiceState = createAsyncThunk(
	'meet/handleParticipantVoiceState',
	async ({ clanId, channelId, displayName, state, roomName }: HandleParticipantMeetStateEvent, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const response = await mezon.socketRef.current?.handleParticipantMeetState(clanId, channelId, displayName, state, roomName);
			return response;
		} catch (error) {
			captureSentryError(error, 'meet/handleParticipantMeetState');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
