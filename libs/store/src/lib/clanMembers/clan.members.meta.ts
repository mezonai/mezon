import type { UsersClanEntity } from '@mezon/utils';
import { EUserStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { StatusUserArgs } from '../channelmembers/channel.members';
import type { RootState } from '../store';

export const CLANMEMBERSMETA_FEATURE_KEY = 'clanMembersMeta';

export interface ClanMembersMetaEntity {
	id: string;
	online: boolean;
	isMobile: boolean;
	status: any;
}

export interface ClanMembersMetaState extends EntityState<ClanMembersMetaEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
}

const clanMembersMetaAdapter = createEntityAdapter<ClanMembersMetaEntity>();

export const initialClanMembersMetaState: ClanMembersMetaState = clanMembersMetaAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export function extracMeta(user: UsersClanEntity, state: RootState): ClanMembersMetaEntity {
	const isMe = state?.account?.userProfile?.user?.id === user?.user?.id;
	const isUserInvisible = user?.user?.user_status === EUserStatus.INVISIBLE;
	return {
		id: user.id,
		online: (!isUserInvisible && !!user?.user?.online) || (!isUserInvisible && isMe),
		isMobile: !isUserInvisible && !!user?.user?.is_mobile,
		status: user?.user?.user_status
	};
}

export const clanMembersMetaSlice = createSlice({
	name: CLANMEMBERSMETA_FEATURE_KEY,
	initialState: initialClanMembersMetaState,
	reducers: {
		addOne: clanMembersMetaAdapter.addOne,
		removeOne: clanMembersMetaAdapter.removeOne,
		updateOne: clanMembersMetaAdapter.updateOne,
		setClanMembersMetaStatus: (state, action: PayloadAction<{ userId: string; online: boolean; isMobile: boolean }>) => {
			const clanMembersMeta = state.entities[action.payload.userId];
			if (clanMembersMeta) {
				clanMembersMeta.online = action.payload.online;
				clanMembersMeta.isMobile = action.payload.isMobile;
			}
		},
		updateBulkMetadata: (state, action: PayloadAction<ClanMembersMetaEntity[]>) => {
			clanMembersMetaAdapter.upsertMany(state, action.payload);
		},
		setManyStatusUser: (state, action: PayloadAction<StatusUserArgs[]>) => {
			action.payload.forEach((statusUser) => {
				const clanMemberMeta = state.entities[statusUser.userId];
				if (clanMemberMeta) {
					clanMemberMeta.online = statusUser.online;
					clanMemberMeta.isMobile = statusUser.isMobile;
				}
			});
		},
		updateUserStatus: (state, action: PayloadAction<{ userId: string; user_status: any }>) => {
			const { userId, user_status } = action.payload;
			const clanMembersMeta = state.entities[userId];
			if (clanMembersMeta) {
				clanMembersMeta.status = user_status;
				clanMembersMeta.online = user_status !== EUserStatus.INVISIBLE;
			}
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const clanMembersMetaReducer = clanMembersMetaSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 */
export const clanMembersMetaActions = {
	...clanMembersMetaSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 */
const { selectAll, selectEntities } = clanMembersMetaAdapter.getSelectors();

export const getClanMembersMetaState = (rootState: { [CLANMEMBERSMETA_FEATURE_KEY]: ClanMembersMetaState }): ClanMembersMetaState =>
	rootState[CLANMEMBERSMETA_FEATURE_KEY];

export const selectAllClanMembersMeta = createSelector(getClanMembersMetaState, selectAll);

export const selectClanMembersMetaEntities = createSelector(getClanMembersMetaState, selectEntities);

export const selectClanMemberMetaUserId = createSelector(
	[selectClanMembersMetaEntities, (_, userId: string) => userId],
	(entities, userId) => entities[userId]
);
