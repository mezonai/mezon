import { IJoinPtt, LoadingStatus } from '@mezon/utils';
import { EntityState, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { JoinPTTChannel } from 'mezon-js';

export const JOIN_PTT_FEATURE_KEY = 'joinPTT';

/*
 * Update these interfaces according to your requirements.
 */
export interface JoinPTTEntity extends IJoinPtt {
	id: string; // Primary ID
}

export interface JoinPTTState extends EntityState<JoinPTTEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	joinPttData: JoinPTTChannel;
}

export const JoinPTTAdapter = createEntityAdapter<JoinPTTEntity>();

export const initialJoinPTTState: JoinPTTState = JoinPTTAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	joinPttData: {
		data_type: 0,
		json_data: '',
		clan_id: '',
		channel_id: '',
		receiver_id: '',
		is_talk: false
	}
});

export const JoinPTTSlice = createSlice({
	name: JOIN_PTT_FEATURE_KEY,
	initialState: initialJoinPTTState,
	reducers: {
		add: JoinPTTAdapter.addOne,
		addMany: JoinPTTAdapter.addMany,
		remove: JoinPTTAdapter.removeOne,
		clear: JoinPTTAdapter.removeAll
	}
});

/*
 * Export reducer for store configuration.
 */
export const JoinPTTReducer = JoinPTTSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const JoinPTTActions = {
	...JoinPTTSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = JoinPTTAdapter.getSelectors();

export const getJoinPTTState = (rootState: { [JOIN_PTT_FEATURE_KEY]: JoinPTTState }): JoinPTTState => {
	return rootState[JOIN_PTT_FEATURE_KEY];
};

export const selectAllJoinPTT = createSelector(getJoinPTTState, selectAll);

export const selectJoinPTTEntities = createSelector(getJoinPTTState, selectEntities);

export const selectJoinPTTByChannelId = createSelector([selectJoinPTTEntities, (state, userId) => userId], (entities, userId) => {
	const joins = Object.values(entities);
	return joins.filter((joinptt) => joinptt && joinptt.joinPttData?.receiver_id === userId);
});
