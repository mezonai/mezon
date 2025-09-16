import type { MezonContextValue } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { MmnClient } from 'mmn-client-js';

export type AsyncThunkConfigWithMezon = {
	extra: {
		mezon: MezonContextValue;
		mmnClient: MmnClient;
	};
};

export type GetThunkAPIWithMezon = GetThunkAPI<AsyncThunkConfigWithMezon>;
