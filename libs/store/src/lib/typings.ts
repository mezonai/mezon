import type { MezonAdminContextValue, MezonContextValue } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';

export type AsyncThunkConfigWithMezon = {
	extra: {
		mezon: MezonContextValue;
	};
};

export type GetThunkAPIWithMezon = GetThunkAPI<AsyncThunkConfigWithMezon>;

export type AsyncThunkConfigWithAdmin = {
	extra: {
		mezon: MezonAdminContextValue;
	};
};

export type GetThunkAPIWithAdmin = GetThunkAPI<AsyncThunkConfigWithAdmin>;
