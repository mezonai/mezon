import type { ClansEntity } from '@mezon/store';
import { clansActions, selectAllClans, selectCurrentClanId, useAppDispatch, userClanProfileActions } from '@mezon/store';
import type { MezonUpdateClanDescBody } from 'mezon-js/types';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useClans() {
	const dispatch = useAppDispatch();
	const clans = useSelector(selectAllClans);
	const currentClanId = useSelector(selectCurrentClanId);

	const setClanShowNumEvent = React.useCallback(
		async (status: boolean) => {
			await dispatch(clansActions.setClanShowNumEvent({ clanId: currentClanId || '', status }));
		},
		[dispatch, currentClanId]
	);

	const changeCurrentClan = React.useCallback(
		async (clanId: string) => {
			await dispatch(clansActions.changeCurrentClan({ clanId }));
		},
		[dispatch]
	);

	const getUserClanProfile = React.useCallback(
		async (clanId: string) => {
			await dispatch(userClanProfileActions.fetchUserClanProfile({ clanId }));
		},
		[dispatch]
	);

	const updateUserClanProfile = React.useCallback(
		async (clanId: string, name: string, logoUrl: string) => {
			const action = await dispatch(
				userClanProfileActions.updateUserClanProfile({
					clanId,
					username: name,
					avatarUrl: logoUrl
				})
			);
			const payload = action.payload;
			return payload;
		},
		[dispatch]
	);

	const createClans = React.useCallback(
		async (name: string, logoUrl: string) => {
			const action = await dispatch(clansActions.createClan({ clanName: name, logo: logoUrl }));
			const payload = action.payload as ClansEntity;
			if (payload?.clanId) {
				changeCurrentClan(payload?.clanId);
			}
			return payload;
		},
		[changeCurrentClan, dispatch]
	);

	const updateClan = React.useCallback(
		async ({ clanId, request }: { clanId: string; request: MezonUpdateClanDescBody }) => {
			await dispatch(
				clansActions.updateClan({
					clanId,
					request
				})
			);
		},
		[dispatch]
	);

	const deleteClan = React.useCallback(
		async ({ clanId }: { clanId: string }) => {
			await dispatch(clansActions.deleteClan({ clanId }));
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			clans,
			currentClanId,
			setClanShowNumEvent,
			getUserClanProfile,
			updateUserClanProfile,
			createClans,
			updateClan,
			deleteClan
		}),
		[clans, currentClanId, setClanShowNumEvent, getUserClanProfile, updateUserClanProfile, createClans, updateClan, deleteClan]
	);
}
