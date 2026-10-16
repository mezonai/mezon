import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ClansEntity } from '../clans/clans.slice';

export const SETTING_USER_FEATURE_KEY = 'settingsUser';

export interface ClanGroup {
	id: string;
	name?: string;
	clanIds: string[];
	isExpanded: boolean;
	createdAt?: number;
}

export interface ClanGroupItem {
	type: 'clan' | 'group';
	id: string;
	clanId?: string;
	groupId?: string;
}
const clanGroupAdapter = createEntityAdapter<ClanGroup>();

export interface SettingState {
	pinnedDms?: string[];
	clansOrder?: string[];
	// Add clan groups state
	clanGroups: EntityState<ClanGroup, string>;
	clanGroupOrder: ClanGroupItem[];
}

export const initialSettingState = {
	pinnedDms: [] as string[],
	clansOrder: [] as string[],
	clanGroups: clanGroupAdapter.getInitialState(),
	clanGroupOrder: [] as ClanGroupItem[]
};
export const SettingSlice = createSlice({
	name: SETTING_USER_FEATURE_KEY,
	initialState: initialSettingState,
	reducers: {
		togglePinDm: (state, action: PayloadAction<{ dmId: string }>) => {
			if (!state.pinnedDms) {
				state.pinnedDms = [];
			}
			const index = state.pinnedDms.indexOf(action.payload.dmId);
			if (index > -1) {
				state.pinnedDms.splice(index, 1);
			} else {
				state.pinnedDms.push(action.payload.dmId);
			}
		},
		removePinDm: (state, action: PayloadAction<{ dmId: string }>) => {
			if (!action.payload.dmId) return;
			if (!state.pinnedDms) {
				state.pinnedDms = [];
			}
			state.pinnedDms = state.pinnedDms.filter((id) => id !== action.payload.dmId);
		},
		updateClansOrder: (state, action: PayloadAction<string[]>) => {
			state.clansOrder = action.payload;
		},
		createClanGroup: (state, action: PayloadAction<{ clanIds: string[]; name?: string }>) => {
			const { clanIds, name } = action.payload;
			const groupId = `group_${Date.now()}`;

			const newGroup: ClanGroup = {
				id: groupId,
				name,
				clanIds,
				isExpanded: false,
				createdAt: Date.now()
			};

			clanGroupAdapter.addOne(state.clanGroups, newGroup);

			const newOrder: ClanGroupItem[] = [];
			const processedClanIds = new Set<string>();

			newOrder.push({
				type: 'group',
				id: groupId,
				groupId
			});

			clanIds.forEach((id) => processedClanIds.add(id));

			state.clanGroupOrder.forEach((item) => {
				if (item.type === 'clan' && item.clanId && !processedClanIds.has(item.clanId)) {
					newOrder.push(item);
				} else if (item.type === 'group') {
					newOrder.push(item);
				}
			});

			state.clanGroupOrder = newOrder;
		},
		addClanToGroup: (state, action: PayloadAction<{ groupId: string; clanId: string }>) => {
			const { groupId, clanId } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group && !group.clanIds.includes(clanId)) {
				group.clanIds.push(clanId);

				state.clanGroupOrder = state.clanGroupOrder.filter((item) => !(item.type === 'clan' && item.clanId === clanId));
			}
		},
		removeClanFromGroup: (state, action: PayloadAction<{ groupId: string; clanId: string }>) => {
			const { groupId, clanId } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.clanIds = group.clanIds.filter((id) => id !== clanId);

				if (group.clanIds.length === 1) {
					const remainingClanId = group.clanIds[0];
					clanGroupAdapter.removeOne(state.clanGroups, groupId);

					const groupIndex = state.clanGroupOrder.findIndex((item) => item.type === 'group' && item.groupId === groupId);
					if (groupIndex !== -1) {
						state.clanGroupOrder[groupIndex] = {
							type: 'clan',
							id: remainingClanId,
							clanId: remainingClanId
						};
						state.clanGroupOrder.splice(groupIndex + 1, 0, {
							type: 'clan',
							id: clanId,
							clanId
						});
					}
				} else {
					const groupIndex = state.clanGroupOrder.findIndex((item) => item.type === 'group' && item.groupId === groupId);

					if (groupIndex !== -1) {
						state.clanGroupOrder.splice(groupIndex + 1, 0, {
							type: 'clan',
							id: clanId,
							clanId
						});
					}
				}
			}
		},

		reorderClansInGroup: (state, action: PayloadAction<{ groupId: string; clanIds: string[] }>) => {
			const { groupId, clanIds } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.clanIds = clanIds;
			}
		},

		toggleGroupExpanded: (state, action: PayloadAction<string>) => {
			const groupId = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.isExpanded = !group.isExpanded;
			}
		},

		collapseAllGroups: (state) => {
			Object.values(state.clanGroups.entities).forEach((group) => {
				if (group && group.isExpanded) {
					group.isExpanded = false;
				}
			});
		},

		updateClanGroupOrder: (state, action: PayloadAction<ClanGroupItem[]>) => {
			state.clanGroupOrder = action.payload;
		},

		initializeClanGroupOrder: (state, action: PayloadAction<string[]>) => {
			if (state.clanGroupOrder.length === 0) {
				const order = state.clansOrder || action.payload;
				state.clanGroupOrder = order.map((clanId) => ({
					type: 'clan' as const,
					id: clanId,
					clanId
				}));
			}
		},
		clearClanGroups: (state) => {
			state.clanGroups = clanGroupAdapter.getInitialState();
			state.clanGroupOrder = [];
		}
	}
});
export const settingUserReducer = SettingSlice.reducer;

