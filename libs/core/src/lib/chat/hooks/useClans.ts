import {
	ClansEntity,
	clansActions,
	selectAllClans,
	selectCurrentClan,
	selectCurrentClanId,
	useAppDispatch,
	userClanProfileActions
} from '@mezon/store';
import { MezonUpdateClanDescBody } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useClans() {
	const dispatch = useAppDispatch();
	const clans = useSelector(selectAllClans);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClan = useSelector(selectCurrentClan);

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
			const action = await dispatch(clansActions.createClan({ clan_name: name, logo: logoUrl }));
			const payload = action.payload as ClansEntity;
			if (payload?.clan_id) {
				changeCurrentClan(payload?.clan_id);
			}
			return payload;
		},
		[changeCurrentClan, dispatch]
	);

	const updateClan = React.useCallback(
		async ({ clan_id, request }: { clan_id: string; request: MezonUpdateClanDescBody }) => {
			await dispatch(
				clansActions.updateClan({
					clan_id,
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
			currentClan,
			setClanShowNumEvent,
			getUserClanProfile,
			updateUserClanProfile,
			createClans,
			updateClan,
			deleteClan
		}),
		[clans, currentClanId, currentClan, setClanShowNumEvent, getUserClanProfile, updateUserClanProfile, createClans, updateClan, deleteClan]
	);
}
