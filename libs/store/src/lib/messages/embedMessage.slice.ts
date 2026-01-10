import { LoadingStatus } from '@mezon/utils';
import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

export const EMBED_MESSAGE = 'EMBED_MESSAGE';

export interface FormDataEmbed {
	id: string;
	value: string;
}
export interface EmbedState {
	loadingStatus: LoadingStatus;
	formDataEmbed: Record<string, { [key: string]: string[] | string }>;
	optionsForm: Record<string, FormDataEmbed[]>;
}

export const initialEmbedState: EmbedState = {
	loadingStatus: 'not loaded',
	formDataEmbed: {},
	optionsForm: {}
};

export const embedSlice = createSlice({
	name: EMBED_MESSAGE,
	initialState: initialEmbedState,
	reducers: {
		addEmbedValue: (state, action: PayloadAction<{ messageId: string; data: FormDataEmbed; multiple?: boolean; onlyChooseOne?: boolean }>) => {
			const { messageId, data, multiple, onlyChooseOne } = action.payload;
			if (multiple) {
				if (!state.formDataEmbed[messageId]) {
					state.formDataEmbed[messageId] = {
						[data.id]: [data.value]
					};
				} else {
					const dataCurrent = state.formDataEmbed[messageId][data.id];
					if (Array.isArray(dataCurrent) && dataCurrent.includes(data.value)) {
						state.formDataEmbed[messageId][data.id] = dataCurrent.filter((item) => item !== data.value);
						return;
					}
					state.formDataEmbed[messageId][data.id] = dataCurrent ? [...dataCurrent, data.value] : [data.value];
				}
				return;
			} else {
				if (!state.formDataEmbed[messageId]) {
					state.formDataEmbed[messageId] = {
						[data.id]: data.value
					};
					return;
				}
				state.formDataEmbed[messageId] = {
					...state.formDataEmbed[messageId],
					[data.id]: data.value
				};
				return;
			}
		},
		removeEmbedValuel: (state, action: PayloadAction<{ messageId: string; data: FormDataEmbed; multiple?: boolean }>) => {
			const { messageId, data, multiple } = action.payload;
			if (state.formDataEmbed[messageId]?.[data.id] && multiple) {
				state.formDataEmbed[messageId][data.id] = [...state.formDataEmbed[messageId][data.id]].filter((item) => item !== data.value);
				return;
			}
			if (state.formDataEmbed[messageId][data.id]) {
				state.formDataEmbed[messageId][data.id] = [];
			}
		}
	}
});

export const embedReducer = embedSlice.reducer;

export const embedActions = {
	...embedSlice.actions
};

export const getEmbedState = (rootState: { [EMBED_MESSAGE]: EmbedState }): EmbedState => rootState[EMBED_MESSAGE];

export const selectDataFormEmbedByMessageId = createSelector([getEmbedState, (state, messageId: string) => messageId], (state, messageId) => {
	return state.formDataEmbed?.[messageId];
});