export const settingActions = {
	...SettingSlice.actions
};
export const getSettingState = (rootState: { [SETTING_USER_FEATURE_KEY]: SettingState }): SettingState => rootState[SETTING_USER_FEATURE_KEY];

export const selectPinnedDms = createSelector(getSettingState, (state) => state.pinnedDms || []);

export const selectClanGroups = createSelector(getSettingState, (state) => clanGroupAdapter.getSelectors().selectAll(state.clanGroups));

export const selectClanGroupOrder = createSelector(getSettingState, (state) => state?.clanGroupOrder || []);
export const selectOrderedClansWithGroups = createSelector(
	[(_, clans: ClansEntity[]) => clans, selectClanGroups, selectClanGroupOrder],
	(clans, groups, order) => {
		if (!order || order.length === 0) {
			return clans.map((clan) => ({
				type: 'clan' as const,
				id: clan.id,
				clan
			}));
		}

		const clanMap = Object.fromEntries(clans.map((clan) => [clan.id, clan]));
		const groupMap = Object.fromEntries(groups.map((group) => [group.id, group]));

		const clansInGroups = new Set<string>();
		groups.forEach((group) => {
			group.clanIds.forEach((clanId) => clansInGroups.add(clanId));
		});

		const orderedItems = order
			.map((item) => {
				if (item.type === 'clan' && item.clanId) {
					const clan = clanMap[item.clanId];
					return clan ? { type: 'clan' as const, id: item.id, clan } : null;
				} else if (item.type === 'group' && item.groupId) {
					const group = groupMap[item.groupId];
					return group ? { type: 'group' as const, id: item.id, group } : null;
				}
				return null;
			})
			.filter(Boolean);

		const orderedClanIds = new Set(
			order
				.filter((item) => item.type === 'clan')
				.map((item) => item.clanId)
				.filter(Boolean)
		);

		const remainingClans = clans
			.filter((clan) => !clansInGroups.has(clan.id) && !orderedClanIds.has(clan.id))
			.map((clan) => ({
				type: 'clan' as const,
				id: clan.id,
				clan
			}));

		return [...orderedItems, ...remainingClans];
	}
);
