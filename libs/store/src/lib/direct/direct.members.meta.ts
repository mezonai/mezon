import { IUserItemActivity } from '@mezon/utils';
import { EntityState, PayloadAction, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

export const DIRECTMEMBERSMETA_FEATURE_KEY = 'directmembersmeta';

export interface DirectMembersMetaState extends EntityState<IUserItemActivity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
}

const directMembersMetaAdapter = createEntityAdapter<IUserItemActivity>();

export const initialDirectMembersMetaState: DirectMembersMetaState = directMembersMetaAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const directMembersMetaSlice = createSlice({
	name: DIRECTMEMBERSMETA_FEATURE_KEY,
	initialState: initialDirectMembersMetaState,
	reducers: {
		updateBulkMetadata: (state, action: PayloadAction<IUserItemActivity[]>) => {
			directMembersMetaAdapter.upsertMany(state, action.payload);
		},
		updateUserStatus: (state, action: PayloadAction<{ userId: string; user_status: any }>) => {
			const { userId, user_status } = action.payload;
			const directMembersMeta = state.entities[userId];
			if (directMembersMeta) {
				directMembersMeta.user = directMembersMeta.user || {};
				directMembersMeta.user.metadata = directMembersMeta.user.metadata || {};
				directMembersMeta.user.metadata.user_status = user_status;
			}
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const directMembersMetaReducer = directMembersMetaSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 */
export const directMembersMetaActions = {
	...directMembersMetaSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 */
const { selectAll, selectEntities } = directMembersMetaAdapter.getSelectors();

export const getDirectMembersMetaState = (rootState: { [DIRECTMEMBERSMETA_FEATURE_KEY]: DirectMembersMetaState }): DirectMembersMetaState =>
	rootState[DIRECTMEMBERSMETA_FEATURE_KEY];

export const selectAllDirectMembersMeta = createSelector(getDirectMembersMetaState, selectAll);

export const selectDirectMembersMetaEntities = createSelector(getDirectMembersMetaState, selectEntities);

export const selectDirectMemberMetaUserId = createSelector(
	[selectDirectMembersMetaEntities, (_, userId: string) => userId],
	(entities, userId) => entities[userId]
);
