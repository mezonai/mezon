import { IJoinSFU, LoadingStatus } from '@mezon/utils';
import { EntityState, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { SFUSignalingFwd, SFUSignalingType } from 'mezon-js';

export const JOIN_SFU_FEATURE_KEY = 'joinSFU';

/*
 * Update these interfaces according to your requirements.
 */
export interface JoinSFUEntity extends IJoinSFU {
	id: string; // Primary ID
}

export interface JoinSFUState extends EntityState<JoinSFUEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	joinSFUData: SFUSignalingFwd;
}

export const JoinSFUAdapter = createEntityAdapter<JoinSFUEntity>();

export const initialJoinSFUState: JoinSFUState = JoinSFUAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	joinSFUData: {
		data_type: 0,
		json_data: '',
		clan_id: '',
		channel_id: '',
		user_id: ''
	}
});

export const JoinSFUSlice = createSlice({
	name: JOIN_SFU_FEATURE_KEY,
	initialState: initialJoinSFUState,
	reducers: {
		add: JoinSFUAdapter.addOne,
		clear: (state) => {
			if (JoinSFUAdapter.getSelectors().selectIds(state).length === 0) return;
			JoinSFUAdapter.removeAll(state);
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const JoinSFUReducer = JoinSFUSlice.reducer;

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
export const JoinSFUActions = {
	...JoinSFUSlice.actions
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
const { selectEntities } = JoinSFUAdapter.getSelectors();

export const getJoinSFUState = (rootState: { [JOIN_SFU_FEATURE_KEY]: JoinSFUState }): JoinSFUState => {
	return rootState[JOIN_SFU_FEATURE_KEY];
};

export const selectJoinSFUEntities = createSelector(getJoinSFUState, selectEntities);

export const selectJoinSFUByChannelId = createSelector([selectJoinSFUEntities, (state, userId) => userId], (entities, userId) => {
	const joins = Object.values(entities);
	if (!joins?.length) return null;
	return joins.filter((joinsfu) => joinsfu && joinsfu.joinSFUData?.user_id === userId);
});

export const selectTalkingUser = createSelector([selectJoinSFUEntities, (state, userId) => userId], (entities, userId) => {
	const talks = Object.values(entities);
	// TODO: add data type for talking
	return talks.filter((talk) => talk && talk.joinSFUData?.user_id === userId && talk.joinSFUData?.data_type === SFUSignalingType.TALK);
});
