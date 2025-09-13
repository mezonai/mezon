import { MezonContextValue } from '@mezon/transport';
import { MmnClient } from '@mezonai/mmn-client-js';
import { GetThunkAPI } from '@reduxjs/toolkit';

export type AsyncThunkConfigWithMezon = {
	extra: {
		mezon: MezonContextValue;
		mmnClient: MmnClient;
	};
};

export type GetThunkAPIWithMezon = GetThunkAPI<AsyncThunkConfigWithMezon>;
